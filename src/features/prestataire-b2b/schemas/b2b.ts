import { z } from 'zod';

/** Visite status codes as they live in the status model (mirrors VisiteCode). */
const visiteCodeSchema = z.enum([
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
]);

export const factureStatusSchema = z.enum(['none', 'envoyee', 'recue', 'approuvee', 'contestee']);
export type FactureStatus = z.infer<typeof factureStatusSchema>;

export const b2bHistoryEntrySchema = z.object({
  label: z.string(),
  date: z.string(),
  status: visiteCodeSchema,
});

export const b2bJobSchema = z.object({
  id: z.string(),
  clientEntreprise: z.string(),
  serviceName: z.string(),
  occurrenceLabel: z.string(),
  dateLabel: z.string(),
  assignedWorkerId: z.string().optional(),
  factureStatus: factureStatusSchema,
  factureAmountDzd: z.number().optional(),
  status: visiteCodeSchema,
  addr: z.string().optional(),
  freq: z.string().optional(),
  instr: z.string().optional(),
  history: z.array(b2bHistoryEntrySchema).optional(),
});
export const b2bJobsSchema = z.array(b2bJobSchema);
export type B2bJob = z.infer<typeof b2bJobSchema>;

/** Workers listing (only fields we consume to resolve the assigned worker chip). */
export const b2bWorkerSchema = z.object({
  id: z.string(),
  name: z.string(),
  colorHex: z.string().optional(),
  role: z.string().optional(),
  available: z.boolean().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  token: z.string().optional(),
});
export const b2bWorkersSchema = z.array(b2bWorkerSchema);
export type B2bWorker = z.infer<typeof b2bWorkerSchema>;

/** File descriptor produced by PieceSlot. */
export const pieceFileSchema = z.object({ name: z.string() });

/** Upload-facture form values (b2bUploadSchema in the spec). */
export const b2bUploadSchema = z.object({
  montant: z.coerce.number().min(1, 'Montant requis'),
  occRef: z.string().min(1, 'Référence requise'),
});
export type B2bUploadValues = z.infer<typeof b2bUploadSchema>;
