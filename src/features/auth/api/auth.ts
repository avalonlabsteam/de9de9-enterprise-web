import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import type { Role } from '@/stores/authStore';
import { authResponseSchema } from '../schemas/auth';

/**
 * Authenticate against the mock backend. The role is chosen on the `/role`
 * screen and echoed back by the handler, so the session lands on the right shell.
 */
export function useLogin() {
  return useMutation({
    mutationFn: async (role: Role) => {
      const res = await apiClient.post('/auth/login', { role });
      return authResponseSchema.parse(res.data);
    },
  });
}
