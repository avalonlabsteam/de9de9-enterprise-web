import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClientKyc, Tender, Wallet, Invoice } from '@/types/client'
import { MOCK_INVOICES, MOCK_TENDERS, MOCK_WALLET } from '@/data/mockClient'

export interface NewTenderInput {
  familyId: number
  serviceName: string
  description: string
  wilaya: string
  delai: string
  type: Tender['type']
  recurrence?: string
  budgetDzd?: number
}

interface ClientState {
  tenders: Tender[]
  wallet: Wallet
  invoices: Invoice[]
  kyc: ClientKyc
  addTender: (input: NewTenderInput) => string
  submitKyc: (rc: string, nif: string, nis: string) => void
  toggleSubscription: () => void
}

let tenderSeq = 1043

export const useClientStore = create<ClientState>()(
  persist(
    (set, get) => ({
      tenders: MOCK_TENDERS,
      wallet: MOCK_WALLET,
      invoices: MOCK_INVOICES,
      kyc: { rc: '', nif: '', nis: '', validated: false },

      addTender: (input) => {
        const id = `AO-${tenderSeq++}`
        const tender: Tender = {
          id,
          ...input,
          status: 'enAttente',
          createdAt: new Date().toISOString().slice(0, 10),
          attachments: [],
        }
        set({ tenders: [tender, ...get().tenders] })
        return id
      },

      // Mock: submitting RC/NIF/NIS auto-validates the dossier.
      submitKyc: (rc, nif, nis) =>
        set({ kyc: { rc, nif, nis, validated: true } }),

      toggleSubscription: () =>
        set((s) => ({
          wallet: { ...s.wallet, subscriptionActive: !s.wallet.subscriptionActive },
        })),
    }),
    {
      name: 'de9de9_client',
      // Persist only user-mutable state; mock seeds stay code-defined defaults.
      partialize: (s) => ({ kyc: s.kyc }),
    },
  ),
)
