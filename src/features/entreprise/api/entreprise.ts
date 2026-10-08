import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { refreshAccueil } from '@/features/auth/api/accueil';
import { entrepriseSchema, moiSchema, type EntrepriseBody } from '../schemas/entreprise';

/** Read again when de9de9 edits the profile for the company (the `entreprise.profil_modifie` alert). */
export const entrepriseKey = ['entreprise'] as const;

const path = (companyId: string) => `/companies/${encodeURIComponent(companyId)}`;

/** The session's own company; another company's id answers 404. */
export function useEntreprise(enabled: boolean) {
  const companyId = useAuthStore((s) => s.user?.companyId);
  return useQuery({
    queryKey: [...entrepriseKey, companyId ?? ''],
    enabled: enabled && !!companyId,
    queryFn: async () => entrepriseSchema.parse((await apiClient.get(path(companyId ?? ''))).data),
  });
}

/**
 * Whether this seat may edit the company: an admin seat, on either side. A
 * staff seat reads it (the API answers 403 to its `PUT`). Unknown while the
 * role is not read, or when it could not be: the form is then offered and the
 * API decides.
 */
export function useLectureSeule(enabled: boolean): boolean {
  const userId = useAuthStore((s) => s.user?.id);
  const role = useQuery({
    queryKey: ['auth', 'me', userId ?? ''],
    enabled,
    staleTime: 10 * 60_000,
    queryFn: async () => moiSchema.parse((await apiClient.get('/auth/me')).data).role ?? null,
  }).data;
  return !!role && /staff$/i.test(role);
}

/** « Enregistrer » — the whole profile replaces the stored one. */
export function useEnregistrerEntreprise() {
  const companyId = useAuthStore((s) => s.user?.companyId);
  return useMutation({
    mutationFn: async (body: EntrepriseBody) =>
      entrepriseSchema.parse((await apiClient.put(path(companyId ?? ''), body)).data),
    onSuccess: (entreprise) => {
      queryClient.setQueryData([...entrepriseKey, companyId ?? ''], entreprise);
      // The company's name heads the topbar and the home: both read the sign-in's home.
      void refreshAccueil();
    },
  });
}
