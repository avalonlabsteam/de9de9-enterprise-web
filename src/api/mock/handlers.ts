// Mock API route table for the Entreprise app. One flat file, grouped by feature.
// Reads serve from db; mutations apply the canonical status transitions. Feature
// api hooks own zod validation on the response side (BUILD-SPEC §8).
import { register } from './router';
import { ok, notFound, badRequest, problem, field } from './http';
import {
  db,
  nextId,
  tenderById,
  b2bJobById,
  workerById,
  currentOcc,
  type Tender,
  type Worker,
  type Facture,
  type FactureStatus,
} from './db';
import { CATALOGUE, FAMILY_BY_ID } from '@/lib/catalogue';
import { statusDef, type Occurrence, type VisiteCode } from '@/lib/statusModel';

// ===================== infra =====================
register('GET', '/health', () => ok({ status: 'ok' }));

// ===================== auth / onboarding =====================
type Role = 'client' | 'prestataire';

/** Tokens + user, the core every auth answer carries. */
function sessionCore(role: Role) {
  return {
    accessToken: `mock-${role}-token`,
    accessTokenExpiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    refreshToken: `mock-${role}-refresh`,
    refreshTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
    user: {
      userId: 'user-5001',
      email: 'contact@plombex.dz',
      role: role === 'client' ? 'ClientAdmin' : 'PrestataireAdmin',
      companyId: 'company-3f2a',
      companyType: role === 'client' ? 'Client' : 'Prestataire',
      activeRole: role,
      availableRoles: ['client', 'prestataire'],
      language: 'fr',
    },
  };
}

// ---- client home (`accueil.client`), derived from the rows the Demandes,
// Crédits and Factures pages read, so every screen shows the same numbers.

/** Today as YYYY-MM-DD, in the browser's zone. */
function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** An occurrence date as YYYY-MM-DD (ISO or dd/mm/yyyy in). */
function dayOf(date: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(date);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : date.slice(0, 10);
}

/** Every visit cancelled. The mock has no request deadline, so that case never arises. */
function isAnnulee(t: Tender): boolean {
  return t.occurrences.length > 0 && t.occurrences.every((o) => o.status === 'cancelled');
}

function facturesDzd(status: Facture['status']): number {
  return db.factures.filter((f) => f.status === status).reduce((sum, f) => sum + f.amountDzd, 0);
}

/**
 * Visits counted the guide's way: V0 and later-day V1–V3 are « à venir »;
 * today/overdue V1–V3, V4, V5 and V5·C « en cours »; V6–V7 « complètes »; V✕
 * never. Approximation: « today » is the browser's day, not Algiers time, and
 * the seed dates are fixed, so seeded visits drift into « en cours » as they pass.
 */
function clientCompteurs() {
  const now = today();
  const c = { aVenir: 0, enCours: 0, completes: 0 };
  for (const o of db.tenders.flatMap((t) => t.occurrences)) {
    switch (o.status) {
      case 'added':
        c.aVenir += 1;
        break;
      case 'toConfirm':
      case 'confirmed':
      case 'confirmedAssigned':
        if (dayOf(o.date) > now) c.aVenir += 1;
        else c.enCours += 1;
        break;
      case 'doneNoInvoice':
      case 'doneInvoiced':
      case 'doneDisputed':
        c.enCours += 1;
        break;
      case 'doneApproved':
      case 'paid':
        c.completes += 1;
        break;
      case 'cancelled':
        break;
    }
  }
  return { ...c, facturesAApprouver: db.factures.filter((f) => f.status === 'waiting').length };
}

/** One « Demandes récentes » card: S1–S4 from the setup step, S5 once contracted. */
function demandeRecente(t: Tender) {
  const fam = FAMILY_BY_ID[t.familyId];
  const setup = t.setup ? statusDef(t.setup) : null;
  const annulee = isAnnulee(t);
  return {
    id: t.id,
    titre: t.serviceName,
    categorieCode: t.familyId,
    categorie: fam?.name.fr,
    // Each catalogue family already carries its emoji.
    icone: fam?.icon ?? null,
    // `cancelDemand` clears the setup step too, so a cancelled request reads S5;
    // the screen goes by `annulee` and the label.
    statut: setup?.num ?? 'S5',
    statutLabel: annulee ? 'Annulée' : (setup?.fr ?? 'Contractualisé'),
    annulee,
    creeLe: t.createdAt,
  };
}

