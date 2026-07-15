import { z } from 'zod';
import { WILAYAS, DELAIS, RECURRENCES } from '@/lib/catalogue';

/** Mock file handle (name only — mirrors common/PieceSlot PieceFile). */
export const pieceFileSchema = z.object({ name: z.string() });
export type PieceFileT = z.infer<typeof pieceFileSchema>;

const SETUP_CODES = ['arappeler', 'contacte', 'devis', 'assigne'] as const;
const VISITE_CODES = [
  'added',
  'toConfirm',
  'confirmed',
  'confirmedAssigned',
  'doneNoInvoice',
  'doneInvoiced',
  'doneDisputed',
  'doneApproved',
  'paid',
  'cancelled',
] as const;

export const occurrenceSchema = z.object({
  id: z.string(),
  date: z.string(),
  status: z.enum(VISITE_CODES),
  montant: z.number().optional(),
  motif: z.string().optional(),
  label: z.string().optional(),
});
export type OccurrenceT = z.infer<typeof occurrenceSchema>;

export const proposalSchema = z.object({
  id: z.string(),
  alias: z.string(),
  montantDzd: z.number(),
  delai: z.string(),
  note: z.number(),
});
export type ProposalT = z.infer<typeof proposalSchema>;

export const tenderSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  serviceName: z.string(),
  description: z.string(),
  wilaya: z.string(),
  delai: z.string(),
  type: z.enum(['ponctuel', 'recurrent']),
  recurrence: z.string().optional(),
  budgetDzd: z.number().optional(),
  setup: z.enum(SETUP_CODES).nullable(),
  occurrences: z.array(occurrenceSchema),
  prov: z
    .object({ alias: z.string(), note: z.number(), missions: z.number() })
    .nullable()
    .optional(),
  proposals: z.array(proposalSchema).optional(),
  createdAt: z.string(),
});
export type Tender = z.infer<typeof tenderSchema>;

export const tenderListSchema = z.array(tenderSchema);

/** Payload sent to POST /tenders. */
export const tenderPublishSchema = z.object({
  familyId: z.string(),
  serviceName: z.string().min(1),
  description: z.string().min(1),
  wilaya: z.string().min(1),
  delai: z.string().min(1),
  budgetDzd: z.number().optional(),
  type: z.enum(['ponctuel', 'recurrent']),
  recurrence: z.string().optional(),
  critere: z.string().optional(),
  attachments: z.array(pieceFileSchema),
});
export type TenderPublishInput = z.infer<typeof tenderPublishSchema>;

/** RHF-managed subset of the publish form (chips + attachments live outside). */
export const tenderPublishFormSchema = z.object({
  description: z.string().min(1),
  wilaya: z.string().min(1),
  delai: z.string().min(1),
  budget: z.string().optional(),
  type: z.enum(['ponctuel', 'recurrent']),
  recurrence: z.enum(RECURRENCES).optional(),
  critere: z.string().optional(),
});
export type TenderPublishForm = z.infer<typeof tenderPublishFormSchema>;

/** POST /tenders/:id/actions body. */
export const tenderActionSchema = z.object({
  action: z.enum([
    'chooseProvider',
    'confirmOcc',
    'approveOcc',
    'contestOcc',
    'addOcc',
    'rescheduleOcc',
    'cancelOcc',
    'cancelDemand',
  ]),
  occId: z.string().optional(),
  date: z.string().optional(),
  motif: z.string().optional(),
});
export type TenderActionInput = z.infer<typeof tenderActionSchema>;

export const CONTEST_MOTIFS = [
  'Montant incorrect',
  'Prestation non conforme',
  'Prestation non réalisée',
] as const;

export const contestInputSchema = z.object({
  motif: z.enum(CONTEST_MOTIFS),
  proof: pieceFileSchema.nullable(),
});
export type ContestInput = z.infer<typeof contestInputSchema>;

export const addOccSchema = z.object({ date: z.string().min(1) });
export type AddOccInput = z.infer<typeof addOccSchema>;

export const reviewInputSchema = z.object({
  note: z.number().min(1).max(5),
  comment: z.string().optional(),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;

/** Consistent WILAYAS/DELAIS lists re-exported for form option rendering. */
export { WILAYAS, DELAIS, RECURRENCES };
