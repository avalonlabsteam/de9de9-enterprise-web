import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { calWorkersSchema, calendarEventsSchema } from '../schemas/calendar';

export function useCalendar() {
  return useQuery({
    queryKey: ['prestataire', 'calendar'],
    queryFn: async () => {
      const res = await apiClient.get('/prestataire/calendar');
      return calendarEventsSchema.parse(res.data);
    },
  });
}

/** Active workers for the employee filter chips + colour tags. */
export function useCalendarWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const res = await apiClient.get('/workers');
      return calWorkersSchema.parse(res.data);
    },
  });
}
