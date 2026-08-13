import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { contactResponseSchema, type ContactValues } from '../schemas/contact';

/** Public "Nous contacter" form (POST /contact). */
export function useSendContact() {
  return useMutation({
    mutationFn: async (values: ContactValues) => {
      const res = await apiClient.post('/contact', values);
      return contactResponseSchema.parse(res.data);
    },
  });
}
