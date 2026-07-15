import { cn } from '@/lib/utils';
import { categoryClasses, type CategoryKey } from '@/lib/categoryColors';

/** A soft, category-tinted tile — used for family icons and category chips. */
export function CategoryIcon({
  colorKey,
  icon,
  className,
}: {
  colorKey: CategoryKey;
  icon: string;
  className?: string;
}) {
  const c = categoryClasses(colorKey);
  return (
    <div
      className={cn('flex size-11 items-center justify-center rounded-xl text-[20px]', c.soft, className)}
    >
      <span>{icon}</span>
    </div>
  );
}

export function CategoryChip({
  colorKey,
  label,
  className,
}: {
  colorKey: CategoryKey;
  label: string;
  className?: string;
}) {
  const c = categoryClasses(colorKey);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold',
        c.soft,
        c.text,
        className,
      )}
    >
      <span className={cn('size-2 rounded-full', c.bg)} />
      {label}
    </span>
  );
}
