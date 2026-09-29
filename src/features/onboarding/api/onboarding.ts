import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { sessionResponseSchema } from '@/features/auth/schemas/auth';
import type { RegisterPayload } from '../schemas/onboarding';

/**
 * One anonymous call behind both sign-up screens. The company is always created
 * with both roles; sending `proCount` is what opens the first session on the
 * prestataire side. The answer already carries the session, so no login call
 * follows.
 */
export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const res = await apiClient.post('/auth/register', payload);
      return sessionResponseSchema.parse(res.data);
    },
  });
}
