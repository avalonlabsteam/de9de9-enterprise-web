import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { signInResponseSchema, type LoginValues } from '../schemas/auth';

export type LoginCredentials = Pick<LoginValues, 'email' | 'password'>;

/**
 * Password sign-in. No role is sent: the API opens the session on the user's
 * last active role (the side of their most recent session, any device). The
 * answer carries the session, where onboarding stands and the home of that
 * side (`accueil`), so nothing else is fetched to render the first screen.
 */
export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      const res = await apiClient.post('/auth/login', { email, password });
      return signInResponseSchema.parse(res.data);
    },
  });
}
