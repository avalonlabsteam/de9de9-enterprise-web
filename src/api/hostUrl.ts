import { apiClient } from './apiClient';

/**
 * The API's `href`s are full paths from the host (`/api/v1/…`): resolve them
 * against the API's origin, never append them to the base URL (which already
 * ends in `/api/v1`).
 */
export function apiUrl(href: string): string {
  const base = apiClient.defaults.baseURL ?? '/api/v1';
  const origin = new URL(base, window.location.origin).origin;
  return new URL(href, origin).toString();
}