/** The client home, as `accueil.client` and `GET /client/accueil` send it. */
function clientAccueil() {
  const soldeCredits = db.wallet.balanceCredits;
  // 1 DA = 10 credits; a contested invoice freezes its amount until resolved.
  const bloquesCredits = facturesDzd('contested') * 10;
  const disponiblesCredits = soldeCredits - bloquesCredits;
  return {
    entreprise: {
      ...db.clientEntreprise,
      // An authenticated file URL in production; null shows the initials.
      logoUrl: null,
      verifie: db.kyc.statut === 'verified',
      kycStatut: db.kyc.statut,
    },
    activeRole: 'client' as const,
    availableRoles: ['client', 'prestataire'],
    compteurs: clientCompteurs(),
    credits: {
      soldeCredits,
      bloquesCredits,
      disponiblesCredits,
      disponiblesDzd: Math.floor(disponiblesCredits / 10),
    },
    demandes: {
      enCours: db.tenders.filter((t) => t.setup !== null && !isAnnulee(t)).length,
      recentes: [...db.tenders]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5)
        .map(demandeRecente),
    },
    // Approved covers paid: the mock's factures stop at approved.
    depenses: { totalDzd: facturesDzd('approved'), aApprouverDzd: facturesDzd('waiting') },
  };
}

/** A just-registered company's client home: every counter 0, nothing listed. */
function emptyClientAccueil(id: string, nom: string, nomUtilisateur: string) {
  return {
    entreprise: { id, nom, logoUrl: null, verifie: false, kycStatut: 'pending', nomUtilisateur },
    activeRole: 'client' as const,
    availableRoles: ['client', 'prestataire'],
    compteurs: { aVenir: 0, enCours: 0, completes: 0, facturesAApprouver: 0 },
    credits: { soldeCredits: 0, bloquesCredits: 0, disponiblesCredits: 0, disponiblesDzd: 0 },
    demandes: { enCours: 0, recentes: [] },
    depenses: { totalDzd: 0, aApprouverDzd: 0 },
  };
}

/**
 * The home the backend builds and ships inside the answer: `role` names the
 * filled block, the other side is null.
 */
function accueilFor(role: Role) {
  return role === 'prestataire'
    ? { role, prestataire: db.accueil, client: null }
    : { role, prestataire: null, client: clientAccueil() };
}

/** Trimmed string body field, '' when absent. */
function text(body: unknown, key: string): string {
  const value = field<unknown>(body, key);
  return typeof value === 'string' ? value.trim() : '';
}

function invalid(name: string, detail: string) {
  return problem(400, 'validation_failed', `${name} : ${detail}`, name);
}

function isRegistered(email: string): boolean {
  return db.auth.registeredEmails.some((e) => e.toLowerCase() === email.toLowerCase());
}

// Password sign-in: any non-empty password opens a known e-mail. The session
// opens on the last active side; before any switch, on the sample's own side
// (contact@plombex.dz → prestataire, anyone else → client).
register('POST', '/auth/login', (req) => {
  const email = text(req.body, 'email');
  const password = field<unknown>(req.body, 'password');
  if (!email) return invalid('email', "l'adresse e-mail est obligatoire.");
  if (typeof password !== 'string' || !password.trim()) {
    return invalid('password', 'le mot de passe est obligatoire.');
  }
  if (!isRegistered(email)) {
    return problem(401, 'invalid_credentials', 'E-mail ou mot de passe incorrect.');
  }
  const role = db.auth.lastRole ?? (email.toLowerCase() === 'contact@plombex.dz' ? 'prestataire' : 'client');
  return ok({ ...sessionCore(role), accueil: accueilFor(role), onboarding: onboardingOf() });
});

