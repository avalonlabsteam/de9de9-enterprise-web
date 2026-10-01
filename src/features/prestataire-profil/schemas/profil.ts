import { z } from 'zod';

export const handicapSchema = z.object({
  contact: z.string().min(1),
  poste: z.string().min(1),
  zone: z.string().min(1),
  nombre: z.string().optional(),
  email: z.string().optional(),
  commentaire: z.string().optional(),
});
export type HandicapInput = z.infer<typeof handicapSchema>;
