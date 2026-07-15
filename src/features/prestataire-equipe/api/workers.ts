import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import { workerSchema, workersSchema, type MemberFields, type AgrandirInput } from '../schemas/worker';

export function useTeam() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const res = await apiClient.get('/workers');
      return workersSchema.parse(res.data);
    },
  });
}

export function useWorker(id: string | undefined) {
  return useQuery({
    queryKey: ['workers', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await apiClient.get(`/workers/${id}`);
      return workerSchema.parse(res.data);
    },
  });
}

export function useUpdateMember() {
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: MemberFields }) => {
      const res = await apiClient.patch(`/workers/${id}`, patch);
      return workerSchema.parse(res.data);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['workers'] });
      void queryClient.invalidateQueries({ queryKey: ['workers', variables.id] });
    },
  });
}

export function useGenerateLink() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/workers/invite', {});
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useRemoveMember() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/workers/${id}`);
      return workerSchema.parse(res.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useAgrandir() {
  return useMutation({
    mutationFn: async (input: AgrandirInput) => {
      const res = await apiClient.post('/workers/agrandir', input);
      return res.data;
    },
  });
}