// `POST /auth/register` serves both sign-up screens. No role is sent: every
// company is created with both, and `proCount` only decides which side this
// first session opens on. Validation mirrors the real API so the screens can be
// exercised against their error states (the 429 rate limit is not simulated).
const PHONE_RE = /^0(?:[5-7]\d{8}|\d{8})$/;
const MOBILE_RE = /^0[5-7]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

register('POST', '/auth/register', (req) => {
  if (!req.body || typeof req.body !== 'object') {
    return problem(400, 'validation_failed', 'Corps de requête vide.');
  }

  const lastName = text(req.body, 'lastName');
  const firstName = text(req.body, 'firstName');
  const companyName = text(req.body, 'companyName');
  const rc = text(req.body, 'rc');
  const email = text(req.body, 'email');
  const password = typeof field<unknown>(req.body, 'password') === 'string' ? String(field(req.body, 'password')) : '';
  const rawPhone = text(req.body, 'telephone');
  const proCountRaw = field<unknown>(req.body, 'proCount');

  if (!lastName) return invalid('lastName', 'le nom est obligatoire.');
  if (lastName.length > 100) return invalid('lastName', '100 caractères maximum.');
  if (!firstName) return invalid('firstName', 'le prénom est obligatoire.');
  if (firstName.length > 100) return invalid('firstName', '100 caractères maximum.');
  if (!companyName) return invalid('companyName', "le nom de l'entreprise est obligatoire.");
  if (companyName.length > 200) return invalid('companyName', '200 caractères maximum.');
  if (!rc) return invalid('rc', 'le numéro du registre de commerce est obligatoire.');
  if (rc.length > 64) return invalid('rc', '64 caractères maximum.');
  if (!/\d/.test(rc)) return invalid('rc', 'le registre de commerce doit contenir des chiffres.');
  if (!EMAIL_RE.test(email)) return invalid('email', "l'adresse e-mail est invalide.");
  if (email.length > 256) return invalid('email', '256 caractères maximum.');
  if (password.length < 8 || !/\d/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return invalid('password', '8 caractères minimum, dont 1 chiffre, 1 minuscule et 1 majuscule.');
  }

  const phone = rawPhone.replace(/[\s.\-()]/g, '').replace(/^(?:\+213|00213)/, '0');
  if (rawPhone && !PHONE_RE.test(phone)) return invalid('telephone', 'numéro algérien invalide.');

  let proCount: number | undefined;
  if (proCountRaw !== undefined && proCountRaw !== null) {
    const n = Number(proCountRaw);
    if (!Number.isInteger(n) || n < 1 || n > 10_000) {
      return invalid('proCount', 'indiquez un nombre entier entre 1 et 10 000.');
    }
    proCount = n;
  }

  if (isRegistered(email)) {
    return problem(409, 'email_taken', 'Un compte existe déjà avec cette adresse e-mail.', 'email');
  }
  db.auth.registeredEmails.push(email);
  if (rawPhone) {
    db.auth.telephoneEntreprise = phone;
    if (MOBILE_RE.test(phone)) db.auth.telephone = phone;
  }

  const activeRole = proCount === undefined ? 'client' : 'prestataire';
  const companyType = activeRole === 'client' ? 'Client' : 'Prestataire';
  const mobile = rawPhone && MOBILE_RE.test(phone) ? phone : null;
  const companyId = nextId('company');

  return {
    status: 201,
    data: {
      accessToken: `mock-${activeRole}-token`,
      accessTokenExpiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      refreshToken: `mock-${activeRole}-refresh`,
      refreshTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
      user: {
        userId: nextId('user'),
        email,
        role: activeRole === 'client' ? 'ClientAdmin' : 'PrestataireAdmin',
        companyId,
        companyType,
        activeRole,
        availableRoles: ['client', 'prestataire'],
        language: 'fr',
      },
      isNewAccount: true,
      linkedToExistingAccount: false,
      // A just-registered company has no services and no logo yet (guide § 6),
      // and on the client side no requests, credits or invoices either.
      accueil:
        activeRole === 'prestataire'
          ? {
              role: activeRole,
              prestataire: {
                entreprise: { id: companyId, nom: companyName, logoUrl: null, verifie: false, kycStatut: 'pending', certifie: false, nomUtilisateur: `${firstName} ${lastName}` },
                activeRole,
                availableRoles: ['client', 'prestataire'],
                compteurs: { aVenir: 0, enCours: 0, completes: 0, b2b: null, b2c: null },
                annonces: [],
                equipe: { ouvriers: 0, contractuels: 0, total: 0 },
                chiffreAffaires: { totalDzd: 0, b2bDzd: 0, b2bNetDzd: 0, b2cDzd: 0 },
                b2c: { statut: 'en_attente', donneesDisponibles: true },
              },
              client: null,
            }
          : {
              role: activeRole,
              prestataire: null,
              client: emptyClientAccueil(companyId, companyName, `${firstName} ${lastName}`),
            },
      onboarding: {
        // A mobile is the user's own phone, so the « Votre numéro » step is
        // already satisfied; a landline or no number leaves it to do.
        nextStep: mobile ? 'kyc' : 'telephone',
        needsPhone: !mobile,
        telephone: mobile,
        telephoneEntreprise: rawPhone ? phone : null,
        companyId,
        companyType,
        kycStatut: 'pending',
        kycStatutLabel: 'En attente',
        kycMotif: null,
        kycSoumisLe: null,
        pieces: [
          { kind: 'KycRc', label: 'Registre de Commerce', present: false, fileName: null },
          { kind: 'KycNif', label: "Numéro d'Identification Fiscale", present: false, fileName: null },
          { kind: 'KycNis', label: "Numéro d'Identification Statistique", present: false, fileName: null },
        ],
      },
    },
  };
});

