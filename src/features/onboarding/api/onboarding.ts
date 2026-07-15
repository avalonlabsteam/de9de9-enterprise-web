import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { authResponseSchema } from '@/features/auth/schemas/auth';
import type { ProSignupValues, ClientSignupValues } from '../schemas/onboarding';

export function useProSignup() {
  return useMutation({
    mutationFn: async (values: ProSignupValues) => {
      const res = await apiClient.post('/auth/signup/pro', values);
      return authResponseSchema.parse(res.data);
    },
  });
}

export function useClientSignup() {
  return useMutation({
    mutationFn: async (values: ClientSignupValues) => {
      const res = await apiClient.post('/auth/signup/client', values);
      return authResponseSchema.parse(res.data);
    },
  });
}
