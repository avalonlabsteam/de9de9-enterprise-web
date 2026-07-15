// In-memory mock database for the Entreprise app. Self-contained: row types are
// declared here (feature zod schemas mirror these shapes and parse responses).
// Handlers mutate this module-level singleton; pure helpers live at the bottom.
// Seed values come from BUILD-SPEC §8.
import type { Occurrence, SetupCode, VisiteCode } from '@/lib/statusModel';

// ---------------------------------------------------------------- row types
export interface Tender {
  id: string;
  familyId: string;
  serviceName: string;
  description: string;
  wilaya: string;
  delai: string;
  type: 'ponctuel' | 'recurrent';
  recurrence?: string;
  budgetDzd?: number;
  setup: SetupCode | null;
  occurrences: Occurrence[];
  /** Blind-masked provider handle once assigned (never real identity). */
  prov?: { alias: string; note: number; missions: number } | null;
  proposals?: TenderProposal[];
  createdAt: string;
}

export interface TenderProposal {
  id: string;
  alias: string;
  montantDzd: number;
  delai: string;
  note: number;
}

export interface WalletTx {
  id: string;
  type: 'recharge' | 'deduction';
  amountCredits: number;
  label: string;
  date: string;
  invoiceId?: string;
}
export interface Wallet {
  balanceCredits: number;
  subscriptionActive: boolean;
  history: WalletTx[];
}

export interface Facture {
  id: string;
  tenderId: string;
  label: string;
  amountDzd: number;
  issuedAt: string;
  occurrenceLabel?: string;
  status: 'waiting' | 'approved' | 'contested';
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  available: boolean;
  colorHex: string;
  status?: 'active' | 'pending' | 'empty';
  type?: 'pro' | 'salarie';
  skills?: string[];
  avail?: string;
  hours?: string;
  tarif?: string;
  note?: number;
  token?: string;
  phone?: string;
}

export interface Reservation {
  id: string;
  clientName: string;
  serviceName: string;
  dateLabel: string;
  wilaya: string;
  status: 'recue' | 'confirmee';
  priceDzd?: number;
  assignedWorkerId?: string;
  fromWonBid: boolean;
}

export interface OpenOffer {
  id: string;
  title: string;
  description: string;
  wilaya: string;
  priceLabel: string;
  delai: string;
}

export interface SentOffer {
  id: string;
  title: string;
  prixDzd: number;
  delai: string;
  message: string;
  status: 'enAttente' | 'retenue' | 'refusee';
}

export type FactureStatus = 'none' | 'envoyee' | 'recue' | 'approuvee' | 'contestee';

export interface B2bJob {
  id: string;
  clientEntreprise: string;
  serviceName: string;
  occurrenceLabel: string;
  dateLabel: string;
  assignedWorkerId?: string;
  factureStatus: FactureStatus;
  factureAmountDzd?: number;
  status: VisiteCode;
  addr?: string;
  freq?: string;
  instr?: string;
  history?: { label: string; date: string; status: VisiteCode }[];
}

export interface Annonce {
  id: string;
  title: string;
  serviceName: string;
  type: 'b2c' | 'b2b';
  active: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  wilaya: string;
  source: 'b2c' | 'b2b';
  assignedWorkerId?: string;
}

export interface KycState {
  clientValidated: boolean;
  presValidated: boolean;
}

// ------------------------------------------------------------------ helpers
const occ = (
  id: string,
  date: string,
  status: VisiteCode,
  montant?: number,
  label?: string,
  motif?: string,
): Occurrence => ({ id, date, status, montant, label, motif });

