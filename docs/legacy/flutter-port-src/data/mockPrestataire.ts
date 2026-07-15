import type {
  Annonce,
  B2bJob,
  CalendarEvent,
  OpenOffer,
  Reservation,
  SentOffer,
  Worker,
} from '@/types/prestataire'

/** Static seed data for the Prestataire Entreprise experience. */

export const MOCK_WORKERS: Worker[] = [
  { id: 'W1', name: 'Karim Belkacem', role: "Chef d'équipe", available: true, colorHex: '#E0A82E' },
  { id: 'W2', name: 'Sofiane Haddad', role: 'Technicien', available: true, colorHex: '#2F9BE0' },
  { id: 'W3', name: 'Yacine Mansouri', role: 'Agent', available: true, colorHex: '#9B6BE2' },
  { id: 'W4', name: 'Nabil Cherif', role: 'Agent', available: false, colorHex: '#2E9E5B' },
  { id: 'W5', name: 'Riad Toumi', role: 'Technicien', available: true, colorHex: '#E7464E' },
]

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'R-2201',
    clientName: 'Mme Lamia B.',
    serviceName: 'Nettoyage appartement',
    dateLabel: '25 juin 2026',
    wilaya: 'Alger',
    status: 'recue',
    priceDzd: 6000,
    fromWonBid: false,
  },
  {
    id: 'R-2202',
    clientName: 'M. Tarek H.',
    serviceName: 'Réparation climatiseur',
    dateLabel: '26 juin 2026',
    wilaya: 'Blida',
    status: 'recue',
    priceDzd: 4500,
    fromWonBid: false,
  },
  {
    id: 'R-2185',
    clientName: 'Mme Souad K.',
    serviceName: 'Ménage hebdomadaire',
    dateLabel: '22 juin 2026',
    wilaya: 'Alger',
    status: 'confirmee',
    priceDzd: 5000,
    assignedWorkerId: 'W1',
    fromWonBid: false,
  },
  {
    id: 'R-2180',
    clientName: 'M. Amine D.',
    serviceName: 'Installation cuisine',
    dateLabel: '20 juin 2026',
    wilaya: 'Boumerdès',
    status: 'confirmee',
    priceDzd: 22000,
    assignedWorkerId: 'W2',
    fromWonBid: true,
  },
]

export const MOCK_OPEN_OFFERS: OpenOffer[] = [
  {
    id: 'O-501',
    serviceName: 'Peinture appartement F4',
    besoin: 'Rafraîchissement complet, peinture mate blanche.',
    wilaya: 'Alger',
    budgetLabel: '≈ 60 000 DZD',
    delai: 'Sous 2 semaines',
  },
  {
    id: 'O-502',
    serviceName: 'Déménagement villa',
    besoin: 'Déménagement 3 niveaux avec démontage de meubles.',
    wilaya: 'Oran',
    budgetLabel: '≈ 35 000 DZD',
    delai: 'Ce week-end',
  },
  {
    id: 'O-503',
    serviceName: 'Entretien jardin mensuel',
    besoin: 'Taille, tonte et arrosage pour une grande villa.',
    wilaya: 'Tipaza',
    budgetLabel: '≈ 12 000 DZD / mois',
    delai: 'Récurrent',
  },
]

export const MOCK_SENT_OFFERS: SentOffer[] = [
  {
    id: 'S-301',
    serviceName: 'Peinture bureau open-space',
    prixDzd: 48000,
    delai: '5 jours',
    message: 'Disponible immédiatement, équipe de 3.',
    status: 'enAttente',
  },
  {
    id: 'S-298',
    serviceName: 'Réparation plomberie',
    prixDzd: 9000,
    delai: '48h',
    message: 'Intervention rapide possible.',
    status: 'retenue',
  },
  {
    id: 'S-290',
    serviceName: 'Nettoyage fin de chantier',
    prixDzd: 30000,
    delai: '3 jours',
    message: 'Matériel professionnel fourni.',
    status: 'refusee',
  },
]

export const MOCK_B2B_JOBS: B2bJob[] = [
  {
    id: 'B2B-7012',
    clientEntreprise: 'Hôtel El Djazaïr',
    serviceName: 'Nettoyage des chambres',
    occurrenceLabel: 'Occurrence 3/12',
    dateLabel: '25 juin 2026',
    factureStatus: 'none',
  },
  {
    id: 'B2B-7008',
    clientEntreprise: 'SARL TechnoPlus',
    serviceName: 'Maintenance climatisation',
    occurrenceLabel: 'Ponctuel',
    dateLabel: '24 juin 2026',
    assignedWorkerId: 'W5',
    factureStatus: 'envoyee',
    factureAmountDzd: 18000,
  },
  {
    id: 'B2B-6995',
    clientEntreprise: 'Clinique Ennour',
    serviceName: 'Désinfection des locaux',
    occurrenceLabel: 'Occurrence 1/6',
    dateLabel: '18 juin 2026',
    assignedWorkerId: 'W1',
    factureStatus: 'approuvee',
    factureAmountDzd: 26000,
  },
]

export const MOCK_ANNONCES: Annonce[] = [
  { id: 'A-11', title: 'Nettoyage professionnel de bureaux', serviceName: 'Nettoyage & Hygiène', type: 'b2b', active: true },
  { id: 'A-09', title: 'Ménage à domicile', serviceName: 'Nettoyage appartement', type: 'b2c', active: true },
  { id: 'A-07', title: 'Maintenance CVC entreprise', serviceName: 'Maintenance technique', type: 'b2b', active: true },
]

export const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'E1', title: 'Nettoyage chambres — Hôtel El Djazaïr', start: '2026-06-25T09:00', wilaya: 'Alger', source: 'b2b', assignedWorkerId: 'W2' },
  { id: 'E2', title: 'Climatisation — Hôtel El Aurassi', start: '2026-06-25T14:00', wilaya: 'Kouba', source: 'b2b', assignedWorkerId: 'W1' },
  { id: 'E5', title: 'Mise aux normes électriques', start: '2026-06-25T16:00', wilaya: 'El Biar', source: 'b2c', assignedWorkerId: 'W3' },
  { id: 'E3', title: 'Maintenance climatisation — TechnoPlus', start: '2026-06-26T10:00', wilaya: 'Alger', source: 'b2b', assignedWorkerId: 'W5' },
  { id: 'E4', title: 'Réparation climatiseur — M. Tarek', start: '2026-06-26T16:00', wilaya: 'Blida', source: 'b2c', assignedWorkerId: 'W3' },
]

export const MONTHLY_REVENUE: { label: string; ratio: number }[] = [
  { label: 'Jan', ratio: 0.4 },
  { label: 'Fév', ratio: 0.55 },
  { label: 'Mar', ratio: 0.5 },
  { label: 'Avr', ratio: 0.7 },
  { label: 'Mai', ratio: 0.85 },
  { label: 'Juin', ratio: 0.95 },
]
