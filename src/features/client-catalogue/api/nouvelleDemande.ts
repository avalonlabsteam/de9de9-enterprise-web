import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { useAccesB2b } from '@/features/auth/api/accueil';
import { categorieDetailSchema, nouvelleDemandeSchema } from '../schemas/nouvelleDemande';
import { nouvelleDemandeKey } from './keys';

/** The catalogue changes when de9de9 edits it, not while a client browses. */
const CATALOGUE_STALE_MS = 5 * 60_000;

export { nouvelleDemandeKey };

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
 * de9de9 suspended the company's B2B access (guide 21 §13): no new demande,
 * running contracts go on. Said by the home's flag or by this screen's own
 * answer, which also words it (`blocage`).
 */
export function useBlocageB2b(): { bloque: boolean; message: string | null } {
  const acces = useAccesB2b();
  const entreprise = useNouvelleDemande().data?.entreprise;
  return { bloque: !acces || entreprise?.accesB2b === false, message: entreprise?.blocage ?? null };
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
