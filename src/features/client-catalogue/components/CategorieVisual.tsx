import { useState } from 'react';
import { cn } from '@/lib/utils';
import { categoryIcon3d } from '@/lib/categoryIcons3d';

/**
 * A category's picture, in this order: its `imageUrl` (public, so a bare
 * `<img>`) when de9de9 gave it one; else the app's 3D icon for its emoji; else
 * the emoji itself. A picture that fails to load falls to the next one. Key it
 * on the url at the call site so a new url gets a fresh try.
 */
export function CategorieVisual({
  imageUrl,
  icone,
  className,
  iconClassName,
  emojiClassName,
}: {
  imageUrl?: string | null;
  icone?: string | null;
  /** The server's picture. */
  className?: string;
  /** The 3D icon — a square with its own margin; `className` when not given. */
  iconClassName?: string;
  emojiClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn('object-contain', className)}
      />
    );
  }
  const icon3d = categoryIcon3d(icone);
  if (icon3d && !iconFailed) {
    return (
      <img
        src={icon3d}
        alt=""
        loading="lazy"
        draggable={false}
        onError={() => setIconFailed(true)}
        className={cn('object-contain drop-shadow-sm', iconClassName ?? className)}
      />
    );
  }
  return (
    <span aria-hidden className={cn('grid place-items-center', emojiClassName)}>
      {icone || '🧰'}
    </span>
  );
}

/** The family badge on a tile (« VERT », « NOIR »…), in the family's own colour. */
export function FamilleBadge({ label, hex }: { label?: string | null; hex?: string | null }) {
  if (!label) return null;
  return (
    <span
      className="rounded-full bg-de9-teal px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white"
      style={hex ? { backgroundColor: hex } : undefined}
    >
      {label}
    </span>
  );
}
