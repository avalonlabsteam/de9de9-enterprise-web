import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { factureEcranSchema, facturesPageSchema, type FactureOnglet } from '../schemas/facture';

const PAGE_SIZE = 20;

/**
 * Invalidate this after an approval or a contest: the card changes, the tab
 * counts with it, and the invoice's own screen (its key starts the same).
 */
export const facturesKey = ['client', 'factures'] as const;

/** « Factures » for one tab, page by page (« Voir plus » loads the next). */
export function useFactures(statut: FactureOnglet) {
  return useInfiniteQuery({
    queryKey: [...facturesKey, 'liste', statut],
    initialPageParam: 1,
    // Another tab: the cards on screen stay (dimmed) until the next ones arrive, and the counts with them.
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.get('/client/factures', {
        params: { statut, page: pageParam, pageSize: PAGE_SIZE },
      });
      return facturesPageSchema.parse(res.data);
    },
    getNextPageParam: (last) => (last.meta.has_more_pages ? last.meta.current_page + 1 : undefined),
  });
}

/** One invoice's screen — what a card, a wallet line or an alert opens. */
export function useFactureEcran(id: string) {
  return useQuery({
    queryKey: [...facturesKey, 'une', id],
    queryFn: async () =>
      factureEcranSchema.parse((await apiClient.get(`/client/factures/${encodeURIComponent(id)}`)).data),
  });
}
