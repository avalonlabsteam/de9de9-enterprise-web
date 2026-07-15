import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { dashboardSchema, statsSchema } from '../schemas/dashboard';

export function useDashboard() {
  return useQuery({
    queryKey: ['prestataire', 'dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/prestataire/dashboard');
      return dashboardSchema.parse(res.data);
    },
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['prestataire', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/prestataire/stats');
      return statsSchema.parse(res.data);
    },
  });
}
