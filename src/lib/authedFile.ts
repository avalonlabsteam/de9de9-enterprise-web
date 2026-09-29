import { apiClient } from '@/api/apiClient';

/**
 * Open a file the API serves behind the bearer token. A plain link would arrive
 * without the header and be refused, so the bytes are fetched, wrapped in an
 * object URL and handed to a new tab.
 *
 * The URL is revoked on a timer: revoking it straight away would race the tab
 * that is still loading it.
 */
export async function openAuthedFile(url: string): Promise<void> {
  const res = await apiClient.get(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(res.data as Blob);
  window.open(objectUrl, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
