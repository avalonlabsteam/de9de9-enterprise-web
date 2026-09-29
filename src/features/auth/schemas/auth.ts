import { z } from 'zod';
import { accueilEnvelopeSchema } from './accueil';

/** Login form values (mock accepts any credentials). */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
});
export type LoginValues = z.infer<typeof loginSchema>;

/** Shape returned by the legacy mock login endpoint. */
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

// --------------------------------------------------------------- session API
// `POST /auth/register` and the Google / Apple sign-ups all answer with the
// body below, so one parser serves the three of them. Only the fields the app
// routes on are required — the rest stay optional so a backend addition or an
// omitted block never fails the parse and locks the user out of sign-up.

/** The screen to open after sign-up; also returned by `GET /auth/onboarding`. */
export const onboardingStepSchema = z.enum(['telephone', 'kyc', 'kyc_en_revue', 'termine']);
export type OnboardingStep = z.infer<typeof onboardingStepSchema>;

export const kycPieceSchema = z.object({
  kind: z.string(),
  label: z.string(),
  present: z.boolean(),
  fileName: z.string().nullish(),
});
export type KycPiece = z.infer<typeof kycPieceSchema>;

export const onboardingStateSchema = z.object({
  nextStep: onboardingStepSchema,
  needsPhone: z.boolean().optional(),
  telephone: z.string().nullish(),
  telephoneEntreprise: z.string().nullish(),
  companyId: z.string().optional(),
  companyType: z.string().optional(),
  kycStatut: z.string().optional(),
  kycStatutLabel: z.string().optional(),
  kycMotif: z.string().nullish(),
  kycSoumisLe: z.string().nullish(),
  pieces: z.array(kycPieceSchema).default([]),
});
export type OnboardingState = z.infer<typeof onboardingStateSchema>;

export const sessionUserSchema = z.object({
  userId: z.string(),
  email: z.string().optional(),
  /** Identity role (`PrestataireAdmin`…) — the app routes on `activeRole`. */
  role: z.string().optional(),
  companyId: z.string().optional(),
  companyType: z.string().optional(),
  /** Which side this session opens on. Every company holds both roles. */
  activeRole: z.enum(['client', 'prestataire']),
  availableRoles: z.array(z.string()).default([]),
  language: z.string().optional(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

/** Tokens + who is signed in: the core every auth answer carries. */
export const sessionCoreSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: z.string().optional(),
  refreshToken: z.string().optional(),
  refreshTokenExpiresAt: z.string().optional(),
  user: sessionUserSchema,
  isNewAccount: z.boolean().optional(),
  linkedToExistingAccount: z.boolean().optional(),
});
export type SessionCore = z.infer<typeof sessionCoreSchema>;

/**
 * A sign-in answer (`/auth/login`, `/auth/google`, `/auth/apple`): the session
 * plus the home of the side it opens on, already built. The app renders that
 * payload — there is no home route to call.
 */
export const signInResponseSchema = sessionCoreSchema.extend({
  accueil: accueilEnvelopeSchema.nullish(),
  /** Where onboarding stands — the phone step, then KYC. */
  onboarding: onboardingStateSchema.nullish(),
});
export type SignInResponse = z.infer<typeof signInResponseSchema>;

/** A sign-up answer: a sign-in, plus where onboarding stands. */
export const sessionResponseSchema = signInResponseSchema.extend({
  onboarding: onboardingStateSchema,
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

/**
 * `POST /auth/switch-role` — no body, bearer only. Flips the session to the
 * other side of a company that holds both roles, and answers with the login
 * shape: the new access token, `user.activeRole` on the new side, and that
 * side's home. A null `refreshToken` means: keep yours.
 */
export const switchRoleResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().nullish(),
  user: sessionUserSchema.optional(),
  accueil: accueilEnvelopeSchema,
});
export type SwitchRoleResponse = z.infer<typeof switchRoleResponseSchema>;

/**
 * `POST /auth/validate-token` — the app-start check. Unlike every other call the
 * tokens travel in the JSON body (it must also work with an expired access
 * token). `refreshToken: null` means both stored tokens are still good; a
 * `refreshToken` means the pair was renewed and must replace the stored one.
 * A 401 carries `needsRelogin: true`: back to the login screen.
 */
export const validateTokenSchema = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().nullish(),
  user: sessionUserSchema.optional(),
  accueil: accueilEnvelopeSchema.nullish(),
  onboarding: onboardingStateSchema.nullish(),
});
export type ValidateTokenResponse = z.infer<typeof validateTokenSchema>;

/** `POST /auth/refresh` — trades the refresh token for a new access token. */
export const refreshSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: z.string().optional(),
  refreshToken: z.string().nullish(),
  refreshTokenExpiresAt: z.string().optional(),
});
export type RefreshResponse = z.infer<typeof refreshSchema>;
