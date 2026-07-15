/** A member of the prestataire's effectif (team), assignable to jobs/orders. */
export interface Worker {
  id: string
  name: string
  role: string
  available: boolean
  /** Hex colour used to tag this worker across the calendar / agenda. */
  colorHex: string
}

/** B2C order from an individual client. `recue` = new, `confirmee` = confirmed. */
export type ReservationStatus = 'recue' | 'confirmee'

export interface Reservation {
  id: string
  clientName: string
  serviceName: string
  dateLabel: string
  wilaya: string
  status: ReservationStatus
  priceDzd?: number
  assignedWorkerId?: string
  /** True when this confirmed service originated from a won appel d'offres. */
  fromWonBid: boolean
}

/** An open client appel d'offres the pro can bid on (B2C · Explorer). */
export interface OpenOffer {
  id: string
  serviceName: string
  besoin: string
  wilaya: string
  budgetLabel: string
  delai: string
}

export type SentOfferStatus = 'enAttente' | 'retenue' | 'refusee'

/** A bid this pro submitted on an open offer (B2C · Offres envoyées). */
export interface SentOffer {
  id: string
  serviceName: string
  prixDzd: number
  delai: string
  message: string
  status: SentOfferStatus
}

/** Lifecycle of the provider's facture for a B2B job. `none` = not uploaded. */
export type FactureStatus = 'none' | 'envoyee' | 'recue' | 'approuvee' | 'contestee'

/** An enterprise job routed to this prestataire by the de9de9 admin. */
export interface B2bJob {
  id: string
  clientEntreprise: string
  serviceName: string
  occurrenceLabel: string
  dateLabel: string
  assignedWorkerId?: string
  factureStatus: FactureStatus
  factureAmountDzd?: number
}

export type AnnonceType = 'b2c' | 'b2b'

/** A listing published by the prestataire. */
export interface Annonce {
  id: string
  title: string
  serviceName: string
  type: AnnonceType
  active: boolean
}

export type BookingSource = 'b2c' | 'b2b'

/** A scheduled booking shown on the prestataire calendar (day agenda). */
export interface CalendarEvent {
  id: string
  title: string
  /** ISO datetime string. */
  start: string
  wilaya: string
  source: BookingSource
  assignedWorkerId?: string
}
