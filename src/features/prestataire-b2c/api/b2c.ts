import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import {
  b2cWorkersSchema,
  openOffersSchema,
  reservationsSchema,
  sentOfferSchema,
  sentOffersSchema,
  type OpenOffer,
} from '../schemas/b2c';

export function useReservations() {
  return useQuery({
    queryKey: ['b2c', 'reservations'],
    queryFn: async () => {
      const res = await apiClient.get('/b2c/reservations');
      return reservationsSchema.parse(res.data);
    },
  });
}

export function useOpenOffers() {
  return useQuery({
    queryKey: ['b2c', 'open-offers'],
    queryFn: async () => {
      const res = await apiClient.get('/b2c/open-offers');
      return openOffersSchema.parse(res.data);
    },
  });
}

export function useSentOffers() {
  return useQuery({
    queryKey: ['b2c', 'sent-offers'],
    queryFn: async () => {
      const res = await apiClient.get('/b2c/sent-offers');
      return sentOffersSchema.parse(res.data);
    },
  });
}

/** Resolve assigned worker names/colors for confirmed reservations. */
export function useB2cWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const res = await apiClient.get('/workers');
      return b2cWorkersSchema.parse(res.data);
    },
  });
}

export interface SubmitBidPayload {
  offer: OpenOffer;
  prixDzd: number;
  delai: string;
  message: string;
}

export function useSubmitBid() {
  return useMutation({
    mutationFn: async (payload: SubmitBidPayload) => {
      const res = await apiClient.post('/b2c/bids', {
        title: payload.offer.title,
        prixDzd: payload.prixDzd,
        delai: payload.delai,
        message: payload.message,
      });
      return sentOfferSchema.parse(res.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['b2c', 'sent-offers'] });
    },
  });
}

export function useAffecterB2c() {
  return useMutation({
    mutationFn: async ({ id, workerIds }: { id: string; workerIds: string[] }) => {
      const res = await apiClient.post(`/b2c/reservations/${id}/affect`, { workerIds });
      return res.data as unknown;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['b2c', 'reservations'] });
    },
  });
}
