type L = (fr: string, ar: string) => string;

/** « 1,4 Mo », « 820 Ko » — null when the size is not known. */
export function tailleLabel(octets: number | null | undefined, L: L): string | null {
  if (octets == null || octets < 0) return null;
  if (octets >= 1_048_576) {
    const mo = (octets / 1_048_576).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    return L(`${mo} Mo`, `${mo} ميغابايت`);
  }
  const ko = Math.max(1, Math.round(octets / 1024));
  return L(`${ko} Ko`, `${ko} كيلوبايت`);
}
