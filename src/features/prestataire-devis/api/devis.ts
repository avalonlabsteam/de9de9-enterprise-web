import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { demandeDevisSchema, demandesPageSchema } from '../schemas/devis';

export const demandesDevisKey = ['prestataire', 'demandes-devis'] as const;
export const demandeDevisKey = (id: string) => ['prestataire', 'demande-devis', id] as const;

const PAGE_SIZE = 20;

/** « Demandes de devis » — `GET /prestataire/demandes-devis?onglet&page&pageSize`, page after page. */
export function useDemandesDevis(onglet: string) {
  return useInfiniteQuery({
    queryKey: [...demandesDevisKey, onglet],
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      demandesPageSchema.parse(
        (
          await apiClient.get('/prestataire/demandes-devis', {
            params: { onglet, page: pageParam, pageSize: PAGE_SIZE },
          })
        ).data,
      ),
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  });
}

/** « Demande de devis » — `GET /prestataire/demandes-devis/{id}`. */
export function useDemandeDevis(id: string | undefined) {
  return useQuery({
    queryKey: demandeDevisKey(id ?? ''),
    enabled: !!id,
    queryFn: async () =>
      demandeDevisSchema.parse(
        (await apiClient.get(`/prestataire/demandes-devis/${encodeURIComponent(id ?? '')}`)).data,
      ),
  });
}
