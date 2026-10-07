import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import { mesDemandesSchema, type HandicapBody } from '../schemas/profil';

/** The company's own route. `/handicap` alone is the admin panel's: a company gets 403 there. */
const INSCRIPTION = '/handicap/inscription';

export const mesDemandesHandicapKey = ['handicap', 'mes-demandes'] as const;

/** « Envoyer la demande » — each call creates one request. */
export function useHandicapJoin() {
  return useMutation({
    mutationFn: async (body: HandicapBody) => {
      await apiClient.post(INSCRIPTION, body);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: mesDemandesHandicapKey }),
  });
}

/** « Mes demandes » — what the company sent, with who de9de9 placed on each. */
export function useMesDemandesHandicap(enabled: boolean) {
  return useQuery({
    queryKey: mesDemandesHandicapKey,
    enabled,
    queryFn: async () => mesDemandesSchema.parse((await apiClient.get(INSCRIPTION)).data),
  });
}
