import { z } from 'zod';

/** Login form values (mock accepts any credentials). */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
});
export type LoginValues = z.infer<typeof loginSchema>;

/** Shape returned by every auth endpoint (login / signup). */
export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['client', 'prestataire']),
});
export type AuthUserDto = z.infer<typeof authUserSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  user: authUserSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
