// Stand-in for the annonce routes of guides 19 / 19a / 19b (`/prestataire/annonces…`),
// which the real API does not serve yet. DEVELOPMENT ONLY, opt-in with
// VITE_DEMO_ANNONCES=1 (see apiClient): it lets the screens be used end to end
// before the backend ships. Nothing here reaches de9de9 — the annonces live in
// this browser's localStorage. Every other call of the app stays real.
//
// It follows the guides' contract: versions and 409 `concurrency_conflict`, the
// status machine and its `actions[]`, the completeness rules of « Soumettre »,
// the shared B2C zones. de9de9's review is played by a timer: an annonce « en
// revue » is approved after `demo.revueMs` — or refused when its description
// contains « #refus », to see the correction path.
import type { AxiosAdapter } from 'axios';
import { mockAdapter, register, type MockRequest, type MockResponse } from './router';
import { ok, problem } from './http';

export const demo = { revueMs: 20_000 };

const PREFIX = '/prestataire/annonces';
const HREF = '/api/v1/prestataire/annonces';
const STORE = 'de9de9.demo.annonces.v1';
const MAX = { b2b: 20, b2c: 10, photos: 8, photoOctets: 5_242_880, zones: 300 };

let apiBase = 'https://api.entreprise.de9de9.dz/api/v1';

// --------------------------------------------------------------------- state

type Kind = 'b2b' | 'b2c';
type Statut = 'brouillon' | 'en_revue' | 'publiee' | 'en_pause' | 'refusee' | 'suspendue' | 'archivee';
interface Zone {
  wilayaCode: number;
  communeCode: number | null;
}
interface Tarif {
  mode: string;
  minDzd: number | null;
  maxDzd: number | null;
  unite: string | null;
}
interface ContenuB2b {
  titre: string;
  categoryCode: string;
  sousCategories: string[];
  zones: Zone[];
  tarif: Tarif;
  delaiDemarrageJours: number | null;
  capacite: string | null;
  references: string | null;
  certifications: string[];
  description: string | null;
}
interface LigneB2c {
  id: string;
  serviceId: number | null;
  tacheId: number | null;
  libelleLibre: string | null;
  prixDzd: number;
  unite: number | null;
}
interface ContenuB2c {
  legacyCategoryId: number;
  uniteDefaut: number | null;
  remise: number;
  lignes: LigneB2c[];
  reponseIds: string[];
  disponibilites: { jour: number; debut: string; fin: string }[];
  description: string | null;
}
interface Rec {
  id: string;
  type: Kind;
  version: number;
  statut: Statut;
  /** The status before « Soumettre »: where « Retirer ma demande » goes back to. */
  avant?: Statut;
  soumiseLe?: number;
  publieeUneFois: boolean;
  motif?: string;
  photos: { id: string; url: string }[];
  b2b?: ContenuB2b;
  b2c?: ContenuB2c;
}
interface Etat {
  seq: number;
  annonces: Rec[];
  zones: { version: number; zones: Zone[] };
}

function charger(): Etat {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORE);
    if (raw) return JSON.parse(raw) as Etat;
  } catch {
    /* unreadable: start empty */
  }
  return { seq: 0, annonces: [], zones: { version: 1, zones: [] } };
}
const etat = charger();

function sauver(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORE, JSON.stringify(etat));
  } catch {
    // Photos are stored as data URLs and may not fit: the rest is kept without them.
    try {
      localStorage.setItem(STORE, JSON.stringify({ ...etat, annonces: etat.annonces.map((a) => ({ ...a, photos: [] })) }));
    } catch {
      /* nothing kept across a reload */
    }
  }
}

const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `demo-${++etat.seq}-${Date.now().toString(36)}`;

// -------------------------------------------------------- reference data

interface Wilaya {
  code: number;
  nom: string;
  nombreCommunes?: number;
}
interface CatalogueCat {
  code: string;
  libelle: string;
  libelleAr?: string | null;
  icone?: string | null;
  famille?: string | null;
  hex?: string | null;
  services: { code: string; libelle: string }[];
}

const cache = new Map<string, Promise<unknown>>();
/** The real, anonymous routes the form needs names from: read once. */
function lire<T>(path: string, fallback: T): Promise<T> {
  let hit = cache.get(path);
  if (!hit) {
    hit = fetch(`${apiBase}${path}`)
      .then((res) => (res.ok ? (res.json() as Promise<T>) : fallback))
      .catch(() => fallback);
    cache.set(path, hit);
  }
  return hit as Promise<T>;
}

/** The Entreprise catalogue (`GET /catalogue`, anonymous): the B2B form's categories are the real ones. */
const catalogue = () =>
  lire<CatalogueCat[]>('/catalogue', [
    {
      code: 'nettoyage-et-hygiene',
      libelle: 'Nettoyage & Hygiène',
      icone: '🧼',
      famille: 'vert',
      hex: '#2FA86A',
      services: [
        { code: 'nettoyage-de-bureaux-et-locaux', libelle: 'Nettoyage de bureaux & locaux' },
        { code: 'nettoyage-industriel-et-usines', libelle: 'Nettoyage industriel & usines' },
        { code: 'vitres-et-facades', libelle: 'Vitres & façades' },
      ],
    },
  ]);
const wilayas = () => lire<Wilaya[]>('/geo/wilayas', []);
const communes = (wilaya: number) => lire<{ code: number; nom: string }[]>(`/geo/wilayas/${wilaya}/communes`, []);

async function zonesNommees(zones: Zone[]) {
  const ws = await wilayas();
  return Promise.all(
    zones.map(async (z) => {
      const wilaya = ws.find((w) => w.code === z.wilayaCode)?.nom ?? `Wilaya ${z.wilayaCode}`;
      const commune =
        z.communeCode === null ? null : ((await communes(z.wilayaCode)).find((c) => c.code === z.communeCode)?.nom ?? `Commune ${z.communeCode}`);
      return { wilayaCode: z.wilayaCode, wilaya, communeCode: z.communeCode, commune };
    }),
  );
}

async function communesCouvertes(zones: Zone[]): Promise<number> {
  const ws = await wilayas();
  return zones.reduce((n, z) => n + (z.communeCode === null ? (ws.find((w) => w.code === z.wilayaCode)?.nombreCommunes ?? 1) : 1), 0);
}

// The de9de9 app's tree is not readable from here: a small sample of it, in the guide's shape.
const UNITES: [number, string][] = [
  [0, 'Unité'], [1, 'Tâche'], [2, 'Session'], [3, 'Séance'], [4, 'Mètre'], [5, 'm²'],
  [6, 'm³'], [7, 'Heure'], [8, 'Jour'], [9, 'Semaine'], [10, 'Mois'],
];
const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

interface Question {
  id: string;
  enonce: string;
  choixMultiple: boolean;
  tacheId: number | null;
  reponses: { id: string; libelle: string }[];
}
interface CategorieApp {
  id: number;
  libelle: string;
  libelleAr: string;
  indisponible?: boolean;
  services: { id: number; libelle: string; taches: { id: number; libelle: string }[] }[];
  questions: Question[];
}
interface GroupeApp {
  id: number;
  libelle: string;
  libelleAr: string;
  categories: CategorieApp[];
}

