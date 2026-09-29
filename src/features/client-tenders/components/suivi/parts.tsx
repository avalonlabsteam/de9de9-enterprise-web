import { Check, Loader2, Plus, Star } from 'lucide-react';
import { ApiIcon } from '@/components/common/ApiIcon';
import { cn } from '@/lib/utils';
import type { Etape, PrestataireCarte, SuiviAction, ToneTag } from '../../schemas/suivi';
import { buttonStyle, tonePill } from '@/lib/tones';

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
 * route to call.
 */
export function ActionButton({
  action,
  busy,
  onPress,
  className,
}: {
  action: SuiviAction;
  busy?: boolean;
  onPress: (action: SuiviAction) => void;
  className?: string;
}) {
  const unavailable = !!action.indisponible && !action.href && !action.ouvre;
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

/** Rungs drawn by `etat`: `fait` ticked, `en_cours` highlighted, anything else grey. */
export function EtapesBar({ etapes, className }: { etapes: Etape[]; className?: string }) {
  return (
    <ol className={cn('flex items-start', className)}>
      {etapes.map((etape, i) => {
        const done = etape.etat === 'fait';
        const current = etape.etat === 'en_cours';
        return (
          <li key={`${etape.code ?? etape.label}-${i}`} className="flex min-w-0 flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn('h-0.5 flex-1', i === 0 ? 'bg-transparent' : done || current ? 'bg-de9-teal' : 'bg-border')} />
              <span
                className={cn(
                  'grid size-6 flex-none place-items-center rounded-full border-2 text-[11px] font-bold',
                  done
                    ? 'border-de9-teal bg-de9-teal text-white'
                    : current
                      ? 'border-de9-teal bg-card text-de9-teal-dark ring-4 ring-de9-teal/15'
                      : 'border-border bg-card text-de9-gray',
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn('h-0.5 flex-1', i === etapes.length - 1 ? 'bg-transparent' : done ? 'bg-de9-teal' : 'bg-border')}
              />
            </div>
            <span
              className={cn(
                'mt-1.5 px-1 text-[11.5px] leading-tight',
                current ? 'font-bold text-de9-ink' : done ? 'font-semibold text-de9-teal-dark' : 'text-de9-gray',
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

/** A provider's identity: initials in its colour, name, and « ★ 4.7 · 12 ans ». */
export function PrestataireIdentity({ p, className }: { p: PrestataireCarte; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <span
        className="grid size-11 flex-none place-items-center rounded-full bg-de9-teal text-[14px] font-extrabold text-white"
        style={p.couleur ? { backgroundColor: p.couleur } : undefined}
        aria-hidden
      >
        {p.initiales ?? p.nom.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold text-de9-ink">{p.nom}</p>
        {p.sousTitre && (
          <p className="flex items-center gap-1 text-[12.5px] text-de9-slate">
            {p.note != null && <Star className="size-3.5 flex-none fill-amber-400 text-amber-400" />}
            <span className="truncate">{p.sousTitre}</span>
          </p>
        )}
      </div>
    </div>
  );
}