// ------------------------------------------------------------------- seeds
const tenders: Tender[] = [
  {
    id: 'AO-1042',
    familyId: '6',
    serviceName: 'Nettoyage de bureaux & locaux professionnels',
    description: 'Nettoyage mensuel des bureaux du siège (3 étages, ~1200 m²).',
    wilaya: 'Alger',
    delai: 'Sous 1 semaine',
    type: 'recurrent',
    recurrence: 'Mensuel',
    budgetDzd: 180000,
    setup: null,
    prov: { alias: 'Prestataire vérifié', note: 4.8, missions: 512 },
    createdAt: '2026-05-10',
    occurrences: [
      occ('AO-1042-1', '2026-05-15', 'paid', 180000, 'Occurrence 1/12'),
      occ('AO-1042-2', '2026-06-15', 'doneInvoiced', 180000, 'Occurrence 2/12'),
      occ('AO-1042-3', '2026-07-15', 'toConfirm', undefined, 'Occurrence 3/12'),
      occ('AO-1042-4', '2026-08-15', 'confirmed', undefined, 'Occurrence 4/12'),
    ],
  },
  {
    id: 'AO-1037',
    familyId: '4',
    serviceName: "Développement d'applications mobiles",
    description: 'Application mobile de gestion interne (iOS + Android).',
    wilaya: 'Oran',
    delai: '2 à 3 mois',
    type: 'ponctuel',
    budgetDzd: 950000,
    setup: 'assigne',
    createdAt: '2026-06-20',
    proposals: [
      { id: 'P1', alias: 'Prestataire A', montantDzd: 920000, delai: '10 semaines', note: 4.7 },
      { id: 'P2', alias: 'Prestataire B', montantDzd: 880000, delai: '12 semaines', note: 4.5 },
    ],
    occurrences: [],
  },
  {
    id: 'AO-1031',
    familyId: '7',
    serviceName: 'Société de gardiennage',
    description: 'Gardiennage 24/7 du site logistique, 3 agents par rotation.',
    wilaya: 'Alger',
    delai: 'Immédiat',
    type: 'recurrent',
    recurrence: 'Annuel',
    setup: 'contacte',
    createdAt: '2026-06-28',
    occurrences: [],
  },
  {
    id: 'AO-1029',
    familyId: '1',
    serviceName: 'Rédaction & révision de contrats',
    description: 'Révision de 5 contrats commerciaux fournisseurs.',
    wilaya: 'Constantine',
    delai: 'Sous 72h',
    type: 'ponctuel',
    budgetDzd: 120000,
    setup: 'arappeler',
    createdAt: '2026-07-01',
    occurrences: [],
  },
  {
    id: 'AO-1018',
    familyId: '13',
    serviceName: 'Traiteur événementiel',
    description: 'Traiteur pour le séminaire annuel (250 couverts).',
    wilaya: 'Alger',
    delai: 'Flexible',
    type: 'ponctuel',
    budgetDzd: 430000,
    setup: null,
    prov: { alias: 'Prestataire vérifié', note: 4.9, missions: 210 },
    createdAt: '2026-05-01',
    occurrences: [occ('AO-1018-1', '2026-05-30', 'paid', 430000)],
  },
];

const wallet: Wallet = {
  balanceCredits: 2_350_000,
  subscriptionActive: false,
  history: [
    { id: 'TX-09', type: 'deduction', amountCredits: 1_800_000, label: 'Nettoyage bureaux — Juin 2026', date: '2026-06-15', invoiceId: 'FAC-2061' },
    { id: 'TX-08', type: 'recharge', amountCredits: 5_000_000, label: 'Rechargement (admin de9de9)', date: '2026-06-01' },
    { id: 'TX-07', type: 'deduction', amountCredits: 1_800_000, label: 'Nettoyage bureaux — Mai 2026', date: '2026-05-15', invoiceId: 'FAC-2055' },
    { id: 'TX-06', type: 'deduction', amountCredits: 4_300_000, label: 'Traiteur séminaire annuel', date: '2026-05-30', invoiceId: 'FAC-2040' },
    { id: 'TX-05', type: 'recharge', amountCredits: 5_000_000, label: 'Rechargement (admin de9de9)', date: '2026-05-02' },
  ],
};

const factures: Facture[] = [
  { id: 'FAC-2061', tenderId: 'AO-1042', label: 'Nettoyage bureaux — Juin 2026', amountDzd: 180000, issuedAt: '2026-06-15', occurrenceLabel: 'Occurrence 2/12', status: 'waiting' },
  { id: 'FAC-2055', tenderId: 'AO-1042', label: 'Nettoyage bureaux — Mai 2026', amountDzd: 180000, issuedAt: '2026-05-15', occurrenceLabel: 'Occurrence 1/12', status: 'approved' },
  { id: 'FAC-2040', tenderId: 'AO-1018', label: 'Traiteur séminaire annuel', amountDzd: 430000, issuedAt: '2026-05-30', status: 'approved' },
];