/** The app-start check: is the token still good, and what is fresh since. */
register('POST', '/auth/validate-token', (req) => {
  const bearer = req.headers['authorization'] ?? '';
  if (!bearer) return { status: 401, data: { code: 'unauthorized' } };
  const role = bearer.includes('prestataire') ? 'prestataire' : 'client';
  return ok({ valid: true, user: sessionCore(role).user, accueil: accueilFor(role), onboarding: onboardingOf() });
});

/** Trade the refresh token for a new access token. */
register('POST', '/auth/refresh', (req) => {
  const refreshToken = field<string>(req.body, 'refreshToken') ?? '';
  if (!refreshToken) return problem(400, 'validation_failed', 'refreshToken manquant.', 'refreshToken');
  const role = refreshToken.includes('prestataire') ? 'prestataire' : 'client';
  const core = sessionCore(role);
  return ok({
    accessToken: core.accessToken,
    accessTokenExpiresAt: core.accessTokenExpiresAt,
    // null: the caller keeps the refresh token it already holds.
    refreshToken: null,
  });
});

/** « Votre numéro » — a mobile is the user's own phone and the company's. */
register('POST', '/auth/me/telephone', (req) => {
  const raw = (field<string>(req.body, 'telephone') ?? '').trim();
  const phone = raw.replace(/[\s.\-()]/g, '').replace(/^(?:\+213|00213)/, '0');
  if (!/^0[5-7]\d{8}$/.test(phone)) {
    return problem(400, 'validation_failed', 'telephone : mobile algérien attendu (05, 06 ou 07).', 'telephone');
  }
  const rawCompany = (field<string>(req.body, 'telephoneEntreprise') ?? '').trim();
  const company = rawCompany.replace(/[\s.\-()]/g, '').replace(/^(?:\+213|00213)/, '0');
  if (rawCompany && !/^0(?:[5-7]\d{8}|\d{8})$/.test(company)) {
    return problem(400, 'validation_failed', 'telephoneEntreprise : numéro algérien invalide.', 'telephoneEntreprise');
  }
  db.auth.telephone = phone;
  db.auth.telephoneEntreprise = rawCompany ? company : phone;
  return ok(onboardingOf());
});

