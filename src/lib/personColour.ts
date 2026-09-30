/** The team palette the API draws people in (guide 14 §4) — the first three are the design's team colours. */
const PALETTE = ['#2F9BE0', '#F6A93B', '#9B6BE2', '#E0645A', '#3FA66B', '#D67BA8', '#2E8C8C', '#B8862B'] as const;

/**
 * A stable colour for a person, from their id — for the screens whose answer
 * carries none (« Mon effectif »). The same id always gets the same colour.
 */
export function personColour(id: string): string {
  // FNV-1a: cheap, and spreads close ids apart.
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return PALETTE[(hash >>> 0) % PALETTE.length] ?? PALETTE[0];
}
