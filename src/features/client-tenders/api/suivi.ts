import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { demandeSuiviSchema } from '../schemas/suivi';

export const suiviQueryKey = (id: string) => ['client', 'demande', id] as const;

/**
 * « Suivi d'une demande » in one call — the demande, and the commande it became
 * once contracted. `{id}` is the « Mes demandes » card's `id`.
 */
export function useDemandeSuivi(id: string | undefined) {
  return useQuery({
    queryKey: suiviQueryKey(id ?? ''),
    enabled: !!id,
    queryFn: async () =>
      demandeSuiviSchema.parse((await apiClient.get(`/client/demandes/${encodeURIComponent(id ?? '')}`)).data),
  });
}
