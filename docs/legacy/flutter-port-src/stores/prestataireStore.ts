import { create } from 'zustand'
import type {
  Annonce,
  AnnonceType,
  B2bJob,
  CalendarEvent,
  FactureStatus,
  OpenOffer,
  Reservation,
  SentOffer,
  Worker,
} from '@/types/prestataire'
import {
  MOCK_ANNONCES,
  MOCK_B2B_JOBS,
  MOCK_EVENTS,
  MOCK_OPEN_OFFERS,
  MOCK_RESERVATIONS,
  MOCK_SENT_OFFERS,
  MOCK_WORKERS,
} from '@/data/mockPrestataire'

interface PrestataireState {
  workers: Worker[]
  reservations: Reservation[]
  openOffers: OpenOffer[]
  sentOffers: SentOffer[]
  b2bJobs: B2bJob[]
  annonces: Annonce[]
  events: CalendarEvent[]

  /** Accept a received B2C order → moves it to "confirmée". */
  acceptReservation: (id: string) => void
  /** Refuse (and remove) a received B2C order. */
  refuseReservation: (id: string) => void
  /** Assign a team member to a reservation. */
  assignReservationWorker: (id: string, workerId: string) => void
  /** Assign a team member to a B2B job. */
  assignJobWorker: (id: string, workerId: string) => void
  /** Upload a facture for a B2B job (mock → status "envoyée"). */
  uploadFacture: (id: string, amountDzd: number) => void
  /** Toggle a worker's availability. */
  toggleWorker: (id: string) => void
  /** Publish a new annonce. */
  addAnnonce: (input: { title: string; serviceName: string; type: AnnonceType }) => string
  /** Toggle an annonce active/paused. */
  toggleAnnonce: (id: string) => void
}

let annonceSeq = 12

export const usePrestataireStore = create<PrestataireState>()((set, get) => ({
  workers: MOCK_WORKERS,
  reservations: MOCK_RESERVATIONS,
  openOffers: MOCK_OPEN_OFFERS,
  sentOffers: MOCK_SENT_OFFERS,
  b2bJobs: MOCK_B2B_JOBS,
  annonces: MOCK_ANNONCES,
  events: MOCK_EVENTS,

  acceptReservation: (id) =>
    set((s) => ({
      reservations: s.reservations.map((r) =>
        r.id === id ? { ...r, status: 'confirmee' } : r,
      ),
    })),

  refuseReservation: (id) =>
    set((s) => ({ reservations: s.reservations.filter((r) => r.id !== id) })),

  assignReservationWorker: (id, workerId) =>
    set((s) => ({
      reservations: s.reservations.map((r) =>
        r.id === id ? { ...r, assignedWorkerId: workerId } : r,
      ),
    })),

  assignJobWorker: (id, workerId) =>
    set((s) => ({
      b2bJobs: s.b2bJobs.map((j) =>
        j.id === id ? { ...j, assignedWorkerId: workerId } : j,
      ),
    })),

  uploadFacture: (id, amountDzd) =>
    set((s) => ({
      b2bJobs: s.b2bJobs.map((j) =>
        j.id === id
          ? { ...j, factureStatus: 'envoyee' as FactureStatus, factureAmountDzd: amountDzd }
          : j,
      ),
    })),

  toggleWorker: (id) =>
    set((s) => ({
      workers: s.workers.map((w) =>
        w.id === id ? { ...w, available: !w.available } : w,
      ),
    })),

  addAnnonce: (input) => {
    const id = `A-${annonceSeq++}`
    const annonce: Annonce = { id, ...input, active: true }
    set({ annonces: [annonce, ...get().annonces] })
    return id
  },

  toggleAnnonce: (id) =>
    set((s) => ({
      annonces: s.annonces.map((a) =>
        a.id === id ? { ...a, active: !a.active } : a,
      ),
    })),
}))

/** Lookup helper. */
export function workerById(workers: Worker[], id?: string): Worker | undefined {
  return id ? workers.find((w) => w.id === id) : undefined
}
