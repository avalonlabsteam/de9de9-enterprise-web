import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { TonePill } from '@/components/actions/parts';
import type { Evenement } from '../schemas/calendar';
import { colourOf, heuresOf } from './eventStyle';

/**
 * « Planning » — the events day after day, under each day's `jourLabel`. Also
 * the list of the day picked on the month grid.
 */
export function PlanningList({ events, onOpen }: { events: Evenement[]; onOpen: (e: Evenement) => void }) {
  const byDay = useMemo(() => {
    const map = new Map<string, Evenement[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  return (
    <div className="flex flex-col gap-5">
      {byDay.map(([day, list]) => (
        <section key={day} className="flex flex-col gap-2">
          <h3 className="text-[13px] font-bold text-de9-gray">{list[0]?.jourLabel ?? day}</h3>
          <ul className="flex flex-col gap-2">
            {list.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onOpen(e)}
                  className="flex w-full items-start gap-3 rounded-lg bg-card p-3 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
                >
                  <span className="w-[88px] flex-none pt-0.5 text-[12.5px] font-bold text-de9-ink tabular-nums" dir="ltr">
                    {heuresOf(e) ?? '—'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="size-2.5 flex-none rounded-full" style={{ backgroundColor: colourOf(e) }} aria-hidden />
                      {e.sourceLabel && (
                        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-extrabold text-de9-slate">
                          {e.sourceLabel}
                        </span>
                      )}
                      {e.statutLabel && <TonePill tag={{ label: e.statutLabel, ton: e.ton }} className="px-2 py-0.5 text-[10.5px]" />}
                    </span>
                    <span className="mt-1 block text-[14px] font-bold break-words text-de9-ink">
                      {e.icone && <span aria-hidden>{e.icone} </span>}
                      {e.titre}
                    </span>
                    {e.lieu && (
                      <span className="mt-0.5 flex items-center gap-1 text-[12px] text-de9-slate">
                        <MapPin className="size-3.5 flex-none text-de9-teal" />
                        {e.lieu}
                      </span>
                    )}
                  </span>
                  {e.equipe.length > 0 && (
                    <span className="flex flex-none -space-x-2 rtl:space-x-reverse">
                      {e.equipe.slice(0, 3).map((p) => (
                        <WorkerAvatar
                          key={p.id}
                          worker={{ name: p.nom, initials: p.initiales ?? undefined, colorHex: p.couleur ?? undefined }}
                          size={26}
                          className="ring-2 ring-card"
                        />
                      ))}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
