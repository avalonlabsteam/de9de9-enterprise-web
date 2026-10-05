import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/apiClient';

const wilayaSchema = z.object({ code: z.number(), nom: z.string(), nomAr: z.string().nullish() });
export type Wilaya = z.infer<typeof wilayaSchema>;

/** The 58 wilayas — `code` is the official number, the `wilayaCode` of a zone. Anonymous, and they never change. */
export function useWilayas() {
  return useQuery({
    queryKey: ['geo', 'wilayas'],
    staleTime: Infinity,
    queryFn: async () => z.array(wilayaSchema).parse((await apiClient.get('/geo/wilayas')).data),
  });
}

/** The communes of one wilaya — `code` is the `communeCode` of a zone. */
export function useCommunes(wilayaCode: number | null) {
  return useQuery({
    queryKey: ['geo', 'communes', wilayaCode ?? 0],
    enabled: wilayaCode !== null,
    staleTime: Infinity,
    queryFn: async () => z.array(wilayaSchema).parse((await apiClient.get(`/geo/wilayas/${wilayaCode ?? 0}/communes`)).data),
  });
}