const question = (id: string, enonce: string, choixMultiple: boolean, tacheId: number | null, reponses: string[]): Question => ({
  id,
  enonce,
  choixMultiple,
  tacheId,
  reponses: reponses.map((libelle, i) => ({ id: `${id}-${i + 1}`, libelle })),
});
const experience = (cat: number) =>
  question(`q${cat}-exp`, "Combien d'années d'expérience avez-vous ?", false, null, ['0-2 ans', '3-5 ans', '5-10 ans', 'Plus de 10 ans']);
/** `[serviceId, libellé, [tacheId, libellé]…]` */
type ServiceSeed = [number, string, ...[number, string][]];
const categorie = (id: number, libelle: string, libelleAr: string, services: ServiceSeed[], questions: Question[] = []): CategorieApp => ({
  id,
  libelle,
  libelleAr,
  services: services.map(([sid, nom, ...taches]) => ({ id: sid, libelle: nom, taches: taches.map(([tid, t]) => ({ id: tid, libelle: t })) })),
  questions: [experience(id), ...questions],
});

const GROUPES: GroupeApp[] = [
  {
    id: 3,
    libelle: 'Travaux',
    libelleAr: 'أشغال',
    categories: [
      categorie(
        12,
        'Plomberie',
        'السباكة',
        [
          [41, 'Installation de sanitaires', [86, 'Pose de lavabos, toilettes et douches'], [87, 'Installation de chauffe-eau']],
          [42, 'Réparation de fuites', [88, 'Fuite de robinet'], [89, 'Fuite de canalisation']],
          [44, 'Diagnostic'],
        ],
        [question('q12-ce', 'Types de chauffe-eau installés', true, 87, ['Gaz', 'Électrique', 'Solaire'])],
      ),
      categorie(
        13,
        'Électricité',
        'الكهرباء',
        [
          [51, 'Installation électrique', [101, 'Pose de prises et interrupteurs'], [102, 'Tableau électrique']],
          [52, 'Dépannage', [103, 'Recherche de panne'], [104, 'Remplacement de disjoncteur']],
        ],
        [question('q13-hab', 'Disposez-vous d’une habilitation électrique ?', false, null, ['Oui', 'Non'])],
      ),
      categorie(14, 'Climatisation', 'التكييف', [
        [61, 'Installation', [111, 'Pose de split mural'], [112, 'Pose de gainable']],
        [62, 'Entretien', [113, 'Nettoyage et recharge de gaz']],
      ]),
      categorie(15, 'Peinture', 'الدهان', [
        [71, 'Peinture intérieure', [121, 'Murs et plafonds'], [122, 'Boiseries']],
        [72, 'Peinture extérieure'],
      ]),
    ],
  },
  {
    id: 4,
    libelle: 'Maison',
    libelleAr: 'المنزل',
    categories: [
      categorie(
        21,
        'Ménage',
        'التنظيف المنزلي',
        [
          [131, 'Ménage régulier', [201, 'Nettoyage complet du logement'], [202, 'Repassage']],
          [132, 'Grand nettoyage', [203, 'Après travaux'], [204, 'Fin de location']],
        ],
        [question('q21-mat', 'Apportez-vous votre matériel ?', false, null, ['Oui', 'Non', 'Sur demande'])],
      ),
      categorie(22, 'Jardinage', 'البستنة', [
        [141, 'Entretien de jardin', [211, 'Tonte de pelouse'], [212, 'Taille de haies']],
        [142, 'Arrosage automatique'],
      ]),
    ],
  },
  {
    id: 5,
    libelle: 'Beauté',
    libelleAr: 'الجمال',
    categories: [
      categorie(31, 'Coiffure à domicile', 'الحلاقة في المنزل', [
        [151, 'Coiffure femme', [221, 'Coupe'], [222, 'Brushing'], [223, 'Coloration']],
        [152, 'Coiffure homme', [224, 'Coupe et barbe']],
      ]),
    ],
  },
  {
    id: 6,
    libelle: 'Cours',
    libelleAr: 'الدروس',
    categories: [
      categorie(
        41,
        'Cours particuliers',
        'الدروس الخصوصية',
        [
          [161, 'Mathématiques', [231, 'Collège'], [232, 'Lycée']],
          [162, 'Langues', [233, 'Français'], [234, 'Anglais']],
        ],
        [question('q41-lieu', 'Où donnez-vous vos cours ?', true, null, ['Chez l’élève', 'En ligne', 'Dans vos locaux'])],
      ),
    ],
  },
  {
    id: 7,
    libelle: 'Santé',
    libelleAr: 'الصحة',
    categories: [{ ...categorie(61, 'Infirmier à domicile', 'ممرض في المنزل', [[171, 'Soins infirmiers']]), indisponible: true }],
  },
  {
    id: 8,
    libelle: 'Transport',
    libelleAr: 'النقل',
    categories: [
      categorie(73, 'Déménagement', 'نقل الأثاث', [
        [181, 'Déménagement complet', [241, 'Avec emballage'], [242, 'Sans emballage']],
        [182, 'Transport de meubles'],
      ]),
      { ...categorie(74, 'Chauffeur privé', 'سائق خاص', [[191, 'Mise à disposition']]), indisponible: true },
    ],
  },
];
const MOTIF_VERROU = 'Catégorie soumise à vérification — contactez de9de9';
const categorieApp = (id: number) => {
  for (const groupe of GROUPES) {
    const c = groupe.categories.find((x) => x.id === id);
    if (c) return { groupe, categorie: c };
  }
  return null;
};

// ------------------------------------------------------------------- helpers

const da = (n: number) => `${n.toLocaleString('fr-FR')} DA`;
const body = <T,>(req: MockRequest): Partial<T> => (req.body && typeof req.body === 'object' ? (req.body as Partial<T>) : {});
const vivante = (a: Rec) => a.statut === 'en_revue' || a.statut === 'publiee' || a.statut === 'en_pause';
const trouver = (id: string | undefined) => etat.annonces.find((a) => a.id === id);

const introuvable = () => problem(404, 'annonce_not_found', 'Cette annonce est introuvable.');
const perimee = () => problem(409, 'concurrency_conflict', 'Cette annonce a été modifiée par un autre membre de votre équipe.');
const etatInvalide = (detail = "Cette action n'est pas possible dans l'état actuel de l'annonce.") => problem(409, 'annonce_etat_invalide', detail);

const STATUTS: Record<Statut, [string, string]> = {
  brouillon: ['Brouillon', 'neutre'],
  en_revue: ['En revue', 'attention'],
  publiee: ['Publiée', 'succes'],
  en_pause: ['En pause', 'info'],
  refusee: ['Refusée', 'danger'],
  suspendue: ['Suspendue', 'danger'],
  archivee: ['Archivée', 'neutre'],
};
const tag = (s: Statut) => ({ code: s, label: STATUTS[s][0], ton: STATUTS[s][1] });

/** de9de9's review, played by the clock. */
function revue(): void {
  const now = Date.now();
  let change = false;
  for (const a of etat.annonces) {
    if (a.statut !== 'en_revue' || (a.soumiseLe ?? now) + demo.revueMs > now) continue;
    const description = (a.type === 'b2b' ? a.b2b?.description : a.b2c?.description) ?? '';
    if (description.includes('#refus')) {
      a.statut = 'refusee';
      a.motif = 'Démo : la description contient « #refus ». Retirez-le, puis renvoyez votre annonce.';
    } else {
      a.statut = 'publiee';
      a.publieeUneFois = true;
      a.motif = undefined;
    }
    a.avant = undefined;
    a.version += 1;
    change = true;
  }
  if (change) sauver();
}

