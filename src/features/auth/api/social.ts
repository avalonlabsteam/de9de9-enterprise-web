import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { signInResponseSchema } from '../schemas/auth';

export type SocialProvider = 'google' | 'apple';

export interface SocialSignInPayload {
  provider: SocialProvider;
  /** The provider's identity token, verified by the API. */
  idToken: string;
  /** Apple also returns an authorization code. */
  code?: string;
}

/**
 * `POST /auth/google` · `POST /auth/apple`. The answer is the same sign-in body
 * as a password login — session, home and onboarding — so the caller adopts it
 * exactly the same way.
 *
 * An e-mail that already has a password account answers 409 `email_in_use`:
 * that account is not taken over, the user signs in with its password.
 */
export function useSocialSignIn() {
  return useMutation({
    mutationFn: async ({ provider, idToken, code }: SocialSignInPayload) => {
      const res = await apiClient.post(`/auth/${provider}`, {
        idToken,
        ...(code ? { code } : {}),
      });
      return signInResponseSchema.parse(res.data);
    },
  });
}
