import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { facturesSchema, type Facture } from '../schemas/facture';

async function fetchFactures(): Promise<Facture[]> {
  const res = await apiClient.get('/factures');
  return facturesSchema.parse(res.data);
}

export function useFactures() {
  return useQuery({ queryKey: ['factures'], queryFn: fetchFactures });
}
