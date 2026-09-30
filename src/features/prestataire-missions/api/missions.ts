import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { apiUrl } from '@/api/hostUrl';
import { missionDetailSchema, missionsPageSchema, pickerSchema } from '../schemas/missions';

export const missionsKey = ['prestataire', 'missions'] as const;

/** The detail, focused on `occurrence` — or on the current occurrence when there is none. */
export const missionKey = (id: string, occurrence?: string | null) =>
  ['prestataire', 'mission', id, occurrence ?? ''] as const;

const PAGE_SIZE = 20;

/**
 * « B2B · Entreprises » — `GET /prestataire/missions?onglet&page&pageSize`, one
 * page after the other (the order is stable across pages). The previous tab
 * stays on screen while the next one loads.
 */
export function useMissions(onglet: string) {
  return useInfiniteQuery({
    queryKey: [...missionsKey, onglet],
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      missionsPageSchema.parse(
        (await apiClient.get('/prestataire/missions', { params: { onglet, page: pageParam, pageSize: PAGE_SIZE } }))
          .data,
      ),
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  });
}

/**
 * « Détail de la mission » — `GET /prestataire/missions/{id}[?occurrence={visitId}]`.
 * Refocusing on another occurrence keeps the current one on screen (dimmed)
 * until the next one arrives.
 */
export function useMission(id: string | undefined, occurrence: string | null) {
  return useQuery({
    queryKey: missionKey(id ?? '', occurrence),
    enabled: !!id,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      missionDetailSchema.parse(
        (
          await apiClient.get(`/prestataire/missions/${encodeURIComponent(id ?? '')}`, {
            params: occurrence ? { occurrence } : undefined,
          })
        ).data,
      ),
  });
}

/** « Affecter un ou plusieurs ouvriers » — the `href` of `affecter_ouvrier` / `changer_ouvrier`. */
export async function fetchPicker(href: string) {
  return pickerSchema.parse((await apiClient.get(apiUrl(href))).data);
}
