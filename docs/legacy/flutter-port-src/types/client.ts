/** Lifecycle of a client's appel d'offres (suivi flow). */
export type TenderStatus =
  | 'enAttente'
  | 'contacte'
  | 'assigne'
  | 'enCours'
  | 'termine'

export const TENDER_STATUS_ORDER: TenderStatus[] = [
  'enAttente',
  'contacte',
  'assigne',
  'enCours',
  'termine',
]

/** Whether the need is one-off or a recurring contract. */
export type TenderType = 'ponctuel' | 'recurrent'

/** A published (or draft) appel d'offres — the core client artifact. */
export interface Tender {
  id: string
  familyId: number
  serviceName: string
  description: string
  wilaya: string
  delai: string
  type: TenderType
  status: TenderStatus
  /** ISO date string. */
  createdAt: string
  budgetDzd?: number
  recurrence?: string
  attachments: string[]
}

/** Direction of a wallet movement. */
export type WalletTxType = 'recharge' | 'deduction'

export interface WalletTransaction {
  id: string
  type: WalletTxType
  /** Always positive; `type` gives the direction. */
  amountCredits: number
  label: string
  /** ISO date string. */
  date: string
  invoiceId?: string
}

export interface Wallet {
  balanceCredits: number
  transactions: WalletTransaction[]
  subscriptionActive: boolean
}

/** A provider-enterprise invoice the client receives. */
export interface Invoice {
  id: string
  tenderId: string
  label: string
  amountDzd: number
  /** ISO date string. */
  issuedAt: string
  /** e.g. "Occurrence 2/12" for recurring contracts. */
  occurrenceLabel?: string
}

/** Enterprise-client KYC dossier. Publishing is locked until `validated`. */
export interface ClientKyc {
  rc: string
  nif: string
  nis: string
  validated: boolean
}

/** 1 DZD = 10 crédits. */
export const CREDITS_PER_DZD = 10
