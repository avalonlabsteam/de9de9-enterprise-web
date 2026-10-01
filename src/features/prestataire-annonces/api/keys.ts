import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { isRouteAbsente } from '@/api/problem';

/**
 * The annonces' query keys — and the one question the home asks of them — on
 * their own, so that what only needs those (the alerts hub, the dashboard)
 * does not pull the annonces' code in.
 */

export const annoncesKey = ['prestataire', 'annonces'] as const;
export const annoncesListeKey = [...annoncesKey, 'liste'] as const;
export const annonceKey = (id: string) => [...annoncesKey, 'une', id] as const;
export const zonesB2cKey = [...annoncesKey, 'b2c', 'zones'] as const;

/**
 * Whether the company can write its annonces itself: the routes of guides 19
 * are a design, served or not depending on the API. Asked once per session;
 * `undefined` while unknown.
 */
export function useAnnoncesDisponibles(enabled: boolean): boolean | undefined {
  return useQuery({
    queryKey: [...annoncesKey, 'disponible'],
    enabled,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      try {
        await apiClient.get('/prestataire/annonces', { params: { page: 1, pageSize: 1 } });
        return true;
      } catch (error) {
        // Any other failure is the route answering: it exists.
        return !isRouteAbsente(error);
      }
    },
  }).data;
}
