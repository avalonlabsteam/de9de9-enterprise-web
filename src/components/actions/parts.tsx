import { Check, Loader2, Plus, TriangleAlert } from 'lucide-react';
import { ApiIcon } from '@/components/common/ApiIcon';
import { cn } from '@/lib/utils';
import { buttonStyle, tonePill } from '@/lib/tones';
import type { ApiAction, Etape, ToneTag } from '@/lib/actions/schema';

/** A status pill / tag, coloured by its `ton`. */
export function TonePill({ tag, className }: { tag: ToneTag; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap',
        tonePill(tag.ton),
        className,
      )}
    >
      {tag.label}
    </span>
  );
}

/**
 * A button drawn from the answer: its `label`, `style` and `icone`. Greyed out
 * (with its reason as a tooltip) when `indisponible` is set and there is no
 * route to call — a press then only says why.
 */
export function ActionButton({
  action,
  busy,
  onPress,
  className,
}: {
  action: ApiAction;
  busy?: boolean;
  onPress: (action: ApiAction) => void;
  className?: string;
}) {
  const unavailable = !!action.indisponible && !action.href;
  return (
    <button
      type="button"
      onClick={() => onPress(action)}
      disabled={busy}
      aria-disabled={unavailable || undefined}
      title={unavailable ? (action.indisponible ?? undefined) : undefined}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-bold transition-[filter,background-color] disabled:opacity-60',
        buttonStyle(action.style),
        unavailable && 'opacity-50',
        className,
      )}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : action.style === 'ajout' ? (
        <Plus className="size-4" />
      ) : (
        <ApiIcon code={action.icone} className="size-4" />
      )}
      {action.label}
    </button>
  );
}

/**
 * Rungs drawn by `etat`: `fait` ticked, `en_cours` highlighted, `alerte` the
 * current rung in red with ⚠, anything else grey. `grisees` (a cancelled
 * occurrence) draws every rung grey, without marks.
 */
export function EtapesBar({ etapes, grisees, className }: { etapes: Etape[]; grisees?: boolean; className?: string }) {
  return (
    <ol className={cn('flex items-start', grisees && 'opacity-60', className)}>
      {etapes.map((etape, i) => {
        const done = !grisees && etape.etat === 'fait';
        const current = !grisees && etape.etat === 'en_cours';
        const alert = !grisees && etape.etat === 'alerte';
        return (
          <li key={`${etape.code ?? etape.label}-${i}`} className="flex min-w-0 flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span
                className={cn(
                  'h-0.5 flex-1',
                  i === 0 ? 'bg-transparent' : alert ? 'bg-de9-red' : done || current ? 'bg-de9-teal' : 'bg-border',
                )}
              />
              <span
                className={cn(
                  'grid size-6 flex-none place-items-center rounded-full border-2 text-[11px] font-bold',
                  done
                    ? 'border-de9-teal bg-de9-teal text-primary-foreground'
                    : alert
                      ? 'border-de9-red bg-de9-red-soft text-de9-red ring-4 ring-de9-red/15'
                      : current
                        ? 'border-de9-teal bg-card text-de9-teal-dark ring-4 ring-de9-teal/15'
                        : 'border-border bg-card text-de9-gray',
                )}
              >
                {done ? <Check className="size-3.5" /> : alert ? <TriangleAlert className="size-3" /> : grisees ? '' : i + 1}
              </span>
              <span
                className={cn('h-0.5 flex-1', i === etapes.length - 1 ? 'bg-transparent' : done ? 'bg-de9-teal' : 'bg-border')}
              />
            </div>
            <span
              className={cn(
                'mt-1.5 px-1 text-[11.5px] leading-tight',
                alert
                  ? 'font-bold text-de9-red'
                  : current
                    ? 'font-bold text-de9-ink'
                    : done
                      ? 'font-semibold text-de9-teal-dark'
                      : 'text-de9-gray',
              )}
            >
              {etape.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
