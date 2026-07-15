import { z } from 'zod';

export const proSignupSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  entreprise: z.string().min(1),
  rc: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  desiredAccounts: z.enum(['3', '4', '5', '6+']),
});
export type ProSignupValues = z.infer<typeof proSignupSchema>;

export const clientSignupSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  entreprise: z.string().min(1),
  rc: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});
export type ClientSignupValues = z.infer<typeof clientSignupSchema>;
