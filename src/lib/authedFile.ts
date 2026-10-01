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

/** The file name the server gave, from `Content-Disposition` (exposed by CORS), if any. */
export function fileNameOf(disposition: unknown): string | undefined {
  if (typeof disposition !== 'string') return undefined;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (star?.[1]) return decodeURIComponent(star[1]);
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1];
}

/** Save a blob under a file name. */
export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Download a private file and save it under the server's name, else `fallbackName`. */
export async function downloadAuthedFile(url: string, fallbackName: string): Promise<void> {
  const res = await apiClient.get(url, { responseType: 'blob', timeout: 60_000 });
  saveBlob(res.data as Blob, fileNameOf(res.headers['content-disposition']) ?? fallbackName);
}
