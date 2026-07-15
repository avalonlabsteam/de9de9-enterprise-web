import { z } from 'zod';

export const recruterSchema = z.object({
  categorie: z.string().min(1),
  sousCategorie: z.string().min(1),
  zone: z.string().optional(),
  nombre: z.string().optional(),
  note: z.string().optional(),
});
export type RecruterInput = z.infer<typeof recruterSchema>;

export const handicapSchema = z.object({
  contact: z.string().min(1),
  poste: z.string().min(1),
  zone: z.string().min(1),
  nombre: z.string().optional(),
  email: z.string().optional(),
  commentaire: z.string().optional(),
});
export type HandicapInput = z.infer<typeof handicapSchema>;
