import { z } from 'zod';
import { normalizePhone } from '../lib/phone';

/**
 * Every message below is a key, not text: SignupField renders it in French or
 * Arabic, so an error follows the language toggle. Keys never leave the app.
 */
export type SignupErrorKey =
  | 'lastName.required'
  | 'firstName.required'
  | 'companyName.required'
  | 'rc.required'
  | 'rc.digits'
  | 'email.required'
  | 'email.invalid'
  | 'password.rules'
  | 'telephone.invalid'
  | 'telephone.mobile'
  | 'companyPhone.invalid'
  | 'proCount.integer'
  | 'proCount.range'
  | 'max.64'
  | 'max.100'
  | 'max.200'
  | 'max.256';

/** Typo guard: a zod message must be a key SignupField can translate. */
const msg = (key: SignupErrorKey) => key;

/**
 * `POST /auth/register` serves both sign-up screens. Field names mirror the API
 * so a `field` in a 400 problem maps straight onto the form, and the rules
 * mirror the server's so the common mistakes are caught before the round-trip.
 * The only difference between the screens is `proCount`: sent by « Créer une
 * entreprise », omitted by « Créer un compte client » — it decides which side
 * the first session opens on, no role is ever sent.
 */
const registerBaseSchema = z.object({
  lastName: z.string().trim().min(1, msg('lastName.required')).max(100, msg('max.100')),
  firstName: z.string().trim().min(1, msg('firstName.required')).max(100, msg('max.100')),
  companyName: z
    .string()
    .trim()
    .min(1, msg('companyName.required'))
    .max(200, msg('max.200')),
  rc: z
    .string()
    .trim()
    .min(1, msg('rc.required'))
    .max(64, msg('max.64'))
    .regex(/\d/, msg('rc.digits')),
  email: z
    .string()
    .trim()
    .min(1, msg('email.required'))
    .email(msg('email.invalid'))
    .max(256, msg('max.256')),
  password: z
    .string()
    .min(8, msg('password.rules'))
    .regex(/\d/, msg('password.rules'))
    .regex(/[a-z]/, msg('password.rules'))
    .regex(/[A-Z]/, msg('password.rules')),
});

/** Optional: a mobile (05/06/07 + 8 digits) or a landline (0 + 8 digits). */
const telephoneField = z
  .string()
  .trim()
  .refine((v) => v === '' || normalizePhone(v) !== null, msg('telephone.invalid'));

export const clientRegisterSchema = registerBaseSchema.extend({ telephone: telephoneField });
export type ClientRegisterValues = z.infer<typeof clientRegisterSchema>;

/**
 * Kept as text so the input stays controlled while it is being typed; the API
 * takes a number, so the page converts it on submit.
 */
export const proRegisterSchema = registerBaseSchema.extend({
  proCount: z
    .string()
    .trim()
    .regex(/^\d+$/, msg('proCount.integer'))
    .refine((v) => Number(v) >= 1 && Number(v) <= 10_000, msg('proCount.range')),
});
export type ProRegisterValues = z.infer<typeof proRegisterSchema>;

/** Body of `POST /auth/register` — `role` is never sent. */
export interface RegisterPayload {
  lastName: string;
  firstName: string;
  companyName: string;
  rc: string;
  email: string;
  password: string;
  telephone?: string;
  proCount?: number;
}
