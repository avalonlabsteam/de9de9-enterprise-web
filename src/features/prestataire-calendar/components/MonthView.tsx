import { useMemo } from 'react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { WEEKDAYS_AR, WEEKDAYS_FR } from '@/lib/dateLabels';
import type { Calendrier, Evenement } from '../schemas/calendar';
import { daysFrom, partsOf } from '../lib/days';
import { eventStyle } from './eventStyle';

const CHIPS_PER_DAY = 3;

/**
 * « Mois » — the six visible weeks (42 days, the window asked for). Wide
 * screens show each day's first events as chips and « +N »; narrow ones a dot
 * per source. A day opens its list below the grid.
 */
export function MonthView({
  gridStart,
  month,
  today,
  data,
  selected,
  onSelectDay,
  onOpen,
}: {
  /** The Sunday the grid starts on. */
  gridStart: string;
  /** The month shown (0-based) — the other days are muted. */
  month: number;
  today: string;
  data?: Calendrier;
  selected: string | null;
  onSelectDay: (day: string | null) => void;
  onOpen: (e: Evenement) => void;
}) {
  const L = useL();
  const days = daysFrom(gridStart, 42);

  const byDay = useMemo(() => {
    const map = new Map<string, Evenement[]>();
    for (const e of data?.evenements ?? []) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [data]);

  const jours = useMemo(() => new Map((data?.jours ?? []).map((j) => [j.date, j])), [data]);

  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS_FR.map((wd, i) => (
          <span key={wd} className="py-2 text-center text-[10.5px] font-bold text-de9-gray">
            {L(wd, WEEKDAYS_AR[i] ?? wd)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const { day: n, month: m } = partsOf(day);
          const events = byDay.get(day) ?? [];
          const jour = jours.get(day);
          const total = jour?.total ?? events.length;
          const extra = total - Math.min(events.length, CHIPS_PER_DAY);
          const isSelected = selected === day;
          return (
            <div
              key={day}
              onClick={() => onSelectDay(isSelected ? null : day)}
              className={cn(
                'flex min-h-16 cursor-pointer flex-col gap-1 border-border p-1 transition-colors md:min-h-28',
                i % 7 !== 6 && 'border-e',
                i < 35 && 'border-b',
                m !== month && 'bg-secondary/40',
                isSelected ? 'bg-de9-teal-soft/60' : 'hover:bg-secondary/50',
              )}
            >
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={total > 0 ? L(`${n} — ${total} intervention(s)`, `${n} — ${total} تدخل`) : `${n}`}
                onClick={(ev) => {
                  ev.stopPropagation();
                  onSelectDay(isSelected ? null : day);
                }}
                className={cn(
                  'grid size-7 place-items-center self-center rounded-full text-[12.5px] font-semibold tabular-nums md:self-start',
                  day === today
                    ? 'bg-de9-teal text-primary-foreground'
                    : m !== month
                      ? 'text-de9-gray'
                      : 'text-de9-ink',
                )}
              >
                {n}
              </button>

              {/* Narrow screens: a dot per source */}
              {jour && (
                <span className="flex justify-center gap-1 md:hidden" aria-hidden>
                  {jour.b2b > 0 && <span className="size-1.5 rounded-full bg-[#5A6472]" />}
                  {jour.b2c > 0 && <span className="size-1.5 rounded-full bg-[#46B3AA]" />}
                </span>
              )}

              {/* Wide screens: the first events as chips */}
              <div className="hidden flex-col gap-0.5 md:flex">
                {events.slice(0, CHIPS_PER_DAY).map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onOpen(e);
                    }}
                    style={eventStyle(e)}
                    className="flex items-center gap-1 truncate rounded border-s-[3px] px-1 py-0.5 text-start text-[11px] leading-tight text-de9-ink hover:brightness-95"
                    title={e.titre}
                  >
                    {e.heureLabel && <span className="flex-none font-bold tabular-nums">{e.heureLabel}</span>}
                    <span className="truncate">{e.service ?? e.titre}</span>
                  </button>
                ))}
                {extra > 0 && (
                  <span className="px-1 text-[11px] font-bold text-de9-teal-dark">+{extra}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
