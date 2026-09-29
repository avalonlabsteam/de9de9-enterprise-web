/**
 * The API is .NET: an empty value arrives as `null` (`"valeur": null`,
 * `"logoUrl": null`), not as a missing key. The app's zod schemas speak
 * "missing" — `.optional()` and `.default()` only cover an absent key, so one
 * stray `null` fails a whole screen's parse. This turns every `null` in a JSON
 * answer into an absent key, once, where the data enters the app.
 */
export function stripNulls(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value.map(stripNulls);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== null) out[key] = stripNulls(entry);
    }
    return out;
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}
