import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import {
  annonceSchema,
  annoncesSchema,
  proMissionsSchema,
  prosSchema,
} from '../schemas/annonces';

export function useAnnonces() {
  return useQuery({
    queryKey: ['annonces'],
    queryFn: async () => {
      const res = await apiClient.get('/annonces');
      return annoncesSchema.parse(res.data);
    },
  });
}

/** Active professionals (id, name, role) for "Missions des pros" and assignment. */
export function useProsWithJobs() {
  return useQuery({
    queryKey: ['annonces', 'pros'],
    queryFn: async () => {
      const res = await apiClient.get('/annonces/pros');
      return prosSchema.parse(res.data);
    },
  });
}

/** Prestataire calendar events — used to derive each pro's assigned missions. */
export function useProMissions() {
  return useQuery({
    queryKey: ['prestataire', 'calendar'],
    queryFn: async () => {
      const res = await apiClient.get('/prestataire/calendar');
      return proMissionsSchema.parse(res.data);
    },
  });
}

export interface CreateAnnoncePayload {
  title: string;
  serviceName: string;
  type: 'b2c' | 'b2b';
}

export function useCreateAnnonce() {
  return useMutation({
    mutationFn: async (payload: CreateAnnoncePayload) => {
      const res = await apiClient.post('/annonces', payload);
      return annonceSchema.parse(res.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['annonces'] });
    },
  });
}