/** Google / Apple: the provider's token in, the same sign-in answer out. */
for (const provider of ['google', 'apple'] as const) {
  register('POST', `/auth/${provider}`, (req) => {
    if (!field<string>(req.body, 'idToken')) {
      return problem(400, 'validation_failed', 'idToken manquant.', 'idToken');
    }
    // The last active side; before any switch the mock's social account is a pro.
    const role = db.auth.lastRole ?? 'prestataire';
    return ok({ ...sessionCore(role), accueil: accueilFor(role), onboarding: onboardingOf() });
  });
}

// « Passer en espace client / prestataire ». No body: the side is read from the
// bearer token, as the backend reads it from the session. Answers in the login
// shape, and the next sign-in on any device opens on the new side.
register('POST', '/auth/switch-role', (req) => {
  const bearer = req.headers['authorization'] ?? '';
  const current = bearer.includes('prestataire') ? 'prestataire' : 'client';
  const role = current === 'prestataire' ? 'client' : 'prestataire';
  db.auth.lastRole = role;
  const core = sessionCore(role);
  return ok({
    accessToken: core.accessToken,
    accessTokenExpiresAt: core.accessTokenExpiresAt,
    // null on purpose: the caller keeps the refresh token it already holds.
    refreshToken: null,
    user: core.user,
    accueil: accueilFor(role),
  });
});

// ===================== public contact =====================
// Landing "Nous contacter". Accepts and acknowledges; swap for the real
// endpoint (mail relay / CRM) when the backend exists.
register('POST', '/contact', () => ok({ received: true }));

// ===================== kyc =====================
// The company comes from the token, so no id travels in these URLs. de9de9
// reviews the dossier as a whole and answers verified / rejected.

/** Where onboarding stands, rebuilt from the dossier for the sign-in answers. */
function onboardingOf() {
  const submitted = !!db.kyc.soumisLe;
  const verified = db.kyc.statut === 'verified';
  const needsPhone = !db.auth.telephone;
  return {
    nextStep: needsPhone ? 'telephone' : verified ? 'termine' : submitted ? 'kyc_en_revue' : 'kyc',
    needsPhone,
    telephone: db.auth.telephone,
    telephoneEntreprise: db.auth.telephoneEntreprise,
    companyId: db.kyc.companyId,
    companyType: 'Prestataire',
    kycStatut: db.kyc.statut,
    kycStatutLabel: db.kyc.statutLabel,
    kycMotif: db.kyc.motif,
    kycSoumisLe: db.kyc.soumisLe,
    pieces: db.kyc.documents.map((d) => ({
      kind: d.kind,
      label: d.kindLabel,
      present: d.present,
      fileName: d.fileName,
    })),
  };
}

/**
 * A stale access token answers 401, so the client's refresh-and-retry is
 * exercised in mock mode too. Only the KYC routes enforce it — the rest of the
 * mock predates tokens.
 */
function unauthorized(req: { headers: Record<string, string> }) {
  const bearer = req.headers['authorization'] ?? '';
  return /Bearer mock-(client|prestataire)-token/.test(bearer)
    ? null
    : { status: 401, data: { code: 'unauthorized', detail: 'Token absent ou expiré.' } };
}

register('GET', '/kyc/dossier', (req) => unauthorized(req) ?? ok(db.kyc));

/** The authenticated file link on each KYC row (Bearer, never a bare href). */
register('GET', '/documents/:id/download', (req) => {
  const id = req.pathParams['id'] ?? '';
  const row = db.kyc.documents.find((d) => d.documentId === id);
  if (!row) return notFound('Document introuvable');
  return ok(new Blob([`Mock ${row.kindLabel} — ${row.fileName ?? ''}`], { type: 'text/plain' }));
});

/**
 * Multipart upload: each `files` part is paired by position with one `kinds`
 * field. Re-uploading a kind replaces the row on screen.
 */