const workers: Worker[] = [
  { id: 'W1', name: 'Karim Belkacem', role: "Chef d'équipe", available: true, colorHex: '#E0A82E', status: 'active', type: 'pro', skills: ['Nettoyage', 'Encadrement'], avail: 'Disponible', hours: '38h/sem', tarif: '2 500 DA/j', note: 4.8, phone: '0550 11 22 33' },
  { id: 'W2', name: 'Sofiane Haddad', role: 'Technicien', available: true, colorHex: '#2F9BE0', status: 'active', type: 'pro', skills: ['Plomberie', 'CVC'], avail: 'Disponible', hours: '40h/sem', tarif: '3 000 DA/j', note: 4.6, phone: '0551 22 33 44' },
  { id: 'W3', name: 'Yacine Mansouri', role: 'Agent', available: true, colorHex: '#9B6BE2', status: 'active', type: 'salarie', skills: ['Gardiennage'], avail: 'Disponible', hours: '35h/sem', tarif: '2 000 DA/j', note: 4.7, phone: '0552 33 44 55' },
  { id: 'W4', name: 'Nabil Cherif', role: 'Agent', available: false, colorHex: '#2E9E5B', status: 'active', type: 'salarie', skills: ['Manutention'], avail: 'Occupé', hours: '40h/sem', tarif: '2 000 DA/j', note: 4.4, phone: '0553 44 55 66' },
  { id: 'W5', name: 'Riad Toumi', role: 'Technicien', available: true, colorHex: '#E7464E', status: 'active', type: 'pro', skills: ['Climatisation'], avail: 'Disponible', hours: '39h/sem', tarif: '3 200 DA/j', note: 4.9, phone: '0554 55 66 77' },
  { id: 'W6', name: '—', role: 'Slot en attente', available: false, colorHex: '#8A94A0', status: 'pending', type: 'pro', token: 'de9de9.dz/join/8fk2p9' },
  { id: 'W7', name: '—', role: 'Slot libre', available: false, colorHex: '#B6BEC8', status: 'empty', type: 'pro' },
];

const reservations: Reservation[] = [
  { id: 'R-2201', clientName: 'Mme Lamia B.', serviceName: 'Nettoyage appartement', dateLabel: '25 juin 2026', wilaya: 'Alger', status: 'recue', priceDzd: 6000, fromWonBid: false },
  { id: 'R-2202', clientName: 'M. Tarek H.', serviceName: 'Réparation climatiseur', dateLabel: '26 juin 2026', wilaya: 'Blida', status: 'recue', priceDzd: 4500, fromWonBid: false },
  { id: 'R-2185', clientName: 'Mme Souad K.', serviceName: 'Ménage hebdomadaire', dateLabel: '22 juin 2026', wilaya: 'Alger', status: 'confirmee', priceDzd: 5000, assignedWorkerId: 'W1', fromWonBid: false },
  { id: 'R-2180', clientName: 'M. Amine D.', serviceName: 'Installation cuisine', dateLabel: '20 juin 2026', wilaya: 'Boumerdès', status: 'confirmee', priceDzd: 22000, assignedWorkerId: 'W2', fromWonBid: true },
];

const openOffers: OpenOffer[] = [
  { id: 'O-501', title: 'Peinture appartement F4', description: 'Rafraîchissement complet, peinture mate blanche.', wilaya: 'Alger', priceLabel: '≈ 60 000 DZD', delai: 'Sous 2 semaines' },
  { id: 'O-502', title: 'Déménagement villa', description: 'Déménagement 3 niveaux avec démontage de meubles.', wilaya: 'Oran', priceLabel: '≈ 35 000 DZD', delai: 'Ce week-end' },
  { id: 'O-503', title: 'Entretien jardin mensuel', description: 'Taille, tonte et arrosage pour une grande villa.', wilaya: 'Tipaza', priceLabel: '≈ 12 000 DZD / mois', delai: 'Récurrent' },
];

const sentOffers: SentOffer[] = [
  { id: 'S-301', title: 'Peinture bureau open-space', prixDzd: 48000, delai: '5 jours', message: 'Disponible immédiatement, équipe de 3.', status: 'enAttente' },
  { id: 'S-298', title: 'Réparation plomberie', prixDzd: 9000, delai: '48h', message: 'Intervention rapide possible.', status: 'retenue' },
  { id: 'S-290', title: 'Nettoyage fin de chantier', prixDzd: 30000, delai: '3 jours', message: 'Matériel professionnel fourni.', status: 'refusee' },
];

