import { cn } from '@/lib/utils';

export interface OngletItem {
  code: string;
  label: string;
  count?: number;
}

/**
 * The tab chips of a list screen (« Toutes · 9 », « Action requise · 3 »…) —
 * labels and counts as the answer gives them.
 */
export function OngletBar({
  onglets,
  active,
  onSelect,
  className,
}: {
  onglets: OngletItem[];
  active: string;
  onSelect: (code: string) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn('flex flex-wrap gap-2', className)}>
      {onglets.map((o) => {
        const selected = o.code === active;
        return (
          <button
            key={o.code}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(o.code)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-all',
              selected
                ? 'bg-de9-teal text-primary-foreground shadow-glow'
                : 'bg-card text-de9-teal-dark shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border',
            )}
          >
            {o.label}
            {o.count != null && (
              <span
                className={cn(
                  'min-w-5 rounded-full px-1.5 text-[11px] tabular-nums',
                  selected ? 'bg-white/25 text-white' : 'bg-de9-teal-soft text-de9-teal-dark',
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
