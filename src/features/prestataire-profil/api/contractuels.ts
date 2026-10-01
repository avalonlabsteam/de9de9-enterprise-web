import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import {
  demandeProsSchema,
  optionsSchema,
  suiviDemandesSchema,
  type DemandeProsInput,
} from '../schemas/contractuels';

const BASE = '/prestataire/contractuels';

const optionsKey = ['prestataire', 'contractuels', 'options'] as const;
const demandesKey = ['prestataire', 'contractuels', 'demandes'] as const;

/** The de9de9 app's catalogue moves rarely: one read serves the session. */
const OPTIONS_STALE_MS = 60 * 60_000;

/**
 * Catégorie → sous-catégorie and the wilayas, read live from the de9de9 app
 * database. When it does not answer the route says 503 `legacy_unavailable`:
 * the screen prints that and offers to try again — there is no built-in list.
 */
export function useOptionsPros() {
  return useQuery({
    queryKey: optionsKey,
    staleTime: OPTIONS_STALE_MS,
    retry: false,
    queryFn: async () => optionsSchema.parse((await apiClient.get(`${BASE}/options`)).data),
  });
}

/** The company's demandes, each with the pros placed on it. */
export function useDemandesPros(enabled: boolean) {
  return useQuery({
    queryKey: demandesKey,
    enabled,
    queryFn: async () => suiviDemandesSchema.parse((await apiClient.get(`${BASE}/demandes`)).data),
  });
}

/** « Envoyer la demande ». */
export function useEnvoyerDemandePros() {
  return useMutation({
    mutationFn: async (input: DemandeProsInput) =>
      demandeProsSchema.parse((await apiClient.post(`${BASE}/demandes`, input)).data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: demandesKey }),
  });
}

/** « Annuler la demande » — only while nobody is placed on it. */
export function useAnnulerDemandePros() {
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await apiClient.post(`${BASE}/demandes/${encodeURIComponent(id)}/cancel`, reason ? { reason } : {});
    },
    // Done, or refused because the demande moved meanwhile: either way the list is read again.
    onSettled: () => void queryClient.invalidateQueries({ queryKey: demandesKey }),
  });
}
