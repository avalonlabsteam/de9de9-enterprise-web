import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { statsSchema } from '../schemas/dashboard';

export function useStats() {
  return useQuery({
    queryKey: ['prestataire', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/prestataire/stats');
      return statsSchema.parse(res.data);
    },
  });
}