// --------------------------------------------------------------- completeness

interface EtapeRefus {
  code: string;
  message: string;
}

function manquesB2b(c: ContenuB2b): EtapeRefus[] {
  const e: EtapeRefus[] = [];
  if (!c.titre.trim()) e.push({ code: 'titre', message: "Donnez un titre à l'offre." });
  if (!c.categoryCode) e.push({ code: 'categorie', message: 'Choisissez une catégorie.' });
  if (c.sousCategories.length === 0) e.push({ code: 'services', message: 'Choisissez au moins un service.' });
  if (c.zones.length === 0) e.push({ code: 'zones', message: 'Ajoutez au moins une zone de couverture.' });
  if (c.tarif.mode === 'fourchette' && (c.tarif.minDzd === null || c.tarif.maxDzd === null || c.tarif.maxDzd < c.tarif.minDzd)) {
    e.push({ code: 'tarif', message: 'Indiquez une fourchette de prix cohérente.' });
  }
  if ((c.description ?? '').trim().length < 30) e.push({ code: 'description', message: 'Décrivez votre offre en 30 caractères au moins.' });
  return e;
}

function manquesB2c(c: ContenuB2c): EtapeRefus[] {
  const e: EtapeRefus[] = [];
  if (!c.lignes.some((l) => l.serviceId !== null)) e.push({ code: 'services', message: 'Choisissez au moins un service de la liste.' });
  if (c.lignes.some((l) => !(l.prixDzd > 0))) e.push({ code: 'tarifs', message: 'Indiquez un prix supérieur à 0 pour chaque service.' });
  else if (c.lignes.length > 0 && c.uniteDefaut === null) e.push({ code: 'tarifs', message: "Choisissez l'unité de vos tarifs." });
  if (c.disponibilites.length === 0) e.push({ code: 'disponibilite', message: 'Indiquez au moins une plage de disponibilité.' });
  if (etat.zones.zones.length === 0) e.push({ code: 'zones', message: "Ajoutez au moins une zone d'intervention." });
  const longueur = (c.description ?? '').trim().length;
  if (longueur < 30 || longueur > 2000) e.push({ code: 'description', message: 'Décrivez vos services en 30 à 2000 caractères.' });
  return e;
}

const manques = (a: Rec): EtapeRefus[] => (a.type === 'b2b' && a.b2b ? manquesB2b(a.b2b) : a.b2c ? manquesB2c(a.b2c) : []);

const incomplete = (etapes: EtapeRefus[], verbe: string): MockResponse => {
  const refus = problem(422, 'annonce_incomplete', `Complétez votre annonce avant de la ${verbe}.`);
  return { ...refus, data: { ...(refus.data as object), etapes } };
};

// ------------------------------------------------------------------ the views

function actions(a: Rec) {
  const href = (route: string) => `${HREF}/${a.id}/${route}`;
  const modifier = (label = 'Modifier') => ({ code: 'modifier', label, style: 'contour' });
  const soumettre = { code: 'soumettre', label: a.type === 'b2b' ? 'Soumettre à de9de9' : 'Publier', style: 'contour', method: 'POST', href: href('soumettre') };
  const supprimer = {
    code: 'supprimer',
    label: 'Supprimer',
    style: 'danger',
    method: 'DELETE',
    href: `${HREF}/${a.id}`,
    confirm: { titre: "Supprimer l'annonce", texte: "L'annonce et ses photos seront supprimées.", bouton: 'Supprimer' },
  };
  const archiver = {
    code: 'archiver',
    label: 'Archiver',
    style: 'danger',
    method: 'POST',
    href: href('archiver'),
    confirm: { titre: "Archiver l'annonce", texte: 'Action définitive. Vous pourrez créer une nouvelle annonce dans cette catégorie.', bouton: 'Archiver' },
  };
  const dupliquer = { code: 'dupliquer', label: 'Dupliquer', style: 'contour', method: 'POST', href: href('dupliquer') };
  const pause = {
    code: 'mettre_en_pause',
    label: 'Mettre en pause',
    style: 'contour',
    method: 'POST',
    href: href('mettre-en-pause'),
    confirm: {
      titre: 'Mettre en pause',
      texte:
        a.type === 'b2c'
          ? "L'annonce ne sera plus visible sur l'app de9de9. Vos avis et votre historique sont conservés."
          : "L'annonce quitte le catalogue : ses services ne comptent plus pour les entreprises clientes.",
      bouton: 'Mettre en pause',
    },
  };
  // A B2C annonce is duplicated only once archived: one annonce per category of the app.
  const copie = a.type === 'b2b' ? [dupliquer] : [];
  switch (a.statut) {
    case 'brouillon':
      return [modifier(), soumettre, supprimer];
    case 'en_revue':
      return [{ code: 'retirer_soumission', label: 'Retirer ma demande', style: 'contour', method: 'POST', href: href('retirer-soumission') }];
    case 'publiee':
      return [modifier(), pause, ...copie, archiver];
    case 'en_pause':
      return [modifier(), { code: 'reprendre', label: 'Reprendre', style: 'contour', method: 'POST', href: href('reprendre') }, ...copie, archiver];
    case 'refusee':
      return [modifier('Corriger et renvoyer'), soumettre, a.publieeUneFois ? archiver : supprimer];
    case 'suspendue':
      return [modifier('Corriger et renvoyer'), soumettre, archiver];
    case 'archivee':
      return [dupliquer];
  }
}

const typeChip = (type: Kind) => ({ code: type, label: type === 'b2b' ? 'Entreprises' : 'Particuliers' });
/** The B2C technical badge: until the bridge to the app is on, a published annonce waits. */
const publication = (a: Rec) =>
  a.type === 'b2c' && a.statut === 'publiee' ? { code: 'en_attente', label: 'En attente de publication', ton: 'attention', raison: null } : null;

function bandeau(a: Rec) {
  switch (a.statut) {
    case 'brouillon':
      return { ton: 'neutre', texte: 'Complétez et publiez votre annonce.' };
    case 'en_revue':
      return { ton: 'attention', texte: 'En cours de vérification par de9de9.' };
    case 'publiee':
      return a.type === 'b2b'
        ? { ton: 'succes', texte: 'Visible par les entreprises clientes et par de9de9.' }
        : { ton: 'info', texte: "Validée. Elle sera en ligne sur l'app de9de9 dès l'activation de votre compte." };
    case 'en_pause':
      return { ton: 'info', texte: 'Annonce masquée. Reprenez-la quand vous voulez.' };
    case 'archivee':
      return { ton: 'neutre', texte: 'Annonce archivée : elle ne peut plus être modifiée.' };
    default:
      return null;
  }
}

const photosVue = (a: Rec) => a.photos.map((p, i) => ({ id: p.id, url: p.url, couverture: i === 0 }));

