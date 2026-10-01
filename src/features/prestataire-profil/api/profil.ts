import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import type { HandicapInput } from '../schemas/profil';

export function useHandicapJoin() {
  return useMutation({
    mutationFn: async (input: HandicapInput) => {
      const res = await apiClient.post('/handicap', input);
      return res.data;
    },
  });
}
