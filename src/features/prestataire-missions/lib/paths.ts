/** « Détail de la mission » in the app — focused on `occurrence` when given. */
export function missionPath(id: string, occurrence?: string | null): string {
  const path = `/prestataire/missions/${encodeURIComponent(id)}`;
  return occurrence ? `${path}?occurrence=${encodeURIComponent(occurrence)}` : path;
}

/**
 * The app page an API `href` of the mission screen names
 * (`/api/v1/prestataire/missions/{id}?occurrence={visitId}` — a « Voir la
 * mission » button, a history row): the same screen, as a page the user can
 * come back to. null when the href is not a mission's.
 */
export function missionPathFromHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const url = new URL(href, 'https://api.invalid');
  const match = /\/prestataire\/missions\/([^/]+)$/.exec(url.pathname);
  if (!match?.[1]) return null;
  return missionPath(decodeURIComponent(match[1]), url.searchParams.get('occurrence'));
}
