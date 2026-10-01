import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, TriangleAlert, X } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { MONTHS_AR, MONTHS_FR } from '@/lib/dateLabels';
import { toProblem } from '@/api/problem';
import { proLoadError } from '@/lib/proErrors';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { useCalendrier } from '../api/calendar';
import type { Evenement } from '../schemas/calendar';
import { addDays, algiersToday, isDayKey, monthEnd, monthStart, partsOf, weekStart } from '../lib/days';
import { EventDialog } from './EventDialog';
import { MonthView } from './MonthView';
import { PlanningList } from './PlanningList';
import { WeekView } from './WeekView';

type Vue = 'mois' | 'semaine' | 'planning';
const VUES: { code: Vue; fr: string; ar: string }[] = [
  { code: 'mois', fr: 'Mois', ar: 'شهر' },
  { code: 'semaine', fr: 'Semaine', ar: 'أسبوع' },
  { code: 'planning', fr: 'Planning', ar: 'جدول' },
];

/** The window a view asks for: six weeks, one week, or the month. */
function windowOf(vue: Vue, cursor: string): { du: string; au: string } {
  if (vue === 'semaine') {
    const du = weekStart(cursor);
    return { du, au: addDays(du, 6) };
  }
  if (vue === 'planning') return { du: monthStart(cursor), au: monthEnd(cursor) };
  const du = weekStart(monthStart(cursor));
  return { du, au: addDays(du, 41) };
}

/**
 * « Calendrier » — the company's B2B visits and B2C bookings, Google-Calendar
 * style (guide 14): one call per visible window, the source pills and the
 * « Filtrer par salarié » chips combined. The view, day and filters live in the
 * address, so coming back from a mission restores the same window.
 */
