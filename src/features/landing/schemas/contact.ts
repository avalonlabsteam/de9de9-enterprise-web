import { z } from 'zod';

export const contactSchema = z.object({
  nom: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  objet: z.string().min(2),
  message: z.string().min(10),
});
export type ContactValues = z.infer<typeof contactSchema>;

export const contactResponseSchema = z.object({ received: z.boolean() });
