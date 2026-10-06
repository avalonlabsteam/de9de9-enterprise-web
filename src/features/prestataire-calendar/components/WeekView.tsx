import { useEffect, useMemo, useRef } from 'react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { WEEKDAYS_AR, WEEKDAYS_FR } from '@/lib/dateLabels';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import type { Evenement } from '../schemas/calendar';
import { daysFrom, partsOf } from '../lib/days';
import { placeDay } from '../lib/placeDay';
import { eventStyle } from './eventStyle';

/** One hour, in pixels. */
const HOUR = 48;
/** Opens scrolled to the working day. */
const FIRST_VISIBLE_HOUR = 7;

/** « Semaine » — seven days by the hour, each event as a block with its crew. */
export function WeekView({
  weekStart,
  today,
  events,
  onOpen,
}: {
  weekStart: string;
  today: string;
  events: Evenement[];
  onOpen: (e: Evenement) => void;
}) {
  const L = useL();
  const days = daysFrom(weekStart, 7);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = FIRST_VISIBLE_HOUR * HOUR;
  }, [weekStart]);

  const placed = useMemo(() => {
    const map = new Map<string, Evenement[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return new Map([...map.entries()].map(([day, list]) => [day, placeDay(list)]));
  }, [events]);

  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] border-b border-border">
            <span />
            {days.map((day, i) => (
              <div key={day} className="flex flex-col items-center py-2">
                <span className="text-[10.5px] font-bold text-de9-gray">{L(WEEKDAYS_FR[i] ?? '', WEEKDAYS_AR[i] ?? '')}</span>
                <span
                  className={cn(
                    'mt-0.5 grid size-7 place-items-center rounded-full text-[13px] font-bold tabular-nums',
                    day === today ? 'bg-de9-teal text-primary-foreground' : 'text-de9-ink',
                  )}
                >
                  {partsOf(day).day}
                </span>
              </div>
            ))}
          </div>

          {/* The hours */}
          <div ref={scrollRef} className="max-h-[65vh] overflow-y-auto">
            <div className="relative grid grid-cols-[48px_repeat(7,minmax(0,1fr))]" style={{ height: 24 * HOUR }}>
              <div className="relative">
                {Array.from({ length: 24 }, (_, h) => (
                  <span
                    key={h}
                    className="absolute end-1.5 -translate-y-1/2 text-[10px] font-semibold text-de9-gray tabular-nums"
                    style={{ top: h * HOUR }}
                    dir="ltr"
                  >
                    {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                  </span>
                ))}
              </div>
              {days.map((day) => (
                <div key={day} className={cn('relative border-s border-border', day === today && 'bg-de9-teal-soft/20')}>
                  {Array.from({ length: 24 }, (_, h) => (
                    <span key={h} className="absolute inset-x-0 border-t border-border/70" style={{ top: h * HOUR }} />
                  ))}
                  {(placed.get(day) ?? []).map(({ e, start, end, lane, lanes }) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onOpen(e)}
                      title={e.titre}
                      style={{
                        ...eventStyle(e),
                        top: (start / 60) * HOUR,
                        height: ((end - start) / 60) * HOUR - 2,
                        insetInlineStart: `calc(${(lane / lanes) * 100}% + 2px)`,
                        width: `calc(${100 / lanes}% - 4px)`,
                      }}
                      className="absolute flex flex-col gap-0.5 overflow-hidden rounded-md border-s-[3px] px-1.5 py-1 text-start text-de9-ink shadow-soft hover:brightness-95"
                    >
                      <span className="text-[10.5px] font-bold tabular-nums" dir="ltr">
                        {e.heureLabel}
                        {e.heureFinLabel && ` – ${e.heureFinLabel}`}
                      </span>
                      <span className="line-clamp-2 text-[11.5px] leading-tight font-semibold">{e.service ?? e.titre}</span>
                      {e.equipe.length > 0 && (
                        <span className="mt-auto flex -space-x-1.5 rtl:space-x-reverse">
                          {e.equipe.slice(0, 3).map((p) => (
                            <WorkerAvatar
                              key={p.id}
                              worker={{ name: p.nom, initials: p.initiales ?? undefined, colorHex: p.couleur ?? undefined }}
                              size={18}
                              className="ring-1 ring-card"
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