register('POST', '/kyc/documents', (req) => {
  const denied = unauthorized(req);
  if (denied) return denied;
  const form = req.body as FormData | undefined;
  if (!form || typeof form.getAll !== 'function') {
    return problem(400, 'validation_failed', 'Aucun fichier reçu.');
  }
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  const kinds = form.getAll('kinds').map(String);
  if (files.length === 0) return problem(400, 'validation_failed', 'Aucun fichier reçu.');
  if (files.length !== kinds.length) {
    return problem(400, 'validation_failed', 'Autant de kinds que de fichiers sont attendus.');
  }
  if (new Set(kinds).size !== kinds.length) {
    return problem(400, 'validation_failed', 'Une même pièce est envoyée deux fois.');
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const kind = kinds[i];
    const row = db.kyc.documents.find((d) => d.kind === kind);
    if (!row) return problem(400, 'validation_failed', `Pièce inconnue : ${kind}`, 'kinds');
    if (file && file.size > 10 * 1024 * 1024) {
      return { status: 413, data: { code: 'file_too_large', detail: 'Fichier trop lourd : 10 Mo maximum.' } };
    }
    const documentId = nextId('doc');
    row.documentId = documentId;
    row.fileName = file?.name ?? null;
    row.url = `/documents/${documentId}/download`;
    row.uploadedAt = new Date().toISOString();
    row.present = true;
  }
  return { status: 201, data: db.kyc.documents };
});

/** Submit for review — no body. Missing a piece is a 422 naming what is missing. */
register('POST', '/kyc/soumettre', (req) => {
  const denied = unauthorized(req);
  if (denied) return denied;
  if (db.kyc.statut === 'verified') {
    return problem(409, 'kyc_already_verified', 'Ce dossier est déjà vérifié.');
  }
  const missing = db.kyc.documents.filter((d) => !d.present).map((d) => d.kind);
  if (missing.length > 0) {
    return {
      status: 422,
      data: {
        code: 'kyc_incomplete',
        detail: 'Le dossier est incomplet : déposez les trois pièces.',
        missing,
      },
    };
  }
  db.kyc.statut = 'pending';
  db.kyc.statutLabel = 'En attente';
  db.kyc.motif = null;
  db.kyc.soumisLe = new Date().toISOString();
  return ok(db.kyc);
});

// ===================== catalogue =====================
register('GET', '/catalogue', () => ok(CATALOGUE));
register('GET', '/catalogue/:id', (req) => {
  const fam = FAMILY_BY_ID[req.pathParams['id'] ?? ''];
  return fam ? ok(fam) : notFound('Famille introuvable');
});

// ===================== tenders (appels d'offres + suivi) =====================
register('GET', '/tenders', () => ok(db.tenders));
register('GET', '/tenders/:id', (req) => {
  const t = tenderById(req.pathParams['id'] ?? '');
  return t ? ok(t) : notFound('Demande introuvable');
});

register('POST', '/tenders', (req) => {
  const b = (req.body ?? {}) as Partial<Tender>;
  if (!b.familyId || !b.serviceName) return badRequest('familyId et serviceName requis');
  const t: Tender = {
    id: nextId('AO'),
    familyId: b.familyId,
    serviceName: b.serviceName,
    description: b.description ?? '',
    wilaya: b.wilaya ?? 'Alger',
    delai: b.delai ?? 'Flexible',
    type: b.type === 'recurrent' ? 'recurrent' : 'ponctuel',
    recurrence: b.recurrence,
    budgetDzd: b.budgetDzd,
    setup: 'arappeler',
    occurrences: [],
    createdAt: new Date().toISOString().slice(0, 10),
  };
  db.tenders.unshift(t);
  return ok(t);
});

function makeOcc(date: string, status: VisiteCode, label?: string): Occurrence {
  return { id: nextId('OCC'), date, status, label };
}

