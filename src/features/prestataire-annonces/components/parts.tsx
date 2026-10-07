import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toneBox, tonePill, toneText } from '@/lib/tones';
import { CategorieVisual } from '@/features/client-catalogue/components/CategorieVisual';
import type { Tag } from '../schemas/annonces';

/** A status or publication badge: the backend's label, in the tone it names. */
export function StatutBadge({ tag, className }: { tag: Tag; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap', tonePill(tag.ton), className)}>
      {tag.label}
    </span>
  );
}

/** The kind of an annonce: B2C teal « Particuliers », B2B blue « Entreprises » — one convention everywhere. */
export function TypeChip({ type, label, className }: { type: string; label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap',
        type === 'b2b' ? 'bg-de9-blue-tint text-de9-blue' : 'bg-de9-teal-soft text-de9-teal-dark',
        className,
      )}
    >
      {label}
    </span>
  );
}

/** A banner of the list or the status strip of an annonce: one backend sentence, in its tone. */
export function Bandeau({ ton, texte, children }: { ton?: string | null; texte: string; children?: React.ReactNode }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-3 text-[13px] font-medium', toneBox(ton), toneText(ton))}>
      <span className="min-w-0 flex-1">{texte}</span>
      {children}
    </div>
  );
}

/**
 * What stands for an annonce: its first photo; else the de9de9 category's
 * picture (B2C) or the category's icon on its family colour (B2B).
 */
export function Couverture({
  url,
  photoCategorie,
  icone,
  hex,
  className,
}: {
  url?: string | null;
  photoCategorie?: string | null;
  icone?: string | null;
  hex?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = url ?? photoCategorie;
  if (src && !failed) {
    return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={cn('object-cover', className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn('grid place-items-center bg-secondary', className)}
      style={hex ? { backgroundColor: `${hex}22` } : undefined}
    >
      <CategorieVisual icone={icone} iconClassName="size-2/3" emojiClassName="text-[28px]" />
    </span>
  );
}
