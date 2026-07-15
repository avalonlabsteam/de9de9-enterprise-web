import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/apiClient';

const kycSchema = z.object({ validated: z.boolean() });

async function fetchKyc(key: string): Promise<boolean> {
  const res = await apiClient.get(`/kyc/${key}`);
  return kycSchema.parse(res.data).validated;
}

export function useKyc(key: 'client' | 'prestataire') {
  return useQuery({ queryKey: ['kyc', key], queryFn: () => fetchKyc(key) });
}