register('POST', '/tenders/:id/actions', (req) => {
  const t = tenderById(req.pathParams['id'] ?? '');
  if (!t) return notFound('Demande introuvable');
  const action = field<string>(req.body, 'action');
  const occId = field<string>(req.body, 'occId');
  const date = field<string>(req.body, 'date');
  const findOcc = (): Occurrence | undefined =>
    occId ? t.occurrences.find((o) => o.id === occId) : currentOcc(t);

  switch (action) {
    case 'chooseProvider': {
      t.setup = null;
      t.prov = { alias: 'Prestataire vérifié', note: 4.7, missions: 128 };
      if (t.occurrences.length === 0) {
        const start = date ?? new Date().toISOString().slice(0, 10);
        t.occurrences.push(makeOcc(start, 'toConfirm', t.type === 'recurrent' ? 'Occurrence 1' : undefined));
      }
      break;
    }
    case 'confirmOcc': {
      const o = findOcc();
      if (!o || o.status !== 'toConfirm') return badRequest('Occurrence non confirmable');
      o.status = 'confirmed';
      break;
    }
    case 'approveOcc': {
      const o = findOcc();
      if (!o || o.status !== 'doneInvoiced') return badRequest('Facture non approuvable');
      o.status = 'doneApproved';
      const f = db.factures.find((x) => x.tenderId === t.id && x.status === 'waiting');
      if (f) f.status = 'approved';
      break;
    }
    case 'contestOcc': {
      const o = findOcc();
      if (!o || o.status !== 'doneInvoiced') return badRequest('Facture non contestable');
      o.status = 'doneDisputed';
      o.motif = field<string>(req.body, 'motif');
      const f = db.factures.find((x) => x.tenderId === t.id && x.status === 'waiting');
      if (f) f.status = 'contested';
      break;
    }
    case 'addOcc': {
      t.occurrences.push(makeOcc(date ?? new Date().toISOString().slice(0, 10), 'toConfirm'));
      break;
    }
    case 'rescheduleOcc': {
      const o = findOcc();
      if (!o) return notFound('Occurrence introuvable');
      if (date) o.date = date;
      break;
    }
    case 'cancelOcc': {
      const o = findOcc();
      if (!o) return notFound('Occurrence introuvable');
      o.status = 'cancelled';
      break;
    }
    case 'cancelDemand': {
      t.setup = null;
      t.occurrences = [makeOcc(new Date().toISOString().slice(0, 10), 'cancelled')];
      break;
    }
    default:
      return badRequest(`Action inconnue: ${String(action)}`);
  }
  return ok(t);
});

register('POST', '/tenders/:id/reviews', (req) => {
  const t = tenderById(req.pathParams['id'] ?? '');
  if (!t) return notFound('Demande introuvable');
  return ok({ ok: true, note: field<number>(req.body, 'note') ?? 5 });
});

// ===================== wallet =====================
register('GET', '/wallet', () => ok(db.wallet));

// ===================== factures =====================
register('GET', '/factures', () => ok(db.factures));

// ===================== client home / calendar =====================
// Kept because it still exists for the de9de9 admin panel's company preview —
// the company app renders the `accueil` that came with its sign-in instead.
register('GET', '/client/accueil', () => ok(clientAccueil()));

register('GET', '/client/calendar', () => {
  const events = db.tenders.flatMap((t) =>
    t.occurrences
      .filter((o) => o.status === 'confirmed' || o.status === 'confirmedAssigned')
      .map((o) => ({ id: o.id, tenderId: t.id, title: t.serviceName, date: o.date, wilaya: t.wilaya })),
  );
  return ok(events);
});

// ===================== prestataire dashboard / stats / calendar =====================
// Kept because it still exists for the de9de9 admin panel's company preview —
// the company app renders the `accueil` that came with its sign-in instead.
register('GET', '/prestataire/accueil', () => ok(db.accueil));
register('GET', '/prestataire/stats', () => ok(db.stats));
register('GET', '/prestataire/calendar', () => ok(db.calendarEvents));

