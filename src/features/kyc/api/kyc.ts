import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import { kycStatusSchema } from '../schemas/kyc';

/** `key` is `client` or `pres:<id>`. */
export function useKyc(key: string) {
  return useQuery({
    queryKey: ['kyc', key],
    queryFn: async () => {
      const res = await apiClient.get(`/kyc/${key}`);
      return kycStatusSchema.parse(res.data);
    },
  });
}

export function useSubmitKyc(key: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/kyc/${key}`, {});
      return kycStatusSchema.parse(res.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kyc', key] });
    },
  });
}