function tarifLabel(t: Tarif, apartir: boolean): string {
  if (t.mode !== 'fourchette' || t.minDzd === null) return 'Sur devis';
  const unite = t.unite ? ` / ${t.unite === 'm2' ? 'm²' : t.unite}` : '';
  if (apartir || t.maxDzd === null) return `À partir de ${da(t.minDzd)}${unite}`;
  return `${t.minDzd.toLocaleString('fr-FR')} – ${da(t.maxDzd)}${unite}`;
}

const etapesVue = (a: Rec, blocs: [string, string][]) => {
  const absents = new Set(manques(a).map((m) => m.code));
  return blocs.map(([code, label]) => ({ code, label, complete: !absents.has(code) }));
};

async function detail(a: Rec): Promise<Record<string, unknown>> {
  const communs = {
    id: a.id,
    type: a.type,
    typeChip: typeChip(a.type),
    version: a.version,
    statut: tag(a.statut),
    publication: publication(a),
    bandeau: bandeau(a),
    motif: a.statut === 'refusee' || a.statut === 'suspendue' ? (a.motif ?? null) : null,
    photos: photosVue(a),
    actions: actions(a),
  };
  if (a.type === 'b2b' && a.b2b) {
    const c = a.b2b;
    const cat = (await catalogue()).find((x) => x.code === c.categoryCode);
    return {
      ...communs,
      titre: c.titre,
      categorie: cat
        ? {
            code: cat.code,
            libelle: cat.libelle,
            icone: cat.icone ?? null,
            famille: cat.famille ?? null,
            familleLabel: cat.famille?.toUpperCase() ?? null,
            hex: cat.hex ?? null,
            // Locked once submitted: another category is another annonce.
            verrouillee: a.statut !== 'brouillon' || a.soumiseLe !== undefined,
          }
        : null,
      sousCategories: c.sousCategories.map((code) => ({ code, libelle: cat?.services.find((s) => s.code === code)?.libelle ?? code })),
      zones: await zonesNommees(c.zones),
      tarif: { ...c.tarif, label: tarifLabel(c.tarif, false) },
      delaiDemarrageJours: c.delaiDemarrageJours,
      delaiLabel: c.delaiDemarrageJours === null ? null : `Démarrage sous ${c.delaiDemarrageJours} jour${c.delaiDemarrageJours > 1 ? 's' : ''}`,
      capacite: c.capacite,
      references: c.references,
      certifications: c.certifications,
      description: c.description,
      demandesIssues: { count: 0, label: null },
      etapes: etapesVue(a, [
        ['titre', 'Titre'], ['categorie', 'Catégorie'], ['services', 'Services proposés'],
        ['zones', 'Zones de couverture'], ['tarif', 'Tarification'], ['description', 'Description'],
      ]),
    };
  }
  const c = a.b2c as ContenuB2c;
  const app = categorieApp(c.legacyCategoryId);
  const uniteLabel = (code: number | null) => UNITES.find(([u]) => u === code)?.[1] ?? null;
  const libelleLigne = (l: LigneB2c): string => {
    if (l.libelleLibre !== null) return l.libelleLibre;
    const service = app?.categorie.services.find((s) => s.id === l.serviceId);
    return (l.tacheId === null ? service?.libelle : service?.taches.find((t) => t.id === l.tacheId)?.libelle) ?? 'Service';
  };
  const communesNb = await communesCouvertes(etat.zones.zones);
  const nommees = await zonesNommees(etat.zones.zones);
  const parWilaya = new Map<string, { entiere: boolean; n: number }>();
  for (const z of nommees) {
    const w = parWilaya.get(z.wilaya) ?? { entiere: false, n: 0 };
    if (z.communeCode === null) w.entiere = true;
    else w.n += 1;
    parWilaya.set(z.wilaya, w);
  }
  return {
    ...communs,
    titre: app?.categorie.libelle ?? 'Annonce B2C',
    sousTitre: app ? `${app.groupe.libelle} · ${app.categorie.libelle}` : null,
    categorie: app
      ? { legacyCategoryId: app.categorie.id, libelle: app.categorie.libelle, libelleAr: app.categorie.libelleAr, groupeId: app.groupe.id, groupe: app.groupe.libelle, photoUrl: null }
      : null,
    uniteDefaut: c.uniteDefaut,
    uniteDefautLabel: uniteLabel(c.uniteDefaut),
    remise: c.remise,
    lignes: c.lignes.map((l) => {
      const unite = l.unite ?? c.uniteDefaut;
      return {
        id: l.id,
        legacyCategoryServiceId: l.serviceId,
        legacyServiceTaskId: l.tacheId,
        estLibre: l.libelleLibre !== null,
        libelle: libelleLigne(l),
        prixDzd: l.prixDzd,
        unite,
        uniteLabel: uniteLabel(unite),
        uniteDifferente: l.unite !== null && l.unite !== c.uniteDefaut,
        prixLabel: l.prixDzd > 0 ? `${da(l.prixDzd)}${uniteLabel(unite) ? ` / ${uniteLabel(unite)?.toLowerCase()}` : ''}` : 'Prix à compléter',
      };
    }),
    reponseIds: c.reponseIds,
    questionnaire: (app?.categorie.questions ?? [])
      .map((q) => ({ question: q.enonce, reponses: q.reponses.filter((r) => c.reponseIds.includes(r.id)).map((r) => r.libelle) }))
      .filter((q) => q.reponses.length > 0),
    disponibilites: c.disponibilites.map((d) => ({ ...d, jourLabel: JOURS[d.jour] ?? String(d.jour) })),
    zones: {
      resume: [...parWilaya].map(([nom, w]) => (w.entiere ? `${nom} (toute la wilaya)` : `${nom} (${w.n} commune${w.n > 1 ? 's' : ''})`)).join(', ') || null,
      communesCouvertes: communesNb,
      note: 'Partagées par toutes vos annonces B2C',
    },
    description: c.description,
    etapes: etapesVue(a, [
      ['services', 'Services'], ['tarifs', 'Tarifs'], ['disponibilite', 'Disponibilité'],
      ['zones', "Zones d'intervention"], ['description', 'Description'],
    ]),
  };
}

async function carte(a: Rec) {
  const communs = {
    id: a.id,
    type: a.type,
    typeChip: typeChip(a.type),
    couvertureUrl: a.photos[0]?.url ?? null,
    statut: tag(a.statut),
    publication: publication(a),
    version: a.version,
    actions: actions(a),
  };
  if (a.type === 'b2b' && a.b2b) {
    const cat = (await catalogue()).find((x) => x.code === a.b2b?.categoryCode);
    const n = a.b2b.sousCategories.length;
    return {
      ...communs,
      titre: a.b2b.titre,
      sousTitre: cat ? `${cat.libelle} · ${n} service${n > 1 ? 's' : ''}` : null,
      prixLabel: tarifLabel(a.b2b.tarif, true),
      icone: cat?.icone ?? null,
      famille: cat?.famille ?? null,
      hex: cat?.hex ?? null,
    };
  }
  const c = a.b2c as ContenuB2c;
  const app = categorieApp(c.legacyCategoryId);
  const prix = c.lignes.map((l) => l.prixDzd).filter((p) => p > 0);
  return {
    ...communs,
    titre: app?.categorie.libelle ?? 'Annonce B2C',
    sousTitre: app ? `${app.groupe.libelle} · ${app.categorie.libelle}` : null,
    prixLabel: prix.length > 0 ? `À partir de ${da(Math.min(...prix))}` : 'Tarifs à compléter',
    categoriePhotoUrl: null,
  };
}

