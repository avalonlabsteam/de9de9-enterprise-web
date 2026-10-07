import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategorieVisual } from './CategorieVisual';

/**
 * A family's card: its name, how many services it holds, its picture in the
 * trailing corner. The same card on the client's home and in the B2B annonce
 * form — where it is a choice (`selected`) and a size smaller (`dense`).
 */
export function CategorieCarte({
  code,
  name,
  services,
  imageUrl,
  icone,
  dense = false,
  selected,
  onClick,
}: {
  code: string;
  name: string;
  /** « 13 services » */
  services: string;
  imageUrl?: string | null;
  icone?: string | null;
  /** A size smaller, for a grid inside a form. */
  dense?: boolean;
  /** Given where the card is a choice: pressed or not. Left out, the card only opens something. */
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      // The trailing edge is the picture's: the name wraps beside it, never under it.
      className={cn(
        'relative flex items-center rounded-xl text-start shadow-soft transition-shadow hover:shadow-lift',
        dense ? 'min-h-[112px] py-4 ps-4 pe-[68px]' : 'min-h-[140px] py-5 ps-5 pe-20',
        selected ? 'bg-de9-teal-soft/40 ring-2 ring-de9-teal' : 'bg-card dark:ring-1 dark:ring-border',
      )}
    >
      <span className={cn('flex min-w-0 flex-col items-start', dense ? 'gap-1' : 'gap-1.5')}>
        <span className={cn('leading-[1.3] font-bold text-de9-ink', dense ? 'text-[15px]' : 'text-[17px]')}>{name}</span>
        <span className={cn('text-de9-slate', dense ? 'text-[12.5px]' : 'text-[13px]')}>{services}</span>
      </span>
      {selected && (
        <span className={cn('absolute grid size-5 place-items-center rounded-full bg-de9-teal text-primary-foreground', dense ? 'end-2.5 top-2.5' : 'end-3 top-3')}>
          <Check className="size-3.5" />
        </span>
      )}
      <span className={cn('pointer-events-none absolute', dense ? 'end-2.5 bottom-2.5' : 'end-3 bottom-3')}>
        <CategorieVisual
          key={imageUrl ?? code}
          imageUrl={imageUrl}
          icone={icone}
          className={dense ? 'size-[52px]' : 'size-[60px]'}
          emojiClassName={dense ? 'size-[52px] text-[30px]' : 'size-[60px] text-[34px]'}
        />
      </span>
    </button>
  );
}
