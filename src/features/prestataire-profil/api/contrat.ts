import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { toProblem } from '@/api/problem';
import { useAuthStore } from '@/stores/authStore';
import { contratSchema } from '../schemas/contrat';

/** The session's own partnership contract. 400 for a company that is not a prestataire: nothing to retry. */
export function useContratPartenariat() {
  const companyId = useAuthStore((s) => s.user?.companyId);
  return useQuery({
    queryKey: ['prestataire', 'contrat-partenariat', companyId ?? ''],
    enabled: !!companyId,
    retry: (count, error) => count < 1 && ![400, 403, 404].includes(toProblem(error).status),
    queryFn: async () =>
      contratSchema.parse(
        (await apiClient.get(`/companies/${encodeURIComponent(companyId ?? '')}/contrat-partenariat`)).data,
      ),
  });
}