// ===================== b2c =====================
register('GET', '/b2c/reservations', () => ok(db.reservations));
register('GET', '/b2c/open-offers', () => ok(db.openOffers));
register('GET', '/b2c/sent-offers', () => ok(db.sentOffers));
register('POST', '/b2c/bids', (req) => {
  const offer = {
    id: nextId('S'),
    title: field<string>(req.body, 'title') ?? 'Offre',
    prixDzd: field<number>(req.body, 'prixDzd') ?? 0,
    delai: field<string>(req.body, 'delai') ?? '',
    message: field<string>(req.body, 'message') ?? '',
    status: 'enAttente' as const,
  };
  db.sentOffers.unshift(offer);
  return ok(offer);
});
register('POST', '/b2c/reservations/:id/affect', (req) => {
  const r = db.reservations.find((x) => x.id === req.pathParams['id']);
  if (!r) return notFound('Réservation introuvable');
  const workerIds = field<string[]>(req.body, 'workerIds') ?? [];
  r.assignedWorkerId = workerIds[0];
  r.status = 'confirmee';
  return ok(r);
});

// ===================== b2b =====================
register('GET', '/b2b', () => ok(db.b2bJobs));
register('GET', '/b2b/:id', (req) => {
  const j = b2bJobById(req.pathParams['id'] ?? '');
  return j ? ok(j) : notFound('Mission introuvable');
});
register('POST', '/b2b/:id/actions', (req) => {
  const j = b2bJobById(req.pathParams['id'] ?? '');
  if (!j) return notFound('Mission introuvable');
  const action = field<string>(req.body, 'action');
  switch (action) {
    case 'affect': {
      const workerIds = field<string[]>(req.body, 'workerIds') ?? [];
      j.assignedWorkerId = workerIds[0];
      if (j.status === 'confirmed') j.status = 'confirmedAssigned';
      break;
    }
    case 'upload': {
      j.factureStatus = 'envoyee' as FactureStatus;
      j.factureAmountDzd = field<number>(req.body, 'montant') ?? j.factureAmountDzd;
      j.status = 'doneInvoiced';
      break;
    }
    case 'changer': {
      const workerIds = field<string[]>(req.body, 'workerIds') ?? [];
      j.assignedWorkerId = workerIds[0];
      break;
    }
    default:
      return badRequest(`Action inconnue: ${String(action)}`);
  }
  return ok(j);
});

// ===================== annonces =====================
register('GET', '/annonces', () => ok(db.annonces));
register('GET', '/annonces/pros', () =>
  ok(db.workers.filter((w) => w.status === 'active').map((w) => ({ id: w.id, name: w.name, role: w.role }))),
);
register('POST', '/annonces', (req) => {
  const a = {
    id: nextId('A'),
    title: field<string>(req.body, 'title') ?? 'Annonce',
    serviceName: field<string>(req.body, 'serviceName') ?? '',
    type: (field<string>(req.body, 'type') === 'b2b' ? 'b2b' : 'b2c') as 'b2c' | 'b2b',
    active: true,
  };
  db.annonces.unshift(a);
  return ok(a);
});

// ===================== workers / effectif =====================
register('GET', '/workers', () => ok(db.workers));
register('GET', '/workers/:id', (req) => {
  const w = workerById(req.pathParams['id'] ?? '');
  return w ? ok(w) : notFound('Professionnel introuvable');
});
register('PATCH', '/workers/:id', (req) => {
  const w = workerById(req.pathParams['id'] ?? '');
  if (!w) return notFound('Professionnel introuvable');
  Object.assign(w, req.body as Partial<Worker>);
  return ok(w);
});
register('DELETE', '/workers/:id', (req) => {
  const w = workerById(req.pathParams['id'] ?? '');
  if (!w) return notFound('Professionnel introuvable');
  w.status = 'empty';
  w.name = '—';
  w.available = false;
  return ok(w);
});
register('POST', '/workers/invite', () => {
  const slot = db.workers.find((w) => w.status === 'empty');
  if (slot) {
    slot.status = 'pending';
    slot.token = `de9de9.dz/join/${nextId('t').toLowerCase()}`;
  }
  return ok(slot ?? { message: 'Aucun slot libre' });
});
register('POST', '/workers/agrandir', () => ok({ ok: true }));

// ===================== recruter / handicap =====================
register('POST', '/sub/demandes', () => ok({ ok: true }));
register('POST', '/handicap', () => ok({ ok: true }));
