import { z } from 'zod';

export const factureSchema = z.object({
  id: z.string(),
  tenderId: z.string(),
  label: z.string(),
  amountDzd: z.number(),
  issuedAt: z.string(),
  occurrenceLabel: z.string().optional(),
  status: z.enum(['waiting', 'approved', 'contested']),
});

export const facturesSchema = factureSchema.array();

export type Facture = z.infer<typeof factureSchema>;
export type FactureStatus = Facture['status'];
