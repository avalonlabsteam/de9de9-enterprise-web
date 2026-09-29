import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * A category's picture: its `imageUrl` (public, so a bare `<img>`), or its
 * emoji when there is none — or when the image fails to load. Key it on the
 * url at the call site so a new url gets a fresh try.
 */
export function CategorieVisual({
  imageUrl,
  icone,
  className,
  emojiClassName,
}: {
  imageUrl?: string | null;
  icone?: string | null;
  className?: string;
  emojiClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
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
  return (
    <span aria-hidden className={cn('grid place-items-center', emojiClassName)}>
      {icone ?? '🧰'}
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
