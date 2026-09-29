import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { categorieDetailSchema, nouvelleDemandeSchema } from '../schemas/nouvelleDemande';

/** The catalogue changes when de9de9 edits it, not while a client browses. */
const CATALOGUE_STALE_MS = 5 * 60_000;

const nouvelleDemandeKey = ['client', 'nouvelle-demande'] as const;

/** Screen 1: the grid, « Top catégories du mois », and screen 3's pickers. */
export function useNouvelleDemande() {
  return useQuery({
    queryKey: nouvelleDemandeKey,
    staleTime: CATALOGUE_STALE_MS,
    queryFn: async () =>
      nouvelleDemandeSchema.parse((await apiClient.get('/client/nouvelle-demande')).data),
  });
}

/**
 * « Rechercher un service… ». The API ignores accents and case, so the query is
 * sent as typed. The previous hits stay on screen while the next ones load.
 */
export function useCatalogueSearch(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: [...nouvelleDemandeKey, 'q', term],
    enabled: term.length > 0,
    staleTime: CATALOGUE_STALE_MS,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      nouvelleDemandeSchema.parse(
        (await apiClient.get('/client/nouvelle-demande', { params: { q: term } })).data,
      ).recherche,
  });
}

/** Screen 2: the services of one category, to tick. */
export function useCategorie(code: string | undefined) {
  return useQuery({
    queryKey: ['catalogue', code],
    enabled: !!code,
    staleTime: CATALOGUE_STALE_MS,
    queryFn: async () =>
      categorieDetailSchema.parse((await apiClient.get(`/catalogue/${encodeURIComponent(code ?? '')}`)).data),
  });
}