const restantes = (type: Kind) => MAX[type] - etat.annonces.filter((a) => a.type === type && vivante(a)).length;
const quota = (type: Kind) => {
  const n = restantes(type);
  return n > 0 ? `${n} annonce${n > 1 ? 's' : ''} restante${n > 1 ? 's' : ''}` : 'Limite atteinte';
};

// ---------------------------------------------------------------- the list

register('GET', PREFIX, async (req) => {
  revue();
  const type = req.query['type'] === 'b2b' || req.query['type'] === 'b2c' ? (req.query['type'] as Kind) : null;
  const statut = req.query['statut'] || null;
  const page = Math.max(1, Number(req.query['page']) || 1);
  const pageSize = Math.max(1, Number(req.query['pageSize']) || 20);

  const horsArchives = etat.annonces.filter((a) => a.statut !== 'archivee');
  const duType = etat.annonces.filter((a) => !type || a.type === type);
  const chip = (a: Rec) => (a.statut === 'refusee' || a.statut === 'suspendue' ? 'a_corriger' : a.statut);
  const compte = (code: string) => duType.filter((a) => chip(a) === code).length;
  const visibles = duType.filter((a) => (statut ? chip(a) === statut : a.statut !== 'archivee')).reverse();

  return ok({
    titre: 'Annonces',
    type,
    types: [
      { code: 'toutes', label: 'Toutes', count: horsArchives.length },
      { code: 'b2c', label: 'B2C · Particuliers', count: horsArchives.filter((a) => a.type === 'b2c').length },
      { code: 'b2b', label: 'B2B · Entreprises', count: horsArchives.filter((a) => a.type === 'b2b').length },
    ],
    statut,
    statuts: [
      { code: 'publiee', label: 'Publiées', count: compte('publiee') },
      { code: 'en_revue', label: 'En revue', count: compte('en_revue') },
      { code: 'brouillon', label: 'Brouillons', count: compte('brouillon') },
      { code: 'en_pause', label: 'En pause', count: compte('en_pause') },
      { code: 'a_corriger', label: 'À corriger', count: compte('a_corriger') },
      ...(compte('archivee') > 0 ? [{ code: 'archivee', label: 'Archivées', count: compte('archivee') }] : []),
    ],
    creer: {
      label: 'Créer une annonce',
      types: [
        { code: 'b2c', titre: 'Annonce B2C', sousTitre: "Clients particuliers — visible sur l'app de9de9", quota: quota('b2c'), disponible: restantes('b2c') > 0 },
        {
          code: 'b2b',
          titre: 'Annonce B2B',
          sousTitre: 'Clients entreprises — visible dans le catalogue De9de9 Entreprise',
          quota: quota('b2b'),
          disponible: restantes('b2b') > 0,
        },
      ],
    },
    kyc: { verifie: true },
    bandeaux: [
      {
        code: 'demo',
        ton: 'attention',
        texte: `Mode démo (développement) : l'API ne sert pas encore les annonces. Celles-ci restent dans ce navigateur, rien n'est envoyé à de9de9 ; une annonce soumise est validée après ${Math.round(demo.revueMs / 1000)} s.`,
      },
      ...(type === 'b2c'
        ? [{ code: 'b2c_explorer', ton: 'neutre', texte: 'Vos annonces B2C déterminent aussi les offres visibles dans « Explorer les offres ».' }]
        : []),
    ],
    annonces: await Promise.all(visibles.slice((page - 1) * pageSize, page * pageSize).map(carte)),
    page,
    pageSize,
    total: visibles.length,
    vide: type
      ? { titre: `Aucune annonce ${type === 'b2b' ? 'B2B' : 'B2C'}`, texte: 'Créez votre première annonce.' }
      : { titre: 'Aucune annonce', texte: 'Créez votre première annonce.' },
  });
});

// -------------------------------------------------------------------- B2B

register('GET', `${PREFIX}/b2b/referentiel`, async () => {
  const prises = new Map<string, Rec>();
  for (const a of etat.annonces) if (a.type === 'b2b' && vivante(a)) for (const code of a.b2b?.sousCategories ?? []) prises.set(code, a);
  return ok({
    kyc: { verifie: true },
    limites: {
      titreMax: 120, descriptionMin: 30, descriptionMax: 2000, capaciteMax: 200, referencesMax: 1000,
      certificationsMax: 12, certificationMax: 120, zonesMax: MAX.zones, photosMax: MAX.photos, photoMaxOctets: MAX.photoOctets,
      photoTypes: 'image/png,image/jpeg,image/webp', annoncesMax: MAX.b2b, annoncesRestantes: restantes('b2b'),
    },
    tarif: {
      modes: [
        { code: 'sur_devis', label: 'Sur devis' },
        { code: 'fourchette', label: 'Fourchette indicative' },
      ],
      unites: [
        { code: 'jour', label: 'jour' }, { code: 'heure', label: 'heure' }, { code: 'm2', label: 'm²' },
        { code: 'mois', label: 'mois' }, { code: 'forfait', label: 'forfait' },
      ],
    },
    categories: (await catalogue()).map((c) => ({
      code: c.code,
      libelle: c.libelle,
      libelleAr: c.libelleAr ?? null,
      icone: c.icone ?? null,
      famille: c.famille ?? null,
      familleLabel: c.famille?.toUpperCase() ?? null,
      hex: c.hex ?? null,
      imageUrl: null,
      services: c.services.map((s) => {
        const autre = prises.get(s.code);
        return { code: s.code, libelle: s.libelle, dejaAnnoncee: !!autre, annonce: autre ? { id: autre.id, titre: autre.b2b?.titre ?? '' } : null };
      }),
    })),
  });
});

async function contenuB2b(req: MockRequest): Promise<ContenuB2b | MockResponse> {
  const b = body<ContenuB2b>(req);
  const titre = typeof b.titre === 'string' ? b.titre.trim() : '';
  if (!titre) return problem(400, 'validation_failed', "Le titre de l'offre est requis.", 'titre');
  if (titre.length > 120) return problem(400, 'validation_failed', 'Le titre ne doit pas dépasser 120 caractères.', 'titre');
  const cat = (await catalogue()).find((c) => c.code === b.categoryCode);
  if (!cat) return problem(422, 'categorie_non_disponible', "Cette catégorie n'est plus disponible dans le catalogue.");
  const sousCategories = Array.isArray(b.sousCategories) ? b.sousCategories : [];
  if (sousCategories.some((code) => !cat.services.some((s) => s.code === code))) {
    return problem(400, 'validation_failed', `Une sous-catégorie n'appartient pas à « ${cat.libelle} ».`, 'sousCategories');
  }
  const tarif: Tarif = b.tarif ?? { mode: 'sur_devis', minDzd: null, maxDzd: null, unite: null };
  if (tarif.mode !== 'sur_devis' && tarif.mode !== 'fourchette') return problem(400, 'validation_failed', 'Mode de tarification inconnu.', 'tarif.mode');
  if ((tarif.minDzd ?? 0) < 0 || (tarif.maxDzd ?? 0) < 0 || (tarif.minDzd !== null && tarif.maxDzd !== null && tarif.maxDzd < tarif.minDzd)) {
    return problem(400, 'validation_failed', 'Le maximum doit être au moins égal au minimum.', 'tarif.maxDzd');
  }
  const zones = (Array.isArray(b.zones) ? b.zones : []).map((z) => ({ wilayaCode: z.wilayaCode, communeCode: z.communeCode ?? null }));
  if (zones.length > MAX.zones) return problem(400, 'validation_failed', `${MAX.zones} zones au plus.`, 'zones');
  const certifications = Array.isArray(b.certifications) ? b.certifications : [];
  if (certifications.length > 12) return problem(400, 'validation_failed', '12 certifications au plus.', 'certifications');
  return {
    titre,
    categoryCode: cat.code,
    sousCategories,
    zones,
    tarif,
    delaiDemarrageJours: b.delaiDemarrageJours ?? null,
    capacite: b.capacite ?? null,
    references: b.references ?? null,
    certifications,
    description: b.description ?? null,
  };
}
const estRefus = (x: object): x is MockResponse => 'data' in x;

