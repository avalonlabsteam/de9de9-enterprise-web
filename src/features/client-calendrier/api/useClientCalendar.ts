import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { calendrierSchema } from '../schemas/calendar';

/**
 * The client's visits from `du` to `au` (both `YYYY-MM-DD`, inclusive). The
 * previous range stays on screen while the next one loads, so switching months
 * does not flash empty.
 */
export function useClientCalendrier(du: string, au: string) {
  return useQuery({
    queryKey: ['client', 'calendrier', du, au],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      calendrierSchema.parse((await apiClient.get('/client/calendrier', { params: { du, au } })).data),
  });
}
