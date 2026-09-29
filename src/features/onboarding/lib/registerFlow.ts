import { toProblem } from '@/api/problem';
import type { OnboardingStep, SessionResponse } from '@/features/auth/schemas/auth';
import type { Role } from '@/stores/authStore';

const HOME: Record<Role, string> = { client: '/client', prestataire: '/prestataire' };
const KYC: Record<Role, string> = { client: '/client/kyc', prestataire: '/onboarding/kyc' };
const KYC_REVIEW: Record<Role, string> = {
  client: '/client/kyc/success',
  prestataire: '/onboarding/kyc/success',
};

/** The screen each onboarding step belongs to, per side. */
export function routeForStep(step: OnboardingStep | undefined, role: Role): string {
  switch (step) {
    case 'termine':
      return HOME[role];
    case 'kyc_en_revue':
      return KYC_REVIEW[role];
    case 'telephone':
      return '/onboarding/telephone';
    case 'kyc':
    default:
      return KYC[role];
  }
}

/**
 * `onboarding.nextStep` is the only field to route on. `activeRole` picks the
 * shell: a company holds both roles, and `proCount` on the sign-up decided
 * which side this first session opens on.
 */
export function routeAfterRegister(session: SessionResponse): string {
  return routeForStep(session.onboarding.nextStep, session.user.activeRole);
}

/** Form fields a 400 problem can blame; anything else is shown as a toast. */
const FORM_FIELDS = [
  'lastName',
  'firstName',
  'companyName',
  'rc',
  'email',
  'telephone',
  'password',
  'proCount',
] as const;
export type RegisterField = (typeof FORM_FIELDS)[number];

export type RegisterFailure =
  /** Show `message` under that input. */
  | { kind: 'field'; field: RegisterField; message: string }
  /** The e-mail already has an account — offer the login screen. */
  | { kind: 'emailTaken'; message: string }
  | { kind: 'rateLimited' }
  | { kind: 'generic'; message?: string };

/** Turn a failed register call into what the screen should show. */
export function describeRegisterError(error: unknown): RegisterFailure {
  const problem = toProblem(error);
  if (problem.code === 'email_taken') {
    return {
      kind: 'emailTaken',
      message: problem.detail ?? 'Un compte existe déjà avec cette adresse e-mail.',
    };
  }
  if (problem.code === 'too_many_requests' || problem.status === 429) {
    return { kind: 'rateLimited' };
  }
  const field = FORM_FIELDS.find((f) => f === problem.field);
  if (field && problem.detail) return { kind: 'field', field, message: problem.detail };
  return { kind: 'generic', message: problem.detail };
}
