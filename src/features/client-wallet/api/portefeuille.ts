import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { apiUrl } from '@/api/hostUrl';
import {
  mouvementDetailSchema,
  mouvementsPageSchema,
  portefeuilleSchema,
  type MouvementRow,
  type Portefeuille,
} from '../schemas/portefeuille';

/**
 * Invalidate after anything that moves money (an invoice approved or
 * contested): the card and the rows change. Never polled.
 */
export const portefeuilleKey = ['client', 'portefeuille'] as const;

export interface PortefeuillePage {
  /** The whole screen — page 1 only. */
  screen: Portefeuille | null;
  items: MouvementRow[];
  nextCursor: string | null;
}

/**
 * One page of the list: `null` → the whole screen (card + first rows),
 * a cursor → the next rows, from where the previous page stopped.
 */
export async function fetchPortefeuillePage(cursor: string | null): Promise<PortefeuillePage> {
  if (cursor === null) {
    const screen = portefeuilleSchema.parse((await apiClient.get('/client/portefeuille')).data);
    return { screen, items: screen.mouvements.items, nextCursor: screen.mouvements.nextCursor ?? null };
  }
  const page = mouvementsPageSchema.parse(
    (await apiClient.get('/client/portefeuille/mouvements', { params: { cursor } })).data,
  );
  return { screen: null, items: page.items, nextCursor: page.nextCursor ?? null };
}

/**
 * « Portefeuille » and its « Mouvements », as one list. Page 1 is
 * `GET /client/portefeuille` (the card and the first 20 rows); the next pages
 * follow `nextCursor` on `/client/portefeuille/mouvements`. The cursor is a
 * position, not an offset: a new movement meanwhile never repeats or skips a row.
 */
export function usePortefeuille() {
  return useInfiniteQuery({
    queryKey: portefeuilleKey,
    initialPageParam: null as string | null,
    // Reloaded only on purpose (refresh, an invoice action): coming back from
    // a movement's detail keeps the list — and its scroll — as it was.
    staleTime: Infinity,
    queryFn: ({ pageParam }) => fetchPortefeuillePage(pageParam),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** « Détail du mouvement ». */
export function useMouvement(id: string | undefined) {
  return useQuery({
    queryKey: [...portefeuilleKey, 'mouvement', id ?? ''],
    enabled: !!id,
    queryFn: async () =>
      mouvementDetailSchema.parse(
        (await apiClient.get(`/client/portefeuille/mouvements/${encodeURIComponent(id ?? '')}`)).data,
      ),
  });
}

/** A piece's bytes, fetched with the token (none of these files is public). */
export async function fetchFile(href: string): Promise<Blob> {
  const res = await apiClient.get(apiUrl(href), { responseType: 'blob' });
  return res.data as Blob;
}
