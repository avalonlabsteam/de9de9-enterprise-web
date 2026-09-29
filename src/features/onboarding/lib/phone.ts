/**
 * Algerian numbers as the API accepts them: a mobile (05/06/07 + 8 digits) or a
 * landline (0 + 8 digits), written with or without `+213`, spaces and dashes.
 * Returns the national form (`0560000000`), or null when it is not a valid
 * number — the caller decides whether that is an error or an empty field.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s.\-()]/g, '');
  const national = digits
    .replace(/^\+213/, '0')
    .replace(/^00213/, '0')
    .replace(/^213(?=[5-7]\d{8}$)/, '0');
  if (!/^\d+$/.test(national)) return null;
  const mobile = /^0[5-7]\d{8}$/.test(national);
  const landline = /^0\d{8}$/.test(national);
  return mobile || landline ? national : null;
}

/** A mobile is the user's own phone; a landline only reaches the company. */
export function isMobile(national: string): boolean {
  return /^0[5-7]\d{8}$/.test(national);
}
