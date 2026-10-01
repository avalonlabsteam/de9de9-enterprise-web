import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { accueilActions, useAccueilStore } from '@/stores/accueilStore';
import { sessionEpoch } from '@/stores/sessionEpoch';
import { accueilSchema, type Accueil } from '@/features/auth/schemas/accueil';
import { statsSchema } from '../schemas/dashboard';

export const accueilKey = ['prestataire', 'accueil'] as const;

/**
 * The prestataire home, refreshed (`GET /prestataire/accueil`): its `b2c`
 * state gates « B2C · Particuliers » and its `annonces` are « Mes annonces »
 * (guide 16). The sign-in's copy shows until the fresh one answers — and stays
 * if it cannot: the store is the one source both read.
 */
export function usePrestataireAccueil(): Accueil | null {
  useQuery({
    queryKey: accueilKey,
    staleTime: 60_000,
    queryFn: async () => {
      const epoch = sessionEpoch();
      const home = accueilSchema.parse((await apiClient.get('/prestataire/accueil')).data);
      // A sign-in or a switch meanwhile brought a fresher home of its own.
      if (sessionEpoch() === epoch) accueilActions.setPrestataire(home);
      return home;
    },
  });
  return useAccueilStore((s) => (s.accueil?.role === 'prestataire' ? (s.accueil.prestataire ?? null) : null));
}

export function useStats() {
  return useQuery({
    queryKey: ['prestataire', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/prestataire/stats');
      return statsSchema.parse(res.data);
    },
  });
}
