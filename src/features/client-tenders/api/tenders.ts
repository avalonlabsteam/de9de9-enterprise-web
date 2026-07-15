import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import {
  tenderListSchema,
  tenderSchema,
  type ReviewInput,
  type TenderActionInput,
  type TenderPublishInput,
} from '../schemas/tender';

/** GET /tenders — all appels d'offres for the client. */
export function useTenders() {
  return useQuery({
    queryKey: ['tenders'],
    queryFn: async () => {
      const res = await apiClient.get('/tenders');
      return tenderListSchema.parse(res.data);
    },
  });
}

/** GET /tenders/:id — one demand with its occurrences. */
export function useTender(id: string) {
  return useQuery({
    queryKey: ['tender', id],
    queryFn: async () => {
      const res = await apiClient.get(`/tenders/${id}`);
      return tenderSchema.parse(res.data);
    },
    enabled: Boolean(id),
  });
}

/** POST /tenders — publish a new appel d'offres. */
export function usePublishTender() {
  return useMutation({
    mutationFn: async (input: TenderPublishInput) => {
      const res = await apiClient.post('/tenders', input);
      return tenderSchema.parse(res.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tenders'] });
    },
  });
}

/** POST /tenders/:id/actions — advance the demand / an occurrence. */
export function useTenderAction(id: string) {
  return useMutation({
    mutationFn: async (input: TenderActionInput) => {
      const res = await apiClient.post(`/tenders/${id}/actions`, input);
      return tenderSchema.parse(res.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tenders'] });
      void queryClient.invalidateQueries({ queryKey: ['tender', id] });
    },
  });
}

/** POST /tenders/:id/reviews — leave a rating for a completed prestation. */
export function useReview(id: string) {
  return useMutation({
    mutationFn: async (input: ReviewInput) => {
      const res = await apiClient.post(`/tenders/${id}/reviews`, input);
      return res.data as { ok: boolean; note: number };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tender', id] });
    },
  });
}
