import type { StatusDef } from './index';

/** Setup states S1–S4 — run once per demand, before any occurrence exists. */
export const SETUP_STATES: StatusDef[] = [
  {
    code: 'arappeler',
    level: 'S',
    num: 'S1',
    fr: 'En attente',
    labels: { client: 'En attente', de9: 'À rappeler', pro: null },
    ball: 'de9',
    action: 'Appeler le client',
    next: ['contacte'],
    actor: 'de9',
  },
  {
    code: 'contacte',
    level: 'S',
    num: 'S2',
    fr: 'Contacté',
    labels: { client: 'Contacté', de9: 'Devis à demander', pro: null },
    ball: 'de9',
    action: 'Demander les devis',
    next: ['devis'],
    actor: 'de9',
  },
  {
    code: 'devis',
    level: 'S',
    num: 'S3',
    fr: 'Devis en cours',
    labels: { client: 'Devis en cours', de9: 'En attente des devis', pro: 'Devis à envoyer' },
    ball: 'pro',
    action: 'Valider les devis',
    next: ['assigne'],
    actor: 'pro',
  },
  {
    code: 'assigne',
    level: 'S',
    num: 'S4',
    fr: 'Assigné',
    labels: {
      client: 'Assigné',
      de9: 'Devis transmis (attente choix)',
      pro: 'Devis envoyé',
    },
    ball: 'client',
    action: 'Choisir le prestataire',
    next: ['toConfirm'],
    actor: 'client',
  },
];
