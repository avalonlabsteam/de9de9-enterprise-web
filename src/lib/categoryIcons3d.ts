/**
 * The catalogue families' 3D pictures — from 3dicons (3dicons.co, by realvjy,
 * CC0: free to use, no attribution required), « dynamic » angle, « color »
 * style. The files sit in `public/categories/3d/`, trimmed and resized to
 * 256 px WebP from
 * `https://3dicons.sgp1.cdn.digitaloceanspaces.com/v1/dynamic/color/{name}-dynamic-color.png`.
 *
 * The API names a family's picture by its emoji (`icone`), so the table is
 * keyed by it, like the line icons of `CategoryChip`. The set has no scales,
 * truck, crane, soap or plate: those families take its closest object.
 */

/** An emoji without its variation selectors (U+FE0E / U+FE0F), so « ⚖ » and « ⚖️ » are one key. */
export const baseGlyph = (glyph: string): string =>
  Array.from(glyph)
    .filter((ch) => {
      const cp = ch.codePointAt(0);
      return cp !== 0xfe0e && cp !== 0xfe0f;
    })
    .join('');

const ICON_3D_BY_GLYPH: Record<string, string> = {
  '\u{2696}': 'file-text', // ⚖ Services Juridiques & Légaux — a contract
  '\u{1F9EE}': 'calculator', // 🧮 Comptabilité, Finance & Fiscalité
  '\u{1F465}': 'boy', // 👥 Ressources Humaines & Recrutement
  '\u{1F4BB}': 'computer', // 💻 Services Informatiques & Digitaux
  '\u{1F4E3}': 'megaphone', // 📣 Marketing, Communication & Créatif
  '\u{1F9FC}': 'bucket', // 🧼 Nettoyage & Hygiène
  '\u{1F6E1}': 'shield', // 🛡 Sécurité & Gardiennage
  '\u{1F69A}': 'map-pin', // 🚚 Logistique, Transport & Supply Chain
  '\u{1F3D7}': 'axe', // 🏗 BTP, Travaux & Aménagement
  '\u{1F527}': 'tool', // 🔧 Maintenance Industrielle & Technique
  '\u{1F4CA}': 'chart', // 📊 Conseil & Stratégie d'Entreprise
  '\u{1F4E6}': 'bag', // 📦 Fournitures & Équipements (Achat B2B)
  '\u{1F37D}': 'tea-cup', // 🍽 Restauration & Événementiel d'Entreprise
  '\u{1F6DF}': 'umbrella', // 🛟 Assurance & Gestion des Risques
  '\u{1F30D}': 'explorer', // 🌍 Import-Export & Commerce International
  '\u{1F5C2}': 'folder', // 🗂 Services Généraux & Support
};

/** The 3D picture of a family's emoji, or null when the set has none for it (the emoji is then drawn). */
export function categoryIcon3d(glyph: string | null | undefined): string | null {
  const name = glyph ? ICON_3D_BY_GLYPH[baseGlyph(glyph)] : undefined;
  return name ? `/categories/3d/${name}.webp` : null;
}
