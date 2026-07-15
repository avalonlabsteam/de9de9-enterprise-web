import type { Invoice, Tender, Wallet } from '@/types/client'

/** Seed appels d'offres covering every status of the suivi flow. */
export const MOCK_TENDERS: Tender[] = [
  {
    id: 'AO-1042',
    familyId: 6,
    serviceName: 'Nettoyage de bureaux & locaux professionnels',
    description:
      'Entretien quotidien de nos bureaux (1 200 m²) sur le plateau Alger Centre, hors week-ends.',
    wilaya: 'Alger',
    delai: 'Sous 1 semaine',
    type: 'recurrent',
    recurrence: 'Mensuel',
    budgetDzd: 180000,
    status: 'enCours',
    createdAt: '2026-06-10',
    attachments: [],
  },
  {
    id: 'AO-1037',
    familyId: 4,
    serviceName: "Développement d'applications mobiles",
    description:
      'Refonte de notre application de réservation interne (iOS + Android), back-office inclus.',
    wilaya: 'Oran',
    delai: '2 à 3 mois',
    type: 'ponctuel',
    budgetDzd: 950000,
    status: 'assigne',
    createdAt: '2026-06-14',
    attachments: [],
  },
  {
    id: 'AO-1031',
    familyId: 7,
    serviceName: 'Société de gardiennage',
    description: 'Gardiennage 24/7 pour notre site logistique de Rouïba.',
    wilaya: 'Alger',
    delai: 'Immédiat',
    type: 'recurrent',
    recurrence: 'Annuel',
    status: 'contacte',
    createdAt: '2026-06-18',
    attachments: [],
  },
  {
    id: 'AO-1029',
    familyId: 1,
    serviceName: 'Rédaction & révision de contrats',
    description: 'Révision de nos contrats fournisseurs et mise en conformité.',
    wilaya: 'Constantine',
    delai: 'Sous 72h',
    type: 'ponctuel',
    budgetDzd: 120000,
    status: 'enAttente',
    createdAt: '2026-06-22',
    attachments: [],
  },
  {
    id: 'AO-1018',
    familyId: 13,
    serviceName: 'Traiteur événementiel',
    description:
      'Séminaire annuel — 220 couverts, pause-café et déjeuner assis.',
    wilaya: 'Alger',
    delai: 'Terminé',
    type: 'ponctuel',
    budgetDzd: 430000,
    status: 'termine',
    createdAt: '2026-05-28',
    attachments: [],
  },
]

/** Seed wallet ledger: admin top-ups and invoice-linked deductions. */
export const MOCK_WALLET: Wallet = {
  balanceCredits: 2350000,
  subscriptionActive: false,
  transactions: [
    {
      id: 'TX-09',
      type: 'deduction',
      amountCredits: 1800000,
      label: 'Nettoyage bureaux — Juin 2026',
      date: '2026-06-15',
      invoiceId: 'FAC-2061',
    },
    {
      id: 'TX-08',
      type: 'recharge',
      amountCredits: 5000000,
      label: 'Rechargement (admin de9de9)',
      date: '2026-06-01',
    },
    {
      id: 'TX-07',
      type: 'deduction',
      amountCredits: 1800000,
      label: 'Nettoyage bureaux — Mai 2026',
      date: '2026-05-15',
      invoiceId: 'FAC-2055',
    },
    {
      id: 'TX-06',
      type: 'deduction',
      amountCredits: 4300000,
      label: 'Traiteur séminaire annuel',
      date: '2026-05-30',
      invoiceId: 'FAC-2040',
    },
    {
      id: 'TX-05',
      type: 'recharge',
      amountCredits: 5000000,
      label: 'Rechargement (admin de9de9)',
      date: '2026-05-02',
    },
  ],
}

/** Seed provider-enterprise invoices received by the client. */
export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'FAC-2061',
    tenderId: 'AO-1042',
    label: 'Nettoyage bureaux — Juin 2026',
    amountDzd: 180000,
    issuedAt: '2026-06-15',
    occurrenceLabel: 'Occurrence 2/12',
  },
  {
    id: 'FAC-2055',
    tenderId: 'AO-1042',
    label: 'Nettoyage bureaux — Mai 2026',
    amountDzd: 180000,
    issuedAt: '2026-05-15',
    occurrenceLabel: 'Occurrence 1/12',
  },
  {
    id: 'FAC-2040',
    tenderId: 'AO-1018',
    label: 'Traiteur séminaire annuel',
    amountDzd: 430000,
    issuedAt: '2026-05-30',
  },
]

/** Algerian wilayas (subset commonly used for B2B), for the publish form. */
export const WILAYAS = [
  'Alger',
  'Oran',
  'Constantine',
  'Annaba',
  'Blida',
  'Sétif',
  'Béjaïa',
  'Tizi Ouzou',
  'Tlemcen',
  'Batna',
  'Ouargla',
  'Ghardaïa',
]

export const DELAIS = [
  'Immédiat',
  'Sous 72h',
  'Sous 1 semaine',
  'Sous 1 mois',
  '2 à 3 mois',
  'Flexible',
]

export const RECURRENCES = ['Hebdomadaire', 'Mensuel', 'Trimestriel', 'Annuel']
