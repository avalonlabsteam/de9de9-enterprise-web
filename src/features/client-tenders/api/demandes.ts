import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { demandesPageSchema, type Vue } from '../schemas/demandes';

const PAGE_SIZE = 20;

/**
 * Invalidate this after any action on a demand: the card moves, and the tab
 * counts change with it.
 */
export const demandesQueryKey = ['client', 'demandes'] as const;

/** « Mes demandes » for one tab, page by page (« Voir plus » loads the next). */
export function useClientDemandes(vue: Vue) {
  return useInfiniteQuery({
    queryKey: [...demandesQueryKey, vue],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.get('/client/demandes', {
        params: { vue, page: pageParam, pageSize: PAGE_SIZE },
      });
      return demandesPageSchema.parse(res.data);
    },
    getNextPageParam: (last) => (last.meta.has_more_pages ? last.meta.current_page + 1 : undefined),
  });
}
