import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import type { RecruterInput, HandicapInput } from '../schemas/profil';

export function useRecruter() {
  return useMutation({
    mutationFn: async (input: RecruterInput) => {
      const res = await apiClient.post('/sub/demandes', input);
      return res.data;
    },
  });
}

export function useHandicapJoin() {
  return useMutation({
    mutationFn: async (input: HandicapInput) => {
      const res = await apiClient.post('/handicap', input);
      return res.data;
    },
  });
}
