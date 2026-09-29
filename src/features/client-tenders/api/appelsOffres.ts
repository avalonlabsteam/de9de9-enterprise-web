import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import { demandesQueryKey } from './demandes';
import {
  appelOffresCreatedSchema,
  type AppelOffresCreated,
  type AppelOffresPayload,
} from '../schemas/appelOffres';

/** Several documents in one request: the client's 15 s would cut a slow uplink off. */
const MEDIA_TIMEOUT_MS = 5 * 60_000;

/**
 * Send the « Appel d'offres », then attach its documents. de9de9's admins are
 * notified the moment the demand is created, so a failed upload must not fail
 * the send: the demand exists — the caller only warns that the files are missing.
 */
export async function sendAppelOffres({
  payload,
  files,
}: {
  payload: AppelOffresPayload;
  files: File[];
}): Promise<{ created: AppelOffresCreated; mediaFailed: boolean }> {
  const created = appelOffresCreatedSchema.parse((await apiClient.post('/appels-offres', payload)).data);
  let mediaFailed = false;
  if (files.length > 0) {
    const form = new FormData();
    for (const file of files) form.append('files', file);
    try {
      await apiClient.post(`/appels-offres/${encodeURIComponent(created.id)}/media`, form, {
        timeout: MEDIA_TIMEOUT_MS,
      });
    } catch {
      mediaFailed = true;
    }
  }
  return { created, mediaFailed };
}

export function useSendAppelOffres() {
  return useMutation({
    mutationFn: sendAppelOffres,
    onSuccess: () => {
      // The new demand is the first card of « Mes demandes », and the counts move.
      void queryClient.invalidateQueries({ queryKey: demandesQueryKey });
    },
  });
}