register('POST', `${PREFIX}/b2b`, async (req) => {
  const contenu = await contenuB2b(req);
  if (estRefus(contenu)) return contenu;
  const a: Rec = { id: uid(), type: 'b2b', version: 1, statut: 'brouillon', publieeUneFois: false, photos: [], b2b: contenu };
  etat.annonces.push(a);
  sauver();
  return { status: 201, data: await detail(a) };
});

/** A write on an annonce: it exists, is of this kind, the version is the one held, its status takes edits. */
function ecriture(req: MockRequest, type: Kind): Rec | MockResponse {
  revue();
  const a = trouver(req.pathParams['id']);
  if (!a || a.type !== type) return introuvable();
  const version = body<{ version: number }>(req).version;
  if (typeof version !== 'number') return problem(400, 'validation_failed', 'La version est requise.', 'version');
  if (version !== a.version) return perimee();
  if (a.statut === 'en_revue') return etatInvalide('Cette annonce est en cours de vérification : retirez votre demande pour la modifier.');
  if (a.statut === 'archivee') return etatInvalide('Une annonce archivée ne peut plus être modifiée.');
  return a;
}
const enLigne = (a: Rec) => a.statut === 'publiee' || a.statut === 'en_pause';

register('PUT', `${PREFIX}/b2b/:id`, async (req) => {
  const a = ecriture(req, 'b2b');
  if (estRefus(a)) return a;
  const contenu = await contenuB2b(req);
  if (estRefus(contenu)) return contenu;
  if (a.soumiseLe !== undefined && contenu.categoryCode !== a.b2b?.categoryCode) {
    return problem(400, 'validation_failed', "La catégorie d'une annonce déjà soumise ne peut plus changer.", 'categoryCode');
  }
  // An edit can never leave an annonce online incomplete.
  if (enLigne(a)) {
    const absents = manquesB2b(contenu);
    if (absents.length > 0) return incomplete(absents, 'enregistrer');
  }
  a.b2b = contenu;
  a.version += 1;
  sauver();
  return ok(await detail(a));
});

// -------------------------------------------------------------------- B2C

register('GET', `${PREFIX}/b2c/referentiel`, () => {
  const tenues = new Map<number, Rec>();
  for (const a of etat.annonces) if (a.type === 'b2c' && a.statut !== 'archivee' && a.b2c) tenues.set(a.b2c.legacyCategoryId, a);
  return ok({
    groupes: GROUPES.map((g) => ({
      id: g.id,
      libelle: g.libelle,
      libelleAr: g.libelleAr,
      photoUrl: null,
      verrouille: g.categories.every((c) => c.indisponible),
      categories: g.categories.map((c) => ({
        id: c.id,
        libelle: c.libelle,
        libelleAr: c.libelleAr,
        photoUrl: null,
        dejaUtilisee: tenues.has(c.id),
        annonceId: tenues.get(c.id)?.id ?? null,
        indisponible: !!c.indisponible,
        indisponibleMotif: c.indisponible ? MOTIF_VERROU : null,
      })),
    })),
    unites: UNITES.map(([code, label]) => ({ code, label })),
    limites: {
      lignesMax: 60, lignesLibresMax: 5, descriptionMin: 30, descriptionMax: 2000,
      photosMax: MAX.photos, photoMaxOctets: MAX.photoOctets, plagesParJourMax: 3, zonesMax: MAX.zones,
    },
    quota: { max: MAX.b2c, restantes: restantes('b2c'), label: quota('b2c') },
  });
});

register('GET', `${PREFIX}/b2c/referentiel/categories/:id`, (req) => {
  const app = categorieApp(Number(req.pathParams['id']));
  if (!app) return problem(422, 'reference_inconnue', "Cette catégorie n'existe plus sur l'app de9de9.");
  return ok({
    categorie: { id: app.categorie.id, libelle: app.categorie.libelle, libelleAr: app.categorie.libelleAr, groupeId: app.groupe.id, groupe: app.groupe.libelle },
    services: app.categorie.services.map((s) => ({ ...s, libelleAr: null, taches: s.taches.map((t) => ({ ...t, libelleAr: null })) })),
    questions: app.categorie.questions.map((q) => ({ ...q, enonceAr: null, reponses: q.reponses.map((r) => ({ ...r, libelleAr: null })) })),
  });
});

// The company's ONE list of B2C zones, with its own version. Registered before `b2c/:id`.
async function zonesVue() {
  const b2b = new Map<string, Zone>();
  for (const a of etat.annonces) if (a.type === 'b2b' && a.statut !== 'archivee') for (const z of a.b2b?.zones ?? []) b2b.set(`${z.wilayaCode}:${z.communeCode ?? ''}`, z);
  return {
    version: etat.zones.version,
    zones: await zonesNommees(etat.zones.zones),
    communesCouvertes: await communesCouvertes(etat.zones.zones),
    annoncesConcernees: etat.annonces.filter((a) => a.type === 'b2c' && a.statut !== 'archivee').length,
    max: MAX.zones,
    note: "Ces zones s'appliquent à toutes vos annonces B2C.",
    zonesB2b: await zonesNommees([...b2b.values()]),
  };
}
register('GET', `${PREFIX}/b2c/zones`, async () => ok(await zonesVue()));
register('PUT', `${PREFIX}/b2c/zones`, async (req) => {
  const b = body<{ version: number; zones: { wilayaCode: number; communeCode?: number | null }[] }>(req);
  if (b.version !== etat.zones.version) return problem(409, 'concurrency_conflict', 'Vos zones ont été modifiées par un autre membre de votre équipe.');
  const zones = (Array.isArray(b.zones) ? b.zones : []).map((z) => ({ wilayaCode: z.wilayaCode, communeCode: z.communeCode ?? null }));
  if (zones.length > MAX.zones) return problem(400, 'validation_failed', `${MAX.zones} zones au plus.`, 'zones');
  etat.zones = { version: etat.zones.version + 1, zones };
  sauver();
  return ok(await zonesVue());
});

interface LigneRecue {
  legacyCategoryServiceId?: number | null;
  legacyServiceTaskId?: number | null;
  libelleLibre?: string;
  prixDzd?: number;
  unite?: number | null;
}
interface CorpsB2cRecu {
  uniteDefaut: number | null;
  remise: number;
  lignes: LigneRecue[];
  reponseIds: string[];
  disponibilites: { jour: number; debut: string; fin: string }[];
  description: string | null;
}

