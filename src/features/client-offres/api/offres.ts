import axios from 'axios';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/apiClient';
import { isRouteAbsente } from '@/api/problem';
import { offreCarteSchema, offreSchema, offresListeSchema, type OffreCarte } from '../schemas/offres';

/** « Offres des prestataires » — client-side routes, token-scoped: no company id anywhere. */

const BASE = '/client/annonces';

export const offresKey = ['client', 'offres'] as const;

/** An answer the API gave is final: only a call that never landed is tried again. */
const retry = (count: number, error: unknown): boolean =>
  !(axios.isAxiosError(error) && error.response) && !(error instanceof z.ZodError) && count < 1;

export interface OffresFiltre {
  categorie: string;
  /** A service chip · null = every service of the category. */
  sousCategorie: string | null;
  /** A wilaya chip (its official number) · null = everywhere. */
  wilaya: number | null;
}

/**
 * The offers are a design the API may not serve yet. Once it said so, the
 * section stops asking for the rest of the session: no 404 per category opened.
 */
let absente = false;

async function fetchOffres({ categorie, sousCategorie, wilaya }: OffresFiltre, page: number) {
  const res = await apiClient
    .get(BASE, {
      params: { categorie, ...(sousCategorie ? { sousCategorie } : {}), ...(wilaya !== null ? { wilaya } : {}), page },
    })
    .catch((error: unknown) => {
      if (isRouteAbsente(error)) absente = true;
      throw error;
    });
  const data = offresListeSchema.parse(res.data);
  const offres: OffreCarte[] = [];
  for (const row of data.offres) {
    const parsed = offreCarteSchema.safeParse(row);
    if (parsed.success) offres.push(parsed.data);
    else if (import.meta.env.DEV) console.error('[offres] unreadable card', parsed.error.issues);
  }
  return { ...data, offres };
}

/** The published offers of one category, with the chips that narrow them. */
export function useOffres(filtre: OffresFiltre) {
  return useInfiniteQuery({
    queryKey: [...offresKey, filtre.categorie, filtre.sousCategorie ?? '', filtre.wilaya ?? 0],
    enabled: !absente,
    initialPageParam: 1,
    // Another chip: the cards on screen stay (dimmed) until the next ones arrive.
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) => fetchOffres(filtre, pageParam),
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    retry,
  });
}

/** One offer. A 404 means it is no longer visible to this client: paused, suspended, delisted… */
export function useOffre(id: string | undefined) {
  return useQuery({
    queryKey: [...offresKey, 'une', id ?? ''],
    enabled: !!id,
    queryFn: async () => offreSchema.parse((await apiClient.get(`${BASE}/${encodeURIComponent(id ?? '')}`)).data),
    retry,
  });
}
