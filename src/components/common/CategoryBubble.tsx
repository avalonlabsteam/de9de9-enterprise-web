import { CATEGORY_KEYS, type CategoryKey } from '@/lib/categoryColors';
import { CategoryIcon } from './CategoryChip';

/** « Services Généraux » — the tile drawn when the answer names no category. */
const FALLBACK_GLYPH = '\u{1F5C2}';

/**
 * A category as an API answer gives it — its emoji (`icone`) and colour family
 * (`famille`: noir · bleu · vert · rouge) — drawn as the app's tinted line-icon
 * tile. Unknown values fall back to a neutral tile rather than failing.
 */
export function CategoryBubble({
  icone,
  famille,
  className,
}: {
  icone?: string | null;
  famille?: string | null;
  className?: string;
}) {
  const key = (CATEGORY_KEYS as readonly string[]).includes(famille ?? '') ? (famille as CategoryKey) : 'noir';
  return <CategoryIcon colorKey={key} icon={icone ?? FALLBACK_GLYPH} className={className} />;
}
