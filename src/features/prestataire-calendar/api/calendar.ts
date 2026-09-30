import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { calendrierSchema } from '../schemas/calendar';

export const calendrierKey = ['prestataire', 'calendrier'] as const;

export interface CalendrierWindow {
  /** `yyyy-MM-dd`, Algiers days, both included — at most 93 days. */
  du: string;
  au: string;
  /** tous · b2b · b2c */
  source: string;
  /** Keeps the events where that person is on the crew. */
  salarieId?: string | null;
}

/**
 * One call per visible window (guide 14). The previous window stays on screen
 * while the next one loads, so moving through weeks does not flash empty.
 */
export function useCalendrier({ du, au, source, salarieId }: CalendrierWindow) {
  return useQuery({
    queryKey: [...calendrierKey, du, au, source, salarieId ?? ''],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      calendrierSchema.parse(
        (
          await apiClient.get('/prestataire/calendrier', {
            params: { du, au, source, ...(salarieId ? { salarieId } : {}) },
          })
        ).data,
      ),
  });
}
