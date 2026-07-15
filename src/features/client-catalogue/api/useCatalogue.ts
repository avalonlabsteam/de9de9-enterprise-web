import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { familiesSchema, familySchema, kycStatusSchema } from '../schemas/catalogue';
import type { Family, KycStatus } from '../schemas/catalogue';

/** The 16 service families (GET /catalogue). */
export function useFamilies() {
  return useQuery<Family[]>({
    queryKey: ['catalogue'],
    queryFn: async () => {
      const { data } = await apiClient.get('/catalogue');
      return familiesSchema.parse(data);
    },
    staleTime: Infinity,
  });
}

/** A single family by id (GET /catalogue/:id). */
export function useFamily(id: string | undefined) {
  return useQuery<Family>({
    queryKey: ['catalogue', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await apiClient.get(`/catalogue/${id}`);
      return familySchema.parse(data);
    },
    staleTime: Infinity,
  });
}

/** KYC verification status for a role key (GET /kyc/:key). */
export function useKyc(key: 'client' | 'prestataire') {
  return useQuery<KycStatus>({
    queryKey: ['kyc', key],
    queryFn: async () => {
      const { data } = await apiClient.get(`/kyc/${key}`);
      return kycStatusSchema.parse(data);
    },
  });
}
