// Mock API route table for the Entreprise app. One flat file, grouped by feature.
// Reads serve from db; mutations apply the canonical status transitions. Feature
// api hooks own zod validation on the response side (BUILD-SPEC §8).
import { register } from './router';
import { ok, notFound, badRequest, field } from './http';
import {
  db,
  nextId,
  tenderById,
  b2bJobById,
  workerById,
  currentOcc,
  type Tender,
  type Worker,
  type FactureStatus,
} from './db';
import { CATALOGUE, FAMILY_BY_ID } from '@/lib/catalogue';
import type { Occurrence, VisiteCode } from '@/lib/statusModel';

// ===================== infra =====================
register('GET', '/health', () => ok({ status: 'ok' }));

// ===================== auth / onboarding =====================
register('POST', '/auth/login', (req) => {
  const role = field<string>(req.body, 'role') === 'prestataire' ? 'prestataire' : 'client';
  const name = role === 'prestataire' ? 'PlombEx' : 'Hôtel El Aurassi';
  return ok({ token: `mock-${role}-token`, user: { id: `${role}-1`, name, role } });
});
register('POST', '/auth/signup/pro', () =>
  ok({ token: 'mock-prestataire-token', user: { id: 'prestataire-1', name: 'PlombEx', role: 'prestataire' } }),
);
register('POST', '/auth/signup/client', () =>
  ok({ token: 'mock-client-token', user: { id: 'client-1', name: 'Hôtel El Aurassi', role: 'client' } }),
);

// ===================== kyc =====================
register('GET', '/kyc/:key', (req) => {
  const key = req.pathParams['key'] ?? 'client';
  const validated = key === 'client' ? db.kyc.clientValidated : db.kyc.presValidated;
  return ok({ validated });
});
register('POST', '/kyc/:key', (req) => {
  const key = req.pathParams['key'] ?? 'client';
  if (key === 'client') db.kyc.clientValidated = true;
  else db.kyc.presValidated = true;
  return ok({ validated: true });
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

// ===================== client calendar =====================
register('GET', '/client/calendar', () => {
  const events = db.tenders.flatMap((t) =>
    t.occurrences
      .filter((o) => o.status === 'confirmed' || o.status === 'confirmedAssigned')
      .map((o) => ({ id: o.id, tenderId: t.id, title: t.serviceName, date: o.date, wilaya: t.wilaya })),
  );
  return ok(events);
});

// ===================== prestataire dashboard / stats / calendar =====================
register('GET', '/prestataire/dashboard', () => ok(db.dashboard));
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
