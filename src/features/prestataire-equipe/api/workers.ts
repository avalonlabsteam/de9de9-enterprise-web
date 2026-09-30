import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import {
  teamMemberSchema,
  teamPageSchema,
  workerProfileSchema,
  type AddMemberInput,
  type FicheBody,
  type TeamMember,
} from '../schemas/worker';

/**
 * The team's keys — the list and each profile apart, so refreshing the list
 * after a save does not refetch the profile the save just answered. Not
 * `['workers']`: the B2C screens still keep their own, differently shaped
 * worker list under that one.
 */
export const teamKey = ['equipe', 'liste'] as const;
export const workerKey = (id: string) => ['equipe', 'profil', id] as const;

/** The company these routes carry in their path — the session's. */
export const useCompanyId = () => useAuthStore((s) => s.user?.companyId);

const companyPath = (companyId: string | undefined) => `/companies/${encodeURIComponent(companyId ?? '')}/equipe`;

/** A team is small, but follow `nextCursor` in case it is not. */
const MAX_PAGES = 10;

/** « Mon effectif » — the active members, newest first. */
export function useTeam() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: [...teamKey, companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const items: TeamMember[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        const data = teamPageSchema.parse(
          (await apiClient.get(companyPath(companyId), { params: { pageSize: 100, ...(cursor ? { cursor } : {}) } })).data,
        );
        items.push(...data.items);
        cursor = data.nextCursor ?? undefined;
        if (!cursor) break;
      }
      return items;
    },
  });
}

/** The member's profile, with their missions — `GET /equipe/{id}/profil`. */
export function useWorker(id: string | undefined) {
  return useQuery({
    queryKey: workerKey(id ?? ''),
    enabled: !!id,
    queryFn: async () =>
      workerProfileSchema.parse((await apiClient.get(`/equipe/${encodeURIComponent(id ?? '')}/profil`)).data),
  });
}

/** Save the whole fiche — the PUT answers the full updated profile, straight into the cache. */
export function useUpdateFiche(id: string | undefined) {
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (body: FicheBody) =>
      workerProfileSchema.parse(
        (await apiClient.put(`${companyPath(companyId)}/${encodeURIComponent(id ?? '')}/fiche`, body)).data,
      ),
    onSuccess: (profile) => {
      queryClient.setQueryData(workerKey(profile.id), profile);
      void queryClient.invalidateQueries({ queryKey: teamKey });
    },
  });
}

/** « Ajouter un membre » — 201 with the new member, who can be put on a visit at once. */
export function useAddMember() {
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async ({ fullName, phone, skill }: AddMemberInput) =>
      teamMemberSchema.parse(
        (await apiClient.post(companyPath(companyId), { fullName, phone: phone || null, skill: skill || null })).data,
      ),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: teamKey }),
  });
}

/** « Supprimer » deactivates: the person stays on the visits they already did. Idempotent. */
export function useRemoveMember() {
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (id: string) =>
      teamMemberSchema.parse((await apiClient.delete(`${companyPath(companyId)}/${encodeURIComponent(id)}`)).data),
    onSuccess: (member) => {
      void queryClient.invalidateQueries({ queryKey: teamKey });
      void queryClient.invalidateQueries({ queryKey: workerKey(member.id) });
    },
  });
}