export function CalendarPage() {
  const L = useL();
  const [today] = useState(algiersToday);
  const [params, setParams] = useSearchParams();
  const vue: Vue = (['mois', 'semaine', 'planning'] as const).find((v) => v === params.get('vue')) ?? 'mois';
  const dateParam = params.get('date');
  const cursor = isDayKey(dateParam) ? dateParam : today;
  const source = params.get('source') ?? 'tous';
  const salarieId = params.get('salarie');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [opened, setOpened] = useState<Evenement | null>(null);

  const { du, au } = windowOf(vue, cursor);
  const query = useCalendrier({ du, au, source, salarieId });
  // The previous window may still be on screen while this one loads.
  const data = query.data;
  const current = data?.du === du && data.au === au;

  const update = (patch: Record<string, string | null>) =>
    setParams(
      (p) => {
        for (const [key, value] of Object.entries(patch)) {
          if (value == null) p.delete(key);
          else p.set(key, value);
        }
        return p;
      },
      { replace: true },
    );

  const move = (delta: number) => {
    setSelectedDay(null);
    update({ date: vue === 'semaine' ? addDays(cursor, 7 * delta) : monthStart(cursor, delta) });
  };

  const { year, month } = partsOf(vue === 'mois' ? monthStart(cursor) : cursor);
  const monthName = (m: number) => L(MONTHS_FR[m] ?? '', MONTHS_AR[m] ?? '');
  const title =
    vue === 'semaine'
      ? (() => {
          const a = partsOf(du);
          const b = partsOf(au);
          return a.month === b.month
            ? `${a.day} – ${b.day} ${monthName(b.month)} ${b.year}`
            : `${a.day} ${monthName(a.month)} – ${b.day} ${monthName(b.month)} ${b.year}`;
        })()
      : `${monthName(month)} ${year}`;

  const events = data?.evenements ?? [];
  const dayEvents = selectedDay ? events.filter((e) => e.date === selectedDay) : [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header>
        <h1 className="text-[22px] font-black text-de9-ink">{L('Calendrier', 'التقويم')}</h1>
      </header>

      {/* Toolbar — Aujourd'hui · ‹ › · the period · Mois / Semaine / Planning */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedDay(null);
              update({ date: null });
            }}
          >
            {L("Aujourd'hui", 'اليوم')}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => move(-1)} aria-label={L('Précédent', 'السابق')}>
            <ChevronLeft className="size-5 rtl:rotate-180" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => move(1)} aria-label={L('Suivant', 'التالي')}>
            <ChevronRight className="size-5 rtl:rotate-180" />
          </Button>
          <h2 className="text-[16px] font-bold text-de9-ink">{title}</h2>
          {query.isFetching && <span className="size-1.5 animate-pulse rounded-full bg-de9-teal" aria-hidden />}
        </div>
        <div role="tablist" className="inline-flex rounded-full bg-secondary p-1">
          {VUES.map((v) => (
            <button
              key={v.code}
              type="button"
              role="tab"
              aria-selected={vue === v.code}
              onClick={() => {
                setSelectedDay(null);
                update({ vue: v.code === 'mois' ? null : v.code });
              }}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors',
                vue === v.code ? 'bg-card text-de9-ink shadow-soft' : 'text-de9-gray hover:text-de9-ink',
              )}
            >
              {L(v.fr, v.ar)}
            </button>
          ))}
        </div>
      </div>

      {/* Filters — Tous · B2B · B2C, and « Filtrer par salarié » */}
      {data && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {data.sources.map((s) => (
              <button
                key={s.code}
                type="button"
                aria-pressed={source === s.code}
                onClick={() => update({ source: s.code === 'tous' ? null : s.code })}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-all',
                  source === s.code
                    ? 'bg-de9-teal text-white shadow-glow'
                    : 'bg-card text-de9-teal-dark shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border',
                )}
              >
                {s.label}
                <span className="tabular-nums opacity-80">{s.count}</span>
              </button>
            ))}
          </div>
          {data.salaries.length > 0 && (
            <div>
              <p className="mb-1.5 text-[12px] font-bold text-de9-gray">{L('Filtrer par salarié', 'تصفية حسب الموظف')}</p>
              <div className="flex flex-wrap gap-2">
                {data.salaries.map((p) => {
                  const active = salarieId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => update({ salarie: active ? null : p.id })}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full py-1 ps-1 pe-3 text-[12.5px] font-semibold transition-all',
                        active
                          ? 'bg-de9-teal text-white shadow-glow'
                          : 'bg-card text-de9-ink shadow-soft hover:shadow-lift dark:ring-1 dark:ring-border',
                      )}
                    >
                      <WorkerAvatar
                        worker={{ name: p.nom, initials: p.initiales ?? undefined, colorHex: p.couleur ?? undefined }}
                        size={22}
                      />
                      {p.nom}
                      {active && <X className="size-3.5" aria-label={L('Retirer le filtre', 'إزالة التصفية')} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {data?.tronque && (
        <p className="flex items-start gap-2 rounded-lg bg-de9-orange/15 px-3.5 py-3 text-[13px] text-de9-orange-deep">
          <TriangleAlert className="mt-0.5 size-4 flex-none" />
          {L(
            'Trop d’interventions sur cette période : seules les premières sont affichées. Passez en vue Semaine pour toutes les voir.',
            'تدخلات كثيرة في هذه الفترة: تُعرض الأولى فقط. انتقل إلى عرض الأسبوع لرؤيتها كلها.',
          )}
        </p>
      )}

      {query.isError && !data ? (
        <EmptyState
          title={L('Impossible de charger le calendrier', 'تعذّر تحميل التقويم')}
          description={proLoadError(toProblem(query.error), L)}
          action={
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              {L('Réessayer', 'إعادة المحاولة')}
            </Button>
          }
        />
      ) : (
        <div className={cn('flex flex-col gap-5 transition-opacity', !current && 'opacity-60')}>
          {vue === 'mois' && (
            <>
              <MonthView
                gridStart={du}
                month={month}
                today={today}
                data={data}
                selected={selectedDay}
                onSelectDay={setSelectedDay}
                onOpen={setOpened}
              />
              {selectedDay &&
                (dayEvents.length > 0 ? (
                  <PlanningList events={dayEvents} onOpen={setOpened} />
                ) : (
                  <EmptyState
                    title={L('Aucune intervention ce jour-là', 'لا توجد تدخلات في هذا اليوم')}
                    icon={<CalendarDays className="size-6" />}
                  />
                ))}
            </>
          )}
          {vue === 'semaine' && <WeekView weekStart={du} today={today} events={events} onOpen={setOpened} />}
          {vue === 'planning' &&
            (query.isPending ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-lg bg-secondary" />
                ))}
              </div>
            ) : events.length > 0 ? (
              <PlanningList events={events} onOpen={setOpened} />
            ) : (
              <EmptyState
                title={L('Aucune intervention sur cette période', 'لا توجد تدخلات في هذه الفترة')}
                icon={<CalendarDays className="size-6" />}
              />
            ))}
        </div>
      )}

      {opened && <EventDialog e={opened} onClose={() => setOpened(null)} />}
    </div>
  );
}
