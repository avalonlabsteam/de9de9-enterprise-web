/**
 * The four catalogue category colours (NOIR / BLEU / VERT / ROUGE), mapped to
 * theme-aware token utilities. Class strings are LITERAL (not templated) so the
 * Tailwind v4 scanner keeps them — the underlying `--color-cat-*` tokens flip
 * with the `.dark` class (see index.css).
 */

export type CategoryKey = 'noir' | 'bleu' | 'vert' | 'rouge';

export const CATEGORY_KEYS: readonly CategoryKey[] = ['noir', 'bleu', 'vert', 'rouge'];

export interface CategoryClasses {
  /** Accent text colour (icon / label). */
  text: string;
  /** Solid accent background (dot / strong chip). */
  bg: string;
  /** Tinted soft surface (chip / icon tile background). */
  soft: string;
  /** Accent border. */
  border: string;
}

const CLASSES: Record<CategoryKey, CategoryClasses> = {
  noir: { text: 'text-cat-noir', bg: 'bg-cat-noir', soft: 'bg-cat-noir-soft', border: 'border-cat-noir' },
  bleu: { text: 'text-cat-bleu', bg: 'bg-cat-bleu', soft: 'bg-cat-bleu-soft', border: 'border-cat-bleu' },
  vert: { text: 'text-cat-vert', bg: 'bg-cat-vert', soft: 'bg-cat-vert-soft', border: 'border-cat-vert' },
  rouge: { text: 'text-cat-rouge', bg: 'bg-cat-rouge', soft: 'bg-cat-rouge-soft', border: 'border-cat-rouge' },
};

export function categoryClasses(key: CategoryKey): CategoryClasses {
  return CLASSES[key];
}