const b2bJobs: B2bJob[] = [
  {
    id: 'B2B-7012', clientEntreprise: 'Hôtel El Djazaïr', serviceName: 'Nettoyage des chambres',
    occurrenceLabel: 'Occurrence 3/12', dateLabel: '25 juin 2026', factureStatus: 'none', status: 'confirmed',
    addr: 'Rue Aïn Zeboudja, Alger', freq: 'Mensuel', instr: 'Accès par l’entrée de service, badge à récupérer à l’accueil.',
    history: [
      { label: 'Occurrence 1/12', date: '25 avr. 2026', status: 'paid' },
      { label: 'Occurrence 2/12', date: '25 mai 2026', status: 'paid' },
    ],
  },
  {
    id: 'B2B-7008', clientEntreprise: 'SARL TechnoPlus', serviceName: 'Maintenance climatisation',
    occurrenceLabel: 'Ponctuel', dateLabel: '24 juin 2026', assignedWorkerId: 'W5', factureStatus: 'envoyee', factureAmountDzd: 18000, status: 'doneInvoiced',
    addr: 'Zone industrielle, Rouiba', freq: 'Ponctuel', instr: 'Contrôle des 6 unités extérieures.',
    history: [],
  },
  {
    id: 'B2B-6995', clientEntreprise: 'Clinique Ennour', serviceName: 'Désinfection des locaux',
    occurrenceLabel: 'Occurrence 1/6', dateLabel: '18 juin 2026', assignedWorkerId: 'W1', factureStatus: 'approuvee', factureAmountDzd: 26000, status: 'doneApproved',
    addr: 'Boulevard Krim Belkacem, Alger', freq: 'Bimestriel', instr: 'Intervention hors heures d’ouverture uniquement.',
    history: [],
  },
];

const annonces: Annonce[] = [
  { id: 'A-11', title: 'Nettoyage professionnel de bureaux', serviceName: 'Nettoyage & Hygiène', type: 'b2b', active: true },
  { id: 'A-09', title: 'Ménage à domicile', serviceName: 'Nettoyage appartement', type: 'b2c', active: true },
  { id: 'A-07', title: 'Maintenance CVC entreprise', serviceName: 'Maintenance technique', type: 'b2b', active: true },
];

const calendarEvents: CalendarEvent[] = [
  { id: 'E1', title: 'Nettoyage chambres — Hôtel El Djazaïr', start: '2026-06-25T09:00', wilaya: 'Alger', source: 'b2b', assignedWorkerId: 'W2' },
  { id: 'E2', title: 'Climatisation — Hôtel El Aurassi', start: '2026-06-25T14:00', wilaya: 'Kouba', source: 'b2b', assignedWorkerId: 'W1' },
  { id: 'E5', title: 'Mise aux normes électriques', start: '2026-06-25T16:00', wilaya: 'El Biar', source: 'b2c', assignedWorkerId: 'W3' },
  { id: 'E3', title: 'Maintenance climatisation — TechnoPlus', start: '2026-06-26T10:00', wilaya: 'Alger', source: 'b2b', assignedWorkerId: 'W5' },
  { id: 'E4', title: 'Réparation climatiseur — M. Tarek', start: '2026-06-26T16:00', wilaya: 'Blida', source: 'b2c', assignedWorkerId: 'W3' },
];

const dashboard = {
  entreprise: 'PlombEx',
  verified: true,
  stats: { avenir: 9, enCours: 3, completes: 512 },
  equipe: { used: 3, total: 5 },
  chiffreAffaireDa: 152000,
};

const stats = {
  chiffreAffaireDa: 152000,
  trendPct: 12,
  revenueDzd: 312000,
  missions: 48,
  rating: 4.8,
  winRatePct: 62,
  monthly: [
    { month: 'Jan', ratio: 0.4 },
    { month: 'Fév', ratio: 0.55 },
    { month: 'Mar', ratio: 0.5 },
    { month: 'Avr', ratio: 0.7 },
    { month: 'Mai', ratio: 0.85 },
    { month: 'Juin', ratio: 0.95 },
  ],
  parCategorie: [
    { label: 'Nettoyage', valueDzd: 128000 },
    { label: 'Climatisation', valueDzd: 96000 },
    { label: 'Plomberie', valueDzd: 88000 },
  ],
};

const kyc: KycState = { clientValidated: false, presValidated: true };

export const db = {
  tenders,
  wallet,
  factures,
  workers,
  reservations,
  openOffers,
  sentOffers,
  b2bJobs,
  annonces,
  calendarEvents,
  dashboard,
  stats,
  kyc,
};

// -------------------------------------------------------------- id + helpers
let seq = 5000;
export function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function tenderById(id: string): Tender | undefined {
  return db.tenders.find((t) => t.id === id);
}

export function b2bJobById(id: string): B2bJob | undefined {
  return db.b2bJobs.find((j) => j.id === id);
}

export function workerById(id: string): Worker | undefined {
  return db.workers.find((w) => w.id === id);
}

/** The occurrence whose status currently needs an action (earliest non-terminal). */
export function currentOcc(t: Tender): Occurrence | undefined {
  return t.occurrences.find((o) => o.status !== 'paid' && o.status !== 'cancelled');
}
