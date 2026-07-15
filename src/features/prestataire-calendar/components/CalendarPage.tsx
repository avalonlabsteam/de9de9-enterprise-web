import { useMemo, useState } from 'react';
import { CalendarDays, HelpCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { uiActions } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useCalendar, useCalendarWorkers } from '../api/calendar';
import type { CalendarEvent } from '../schemas/calendar';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const WEEKDAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const WEEKDAYS_AR = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

type SourceFilter = 'all' | 'b2c' | 'b2b';

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** The Sunday→Saturday week containing the earliest event (fallback: today). */
function weekDaysFor(events: CalendarEvent[]): Date[] {
  const base = events.length
    ? new Date([...events].sort((a, b) => a.start.localeCompare(b.start))[0]!.start)
    : new Date();
  const sunday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i));
}

export function CalendarPage() {
  const L = useL();
  const { data, isPending, isError } = useCalendar();
  const { data: workers } = useCalendarWorkers();

  const [source, setSource] = useState<SourceFilter>('all');
  const [workerId, setWorkerId] = useState<string | 'all'>('all');
  const [dayFilter, setDayFilter] = useState<string | null>(null);

  const events = data ?? [];
  const week = useMemo(() => weekDaysFor(events), [events]);
  const monthRef = week[0] ?? new Date();
  const eventDayKeys = useMemo(() => new Set(events.map((e) => dayKey(new Date(e.start)))), [events]);
  const activeWorkers = (workers ?? []).filter((w) => w.status === 'active');
  const workerOf = (id?: string) => activeWorkers.find((w) => w.id === id) ?? workers?.find((w) => w.id === id);

  const filtered = useMemo(() => {
    return events
      .filter((e) => (source === 'all' ? true : e.source === source))
      .filter((e) => (workerId === 'all' ? true : e.assignedWorkerId === workerId))
      .filter((e) => (dayFilter === null ? true : dayKey(new Date(e.start)) === dayFilter))
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [events, source, workerId, dayFilter]);

  const sourcePills: { key: SourceFilter; label: string }[] = [
    { key: 'all', label: L('Tous', 'الكل') },
    { key: 'b2c', label: 'B2C' },
    { key: 'b2b', label: 'B2B' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black text-de9-ink">{L('Calendrier', 'التقويم')}</h1>
          <p className="mt-0.5 text-[13px] font-semibold text-de9-gray">
            {L(MONTHS_FR[monthRef.getMonth()] ?? '', MONTHS_AR[monthRef.getMonth()] ?? '')} {monthRef.getFullYear()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => uiActions.openSupport()}>
          <HelpCircle className="size-4" />
          {L('Aide', 'مساعدة')}
        </Button>
      </header>

      {/* week strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {week.map((d) => {
          const key = dayKey(d);
          const selected = dayFilter === key;
          const has = eventDayKeys.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setDayFilter(selected ? null : key)}
              className={cn(
                'flex min-w-[52px] flex-none flex-col items-center gap-0.5 rounded-2xl border px-2 py-2 transition-colors',
                selected
                  ? 'border-de9-teal bg-de9-teal text-white'
                  : 'border-de9-line bg-card text-de9-slate hover:bg-de9-row',
              )}
            >
              <span className="text-[11px] font-bold">
                {L(WEEKDAYS_FR[d.getDay()] ?? '', WEEKDAYS_AR[d.getDay()] ?? '')}
              </span>
              <span className="text-[17px] font-black leading-none tabular-nums">{d.getDate()}</span>
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  has ? (selected ? 'bg-white' : 'bg-de9-teal') : 'bg-transparent',
                )}
              />
            </button>
          );
        })}
      </div>

      {/* source pills */}
      <div className="inline-flex w-fit rounded-full border border-de9-line bg-secondary p-1">
        {sourcePills.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setSource(p.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors',
              source === p.key ? 'bg-card text-de9-ink shadow-sm' : 'text-de9-gray',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* employee filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setWorkerId('all')}
          className={cn(
            'rounded-full border px-3 py-1.5 text-[13px] font-bold transition-colors',
            workerId === 'all'
              ? 'border-de9-teal bg-de9-teal text-white'
              : 'border-de9-line bg-card text-de9-gray hover:text-de9-ink',
          )}
        >
          {L('Tous', 'الكل')}
        </button>
        {activeWorkers.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setWorkerId(w.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border py-1 ps-1 pe-3 text-[13px] font-bold transition-colors',
              workerId === w.id
                ? 'border-de9-teal bg-de9-teal text-white'
                : 'border-de9-line bg-card text-de9-slate hover:bg-de9-row',
            )}
          >
            <WorkerAvatar worker={{ name: w.name, colorHex: w.colorHex }} size={22} />
            {w.name}
          </button>
        ))}
      </div>

      {/* timeline */}
      {isPending && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          title={L('Impossible de charger le calendrier', 'تعذّر تحميل التقويم')}
          description={L('Réessayez plus tard.', 'أعد المحاولة لاحقًا.')}
        />
      )}

      {data && filtered.length === 0 && (
        <EmptyState
          title={L('Aucune intervention', 'لا يوجد تدخل')}
          description={L('Ajustez les filtres pour voir les interventions.', 'عدّل عوامل التصفية لعرض التدخلات.')}
          icon={<CalendarDays className="size-6" />}
        />
      )}

      {data && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((e) => {
            const w = workerOf(e.assignedWorkerId);
            return (
              <Card key={e.id}>
                <CardContent className="flex items-center gap-4">
                  <div className="flex w-14 flex-none flex-col items-center text-de9-slate">
                    <span className="text-[15px] font-black tabular-nums">{timeLabel(e.start)}</span>
                    <span className="text-[11px] text-de9-gray">{new Date(e.start).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1">
                      <StatusBadge label={e.source === 'b2c' ? 'B2C' : 'B2B'} kind={e.source === 'b2c' ? 'info' : 'setup'} />
                    </div>
                    <p className="truncate text-[14px] font-bold text-de9-ink">{e.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-de9-gray">
                      <MapPin className="size-3.5" />
                      {e.wilaya}
                    </p>
                  </div>
                  {w && (
                    <span
                      className="inline-flex flex-none items-center gap-2 rounded-full border border-de9-line bg-secondary py-1 ps-1 pe-3 text-[12px] font-bold text-de9-ink"
                    >
                      <WorkerAvatar worker={{ name: w.name, colorHex: w.colorHex }} size={22} />
                      {w.name}
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
