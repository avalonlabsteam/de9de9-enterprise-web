import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { clientCalendarSchema, type ClientEvent } from '../schemas/calendar';

async function fetchClientCalendar(): Promise<ClientEvent[]> {
  const res = await apiClient.get('/client/calendar');
  return clientCalendarSchema.parse(res.data);
}

export function useClientCalendar() {
  return useQuery({ queryKey: ['client', 'calendar'], queryFn: fetchClientCalendar });
}