function contenuB2c(req: MockRequest, legacyCategoryId: number): ContenuB2c | MockResponse {
  const b = body<CorpsB2cRecu>(req);
  const app = categorieApp(legacyCategoryId);
  const remise = b.remise ?? 0;
  if (!Number.isInteger(remise) || remise < 0 || remise > 100) return problem(400, 'validation_failed', 'La remise est un pourcentage entre 0 et 100.', 'remise');
  const lignes: LigneB2c[] = [];
  const vues = new Set<string>();
  for (const [i, l] of (Array.isArray(b.lignes) ? b.lignes : []).entries()) {
    const prixDzd = l.prixDzd ?? 0;
    if (!Number.isFinite(prixDzd) || prixDzd < 0) return problem(400, 'validation_failed', 'Un prix ne peut pas être négatif.', `lignes[${i}].prixDzd`);
    if (typeof l.libelleLibre === 'string') {
      lignes.push({ id: uid(), serviceId: null, tacheId: null, libelleLibre: l.libelleLibre, prixDzd, unite: l.unite ?? null });
      continue;
    }
    const service = app?.categorie.services.find((s) => s.id === l.legacyCategoryServiceId);
    const tacheId = l.legacyServiceTaskId ?? null;
    if (!service || (tacheId !== null && !service.taches.some((t) => t.id === tacheId))) {
      return problem(422, 'reference_inconnue', "Ce service n'existe plus sur l'app de9de9. Retirez-le pour continuer.", `lignes[${i}].legacyServiceTaskId`);
    }
    const cle = `${service.id}:${tacheId ?? ''}`;
    if (vues.has(cle)) return problem(400, 'validation_failed', 'Un même service figure deux fois.', `lignes[${i}]`);
    vues.add(cle);
    lignes.push({ id: uid(), serviceId: service.id, tacheId, libelleLibre: null, prixDzd, unite: l.unite ?? null });
  }
  if (lignes.length > 60) return problem(400, 'validation_failed', 'Une annonce compte 60 lignes au plus.', 'lignes');
  if (lignes.filter((l) => l.libelleLibre !== null).length > 5) return problem(400, 'validation_failed', '5 prestations libres au plus.', 'lignes');

  const disponibilites = Array.isArray(b.disponibilites) ? b.disponibilites : [];
  for (const [i, d] of disponibilites.entries()) {
    const entiere = (t: string) => /^([01]\d|2[0-3]):00$/.test(t);
    if (!entiere(d.debut)) return problem(400, 'validation_failed', "Une plage commence à l'heure pile.", `disponibilites[${i}].debut`);
    if (!entiere(d.fin) && d.fin !== '23:59') return problem(400, 'validation_failed', "Une plage finit à l'heure pile, ou à 23:59.", `disponibilites[${i}].fin`);
    if (d.fin <= d.debut) return problem(400, 'validation_failed', 'Une plage finit après son début.', `disponibilites[${i}].fin`);
    if (d.jour < 0 || d.jour > 6) return problem(400, 'validation_failed', 'Jour inconnu.', `disponibilites[${i}].jour`);
  }
  for (let jour = 0; jour < 7; jour++) {
    const duJour = disponibilites.filter((d) => d.jour === jour).sort((x, y) => x.debut.localeCompare(y.debut));
    if (duJour.length > 3) return problem(400, 'validation_failed', '3 plages au plus par jour.', 'disponibilites');
    if (duJour.some((d, i) => i > 0 && d.debut < (duJour[i - 1]?.fin ?? ''))) {
      return problem(400, 'validation_failed', "Les plages d'un même jour ne se chevauchent pas.", 'disponibilites');
    }
  }
  // The same rule as the app's own screen: an answer counts only while its question is shown.
  const taches = new Set(lignes.map((l) => l.tacheId));
  const admises = new Set(
    (app?.categorie.questions ?? []).filter((q) => q.tacheId === null || taches.has(q.tacheId)).flatMap((q) => q.reponses.map((r) => r.id)),
  );
  return {
    legacyCategoryId,
    uniteDefaut: b.uniteDefaut ?? null,
    remise,
    lignes,
    reponseIds: (Array.isArray(b.reponseIds) ? b.reponseIds : []).filter((id) => admises.has(id)),
    disponibilites,
    description: b.description ?? null,
  };
}

register('POST', `${PREFIX}/b2c`, async (req) => {
  const legacyCategoryId = body<{ legacyCategoryId: number }>(req).legacyCategoryId;
  const app = typeof legacyCategoryId === 'number' ? categorieApp(legacyCategoryId) : null;
  if (!app) return problem(422, 'reference_inconnue', "Cette catégorie n'existe plus sur l'app de9de9.", 'legacyCategoryId');
  if (app.categorie.indisponible) return problem(422, 'categorie_non_disponible', MOTIF_VERROU);
  if (etat.annonces.some((a) => a.type === 'b2c' && a.statut !== 'archivee' && a.b2c?.legacyCategoryId === app.categorie.id)) {
    return problem(409, 'categorie_deja_annoncee', 'Vous avez déjà une annonce dans cette catégorie.');
  }
  const contenu = contenuB2c(req, app.categorie.id);
  if (estRefus(contenu)) return contenu;
  const a: Rec = { id: uid(), type: 'b2c', version: 1, statut: 'brouillon', publieeUneFois: false, photos: [], b2c: contenu };
  etat.annonces.push(a);
  sauver();
  return { status: 201, data: await detail(a) };
});

register('PUT', `${PREFIX}/b2c/:id`, async (req) => {
  const a = ecriture(req, 'b2c');
  if (estRefus(a)) return a;
  const contenu = contenuB2c(req, a.b2c?.legacyCategoryId ?? 0);
  if (estRefus(contenu)) return contenu;
  if (enLigne(a)) {
    const absents = manquesB2c(contenu);
    if (absents.length > 0) return incomplete(absents, 'enregistrer');
  }
  a.b2c = contenu;
  a.version += 1;
  sauver();
  return ok(await detail(a));
});

// ----------------------------------------------------------------- photos

const photosReponse = (a: Rec) => ok({ photos: photosVue(a), version: a.version });
/** A photo write: the annonce, when the version given is the one held and its status takes edits. */
function photoEcriture(req: MockRequest, version: unknown): Rec | MockResponse {
  revue();
  const a = trouver(req.pathParams['id']);
  if (!a) return introuvable();
  if (Number(version) !== a.version) return perimee();
  if (a.statut === 'en_revue' || a.statut === 'archivee') return etatInvalide();
  return a;
}

