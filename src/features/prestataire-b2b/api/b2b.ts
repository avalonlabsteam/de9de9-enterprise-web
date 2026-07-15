import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import { b2bJobSchema, b2bJobsSchema, b2bWorkersSchema } from '../schemas/b2b';

export function useB2bJobs() {
  return useQuery({
    queryKey: ['b2b', 'jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/b2b');
      return b2bJobsSchema.parse(res.data);
    },
  });
}

export function useB2bJob(id: string | undefined) {
  return useQuery({
    queryKey: ['b2b', 'job', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await apiClient.get(`/b2b/${id}`);
      return b2bJobSchema.parse(res.data);
    },
  });
}

/** Resolve worker names/colors for the "Affecté à" chip. */
export function useB2bWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const res = await apiClient.get('/workers');
      return b2bWorkersSchema.parse(res.data);
    },
  });
}

export type B2bActionName = 'affect' | 'upload' | 'changer';

export interface B2bActionPayload {
  id: string;
  action: B2bActionName;
  workerIds?: string[];
  montant?: number;
}

export function useB2bAction() {
  return useMutation({
    mutationFn: async ({ id, action, workerIds, montant }: B2bActionPayload) => {
      const res = await apiClient.post(`/b2b/${id}/actions`, { action, workerIds, montant });
      return b2bJobSchema.parse(res.data);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['b2b', 'jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['b2b', 'job', variables.id] });
    },
  });
}
