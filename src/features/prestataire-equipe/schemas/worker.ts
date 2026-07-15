import { z } from 'zod';

/** Mirrors the Worker row shape in api/mock/db.ts (do not import from db). */
export const workerSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  available: z.boolean(),
  colorHex: z.string(),
  status: z.enum(['active', 'pending', 'empty']).optional(),
  type: z.enum(['pro', 'salarie']).optional(),
  skills: z.array(z.string()).optional(),
  avail: z.string().optional(),
  hours: z.string().optional(),
  tarif: z.string().optional(),
  note: z.number().optional(),
  token: z.string().optional(),
  phone: z.string().optional(),
});

export const workersSchema = z.array(workerSchema);

export type Worker = z.infer<typeof workerSchema>;

/** Live-editable fields on the "Fiche — éditable" card. */
export const memberFieldSchema = z.object({
  role: z.string().optional(),
  hours: z.string().optional(),
  tarif: z.string().optional(),
  avail: z.string().optional(),
});
export type MemberFields = z.infer<typeof memberFieldSchema>;

export const agrandirSchema = z.object({
  societe: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  proActuels: z.string().min(1),
  proDesires: z.string().min(1),
});
export type AgrandirInput = z.infer<typeof agrandirSchema>;
