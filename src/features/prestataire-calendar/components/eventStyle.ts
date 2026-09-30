import type { CSSProperties } from 'react';
import type { Evenement } from '../schemas/calendar';

/** The source colours of an event with no crew — the server sends them too; kept as a fallback. */
const SOURCE_COLOUR: Record<string, string> = { b2b: '#5A6472', b2c: '#46B3AA' };

export const colourOf = (e: Evenement) => e.couleur ?? SOURCE_COLOUR[e.source] ?? SOURCE_COLOUR.b2b;

/**
 * An event drawn in its `couleur`: a tint of it behind ink text, and a solid
 * edge. White text on the palette's lighter colours (#F6A93B…) would not read.
 */
export function eventStyle(e: Evenement): CSSProperties {
  const colour = colourOf(e);
  const hex = /^#[0-9a-f]{6}$/i.test(colour);
  return {
    backgroundColor: hex ? `${colour}24` : undefined,
    borderInlineStartColor: colour,
  };
}

/** « 06:00 – 09:00 », or « 06:00 » without an end. */
export const heuresOf = (e: Evenement) =>
  e.heureLabel ? (e.heureFinLabel ? `${e.heureLabel} – ${e.heureFinLabel}` : e.heureLabel) : null;