async function dataUrl(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binaire = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binaire += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${file.type};base64,${btoa(binaire)}`;
}

register('POST', `${PREFIX}/:id/photos`, async (req) => {
  const form = req.body instanceof FormData ? req.body : new FormData();
  const a = photoEcriture(req, form.get('version'));
  if (estRefus(a)) return a;
  const files = form.getAll('files').filter((f): f is File => typeof f !== 'string');
  if (files.length === 0 || files.some((f) => f.size === 0)) return problem(400, 'empty_file', 'Le fichier est vide.');
  if (files.some((f) => !['image/png', 'image/jpeg', 'image/webp'].includes(f.type))) {
    return problem(415, 'unsupported_file_type', "L'image doit être au format PNG, JPEG ou WebP.");
  }
  if (files.some((f) => f.size > MAX.photoOctets)) return problem(413, 'file_too_large', "L'image ne doit pas dépasser 5 Mo.");
  if (a.photos.length + files.length > MAX.photos) return problem(409, 'photo_limit_reached', `${MAX.photos} photos au plus par annonce.`);
  for (const file of files) a.photos.push({ id: uid(), url: await dataUrl(file) });
  a.version += 1;
  sauver();
  return photosReponse(a);
});

register('PUT', `${PREFIX}/:id/photos/ordre`, (req) => {
  const b = body<{ version: number; photoIds: string[] }>(req);
  const a = photoEcriture(req, b.version);
  if (estRefus(a)) return a;
  const ids = Array.isArray(b.photoIds) ? b.photoIds : [];
  if (ids.length !== a.photos.length || a.photos.some((p) => !ids.includes(p.id))) {
    return problem(400, 'validation_failed', "L'ordre doit nommer chaque photo de l'annonce.", 'photoIds');
  }
  a.photos = ids.map((id) => a.photos.find((p) => p.id === id)).filter((p) => p !== undefined);
  a.version += 1;
  sauver();
  return photosReponse(a);
});

register('DELETE', `${PREFIX}/:id/photos/:photoId`, (req) => {
  const a = photoEcriture(req, req.query['version']);
  if (estRefus(a)) return a;
  if (!a.photos.some((p) => p.id === req.pathParams['photoId'])) return problem(404, 'photo_not_found', 'Cette photo est introuvable.');
  a.photos = a.photos.filter((p) => p.id !== req.pathParams['photoId']);
  a.version += 1;
  sauver();
  return photosReponse(a);
});

// ------------------------------------------------------------ transitions

/** A transition: the annonce, when the version sent is the one held. */
function transition(req: MockRequest): Rec | MockResponse {
  revue();
  const a = trouver(req.pathParams['id']);
  if (!a) return introuvable();
  if (body<{ version: number }>(req).version !== a.version) return perimee();
  return a;
}

register('POST', `${PREFIX}/:id/soumettre`, async (req) => {
  const a = transition(req);
  if (estRefus(a)) return a;
  if (a.statut !== 'brouillon' && a.statut !== 'refusee' && a.statut !== 'suspendue') return etatInvalide('Cette annonce est déjà soumise ou publiée.');
  const absents = manques(a);
  if (absents.length > 0) return incomplete(absents, a.type === 'b2b' ? 'soumettre' : 'publier');
  if (a.type === 'b2b') {
    const autre = etat.annonces.find((x) => x !== a && x.type === 'b2b' && vivante(x) && x.b2b?.sousCategories.some((s) => a.b2b?.sousCategories.includes(s)));
    if (autre) return problem(409, 'sous_categorie_deja_annoncee', `Un de ces services est déjà proposé dans votre annonce « ${autre.b2b?.titre ?? ''} ».`);
  }
  if (restantes(a.type) <= 0) return problem(409, 'limite_annonces_atteinte', "Vous avez atteint le nombre maximal d'annonces en ligne.");
  a.avant = a.statut;
  a.statut = 'en_revue';
  a.soumiseLe = Date.now();
  a.version += 1;
  sauver();
  return ok({
    annonce: await detail(a),
    confirmation: { titre: 'Annonce envoyée !', texte: 'de9de9 la vérifie avant publication.', bouton: 'Voir mon annonce' },
  });
});

const passage = (route: string, depuis: Statut[], vers: (a: Rec) => Statut) =>
  register('POST', `${PREFIX}/:id/${route}`, async (req) => {
    const a = transition(req);
    if (estRefus(a)) return a;
    if (!depuis.includes(a.statut)) return etatInvalide();
    a.statut = vers(a);
    a.version += 1;
    sauver();
    return ok(await detail(a));
  });
// Back where it came from: a refused or suspended annonce does not become a draft again.
passage('retirer-soumission', ['en_revue'], (a) => a.avant ?? 'brouillon');
passage('mettre-en-pause', ['publiee'], () => 'en_pause');
passage('reprendre', ['en_pause'], () => 'publiee');

register('POST', `${PREFIX}/:id/archiver`, async (req) => {
  const a = transition(req);
  if (estRefus(a)) return a;
  if (!a.publieeUneFois || a.statut === 'archivee') return etatInvalide("Seule une annonce déjà publiée peut être archivée. Supprimez ce brouillon à la place.");
  a.statut = 'archivee';
  a.version += 1;
  sauver();
  return ok(await detail(a));
});

register('POST', `${PREFIX}/:id/dupliquer`, async (req) => {
  revue();
  const a = trouver(req.pathParams['id']);
  if (!a) return introuvable();
  if (a.type === 'b2c') {
    if (a.statut !== 'archivee') return etatInvalide('Une annonce B2C se duplique une fois archivée.');
    if (etat.annonces.some((x) => x.type === 'b2c' && x.statut !== 'archivee' && x.b2c?.legacyCategoryId === a.b2c?.legacyCategoryId)) {
      return problem(409, 'categorie_deja_annoncee', 'Vous avez déjà une annonce dans cette catégorie.');
    }
  }
  const copie: Rec = {
    id: uid(),
    type: a.type,
    version: 1,
    statut: 'brouillon',
    publieeUneFois: false,
    photos: a.photos.map((p) => ({ id: uid(), url: p.url })),
    b2b: a.b2b ? { ...a.b2b, titre: `${a.b2b.titre} (copie)`.slice(0, 120) } : undefined,
    b2c: a.b2c ? { ...a.b2c, lignes: a.b2c.lignes.map((l) => ({ ...l, id: uid() })) } : undefined,
  };
  etat.annonces.push(copie);
  sauver();
  return { status: 201, data: await detail(copie) };
});

register('DELETE', `${PREFIX}/:id`, (req) => {
  revue();
  const a = trouver(req.pathParams['id']);
  if (!a) return introuvable();
  if (Number(req.query['version']) !== a.version) return perimee();
  if (a.publieeUneFois || (a.statut !== 'brouillon' && a.statut !== 'refusee')) return etatInvalide('Une annonce déjà publiée ne se supprime pas : archivez-la.');
  etat.annonces = etat.annonces.filter((x) => x !== a);
  sauver();
  return { status: 204, data: null };
});

// Last: `:id` would otherwise catch the fixed words above it.
register('GET', `${PREFIX}/:id`, async (req) => {
  revue();
  const a = trouver(req.pathParams['id']);
  return a ? ok(await detail(a)) : introuvable();
});

// ---------------------------------------------------------------- the adapter

/**
 * The app's adapter in demo mode: the annonce routes are answered here, every
 * other call goes to the real API untouched.
 */
export function annoncesDemoAdapter(real: AxiosAdapter, baseURL: string | undefined): AxiosAdapter {
  if (baseURL) apiBase = baseURL.replace(/\/+$/, '');
  return (config) => {
    const url = config.url ?? '';
    const path = /^https?:\/\//.test(url) ? new URL(url).pathname.replace(/^\/api(\/v\d+)?(?=\/|$)/, '') : url;
    return path === PREFIX || path.startsWith(`${PREFIX}/`) ? mockAdapter(config) : real(config);
  };
}
