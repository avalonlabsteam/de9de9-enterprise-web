import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { CategoryKey } from '@/lib/categoryColors';
import { CategoryIcon } from './CategoryChip';

/**
 * Designer-supplied 3D category artwork, dropped in as
 * `public/categories/<familyId>.png` (ids match `@/lib/catalogue`).
 * Until an asset exists the tile degrades to the monochrome line icon, so the
 * catalogue renders correctly whether or not the artwork has shipped.
 */
const categoryArtSrc = (familyId: string) => `/categories/${familyId}.png`;

export function CategoryArt({
  familyId,
  colorKey,
  icon,
  className,
  fallbackClassName,
}: {
  familyId: string;
  colorKey: CategoryKey;
  icon: string;
  /** Sizing for the artwork image. */
  className?: string;
  /** Sizing for the line-icon tile shown when no artwork is present. */
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <CategoryIcon colorKey={colorKey} icon={icon} className={fallbackClassName} />;
  }

  return (
    <img
      src={categoryArtSrc(familyId)}
      alt=""
      aria-hidden
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-contain', className)}
    />
  );
}

/**
 * Per-service photography, dropped in as `public/categories/subs/<subId>.webp`
 * (ids match `@/lib/catalogue`, e.g. `6-1`). WebP because these are photographs
 * filling a card, not the cut-out renders `CategoryArt` serves.
 * Falls back to the parent family's line icon until an asset ships.
 */
const subArtSrc = (subId: string) => `/categories/subs/${subId}.webp`;

export function SubArt({
  subId,
  colorKey,
  icon,
  className,
  fallbackClassName,
}: {
  subId: string;
  colorKey: CategoryKey;
  icon: string;
  /** Sizing for the photograph. */
  className?: string;
  /** Sizing for the line-icon tile shown when no photograph is present. */
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <CategoryIcon colorKey={colorKey} icon={icon} className={fallbackClassName} />;
  }

  return (
    <img
      src={subArtSrc(subId)}
      alt=""
      aria-hidden
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('size-full object-cover', className)}
    />
  );
}
