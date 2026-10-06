import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCw,
  TriangleAlert,
  User,
} from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { MONTHS_FR, MONTHS_AR, WEEKDAYS_AR } from '@/lib/dateLabels';
import { toProblem } from '@/api/problem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { tonePill } from '@/lib/tones';
import { useClientCalendrier } from '../api/useClientCalendar';
import type { CalendrierEvenement, CalendrierJour } from '../schemas/calendar';

/** Client calendar keeps title-case FR weekday chips (`Dim`), unlike the pro view's `DIM`. */
const WEEKDAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/** A visit's `statut` → the same meanings the « Suivi » screen colours by. */
const STATUT_TON: Record<string, string> = {
  en_attente: 'attention',
  a_confirmer: 'attention',
  a_venir: 'info',
  confirmee: 'valide',
  realisee: 'succes',
  terminee: 'neutre',
  annulee: 'neutre',
};

const pad = (n: number) => String(n).padStart(2, '0');
/** `YYYY-MM-DD` from local calendar parts — never through UTC, which can shift the day. */
const dayKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function monthRange(year: number, month: number) {
  const last = new Date(year, month + 1, 0).getDate();
  return { du: dayKey(year, month, 1), au: dayKey(year, month, last), days: last };
}

/**
 * « Calendrier » — the client's visits, month by month
 * (`GET /client/calendrier?du&au`). The grid marks each day from `jours`;
 * tapping a day narrows the list to it.
 */
export function ClientCalendrierPage() {
  const L = useL();
  const now = new Date();
  const today = dayKey(now.getFullYear(), now.getMonth(), now.getDate());
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const { du, au, days } = monthRange(cursor.year, cursor.month);
  const query = useClientCalendrier(du, au);
  const data = query.data;
  // The previous month may still be on screen while this one loads.
  const current = data?.du === du ? data : undefined;

  const jours = useMemo(() => {
    const map = new Map<string, CalendrierJour>();
    for (const jour of current?.jours ?? []) map.set(jour.date, jour);
    return map;
  }, [current]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendrierEvenement[]>();
    const sorted = [...(current?.evenements ?? [])].sort((a, b) =>
      (a.debut ?? a.date).localeCompare(b.debut ?? b.date),
    );
    for (const e of sorted) {
      if (selected && e.date !== selected) continue;
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return [...map.entries()];
  }, [current, selected]);

  const shiftMonth = (delta: number) => {
    setSelected(null);
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };
  const goToday = () => {
    setSelected(null);
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
  };

  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const monthTotal = (current?.jours ?? []).reduce((sum, jour) => sum + jour.total, 0);
  const monthLabel = `${L(MONTHS_FR[cursor.month] ?? '', MONTHS_AR[cursor.month] ?? '')} ${cursor.year}`;

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-black text-de9-ink">{L('Calendrier', 'التقويم')}</h1>
        <p className="mt-0.5 text-[13px] text-de9-gray">{L('Vos interventions planifiées', 'تدخلاتك المبرمجة')}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        {/* Month grid — a compact card, sticky beside the list on wide screens */}
        <Card className="lg:sticky lg:top-24">
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => shiftMonth(-1)}
                aria-label={L('Mois précédent', 'الشهر السابق')}
              >
                <ChevronLeft className="size-5 rtl:rotate-180" />
              </Button>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-de9-ink">{monthLabel}</h2>
                {query.isFetching && <span className="size-1.5 animate-pulse rounded-full bg-de9-teal" aria-hidden />}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => shiftMonth(1)}
                aria-label={L('Mois suivant', 'الشهر التالي')}
              >
                <ChevronRight className="size-5 rtl:rotate-180" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS_FR.map((wd, i) => (
                <span key={wd} className="py-1 text-[11px] font-bold text-de9-gray">
                  {L(wd, WEEKDAYS_AR[i] ?? wd)}
                </span>
              ))}
              {Array.from({ length: firstWeekday }, (_, i) => (
                <span key={`pad-${i}`} aria-hidden />
              ))}
              {Array.from({ length: days }, (_, i) => {
                const key = dayKey(cursor.year, cursor.month, i + 1);
                const jour = jours.get(key);
                const count = jour?.total ?? 0;
                const isSelected = selected === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={
                      count > 0 ? L(`${i + 1} — ${count} intervention(s)`, `${i + 1} — ${count} تدخل`) : `${i + 1}`
                    }
                    onClick={() => setSelected(isSelected ? null : key)}
                    className={cn(
                      'flex h-10 flex-col items-center justify-center rounded-lg text-[13px] font-semibold transition-colors',
                      isSelected
                        ? 'bg-de9-teal text-primary-foreground'
                        : count > 0
                          ? 'bg-de9-teal-soft text-de9-teal-dark hover:bg-de9-teal-soft/70'
                          : 'text-de9-ink hover:bg-secondary',
                      key === today && !isSelected && 'ring-2 ring-de9-teal/60',
                    )}
                  >
                    <span className="tabular-nums">{i + 1}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          'text-[10px] font-bold leading-none',
                          isSelected ? 'text-white/90' : 'text-de9-teal-dark',
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* An empty month is already said by the list's empty state. */}
            {monthTotal > 0 && (
              <p className="text-center text-[12.5px] text-de9-gray">
                {L(`${monthTotal} intervention(s) ce mois-ci`, `${monthTotal} تدخل هذا الشهر`)}
              </p>
            )}

            <div className="flex items-center justify-between gap-2">
              {selected ? (
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-[12.5px] font-semibold text-de9-teal-dark hover:underline"
                >
                  {L('Voir tout le mois', 'عرض كل الشهر')}
                </button>
              ) : (
                <span />
              )}
              <Button variant="outline" size="sm" onClick={goToday}>
                {L("Aujourd'hui", 'اليوم')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-5">
          {/* The answer was cut short: fewer visits listed than there are. */}
          {current?.tronque && !selected && (
            <p className="flex items-start gap-2 rounded-lg bg-de9-orange/15 px-3.5 py-3 text-[13px] text-de9-orange-deep">
              <TriangleAlert className="mt-0.5 size-4 flex-none" />
              {L(
                'Toutes les interventions du mois ne sont pas listées : touchez un jour pour voir les siennes.',
                'لم تُعرض كل تدخلات الشهر: اضغط على يوم لعرض تدخلاته.',
              )}
            </p>
          )}

          {query.isPending && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-secondary" />
              ))}
            </div>
          )}

          {query.isError && !current && (
            <EmptyState
              title={L('Impossible de charger le calendrier', 'تعذّر تحميل التقويم')}
              description={
                toProblem(query.error).code === 'company_not_client'
                  ? L("L'espace client n'est pas activé pour votre entreprise.", 'مساحة العميل غير مفعّلة لشركتك.')
                  : L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.')
              }
              action={
                <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                  {L('Réessayer', 'إعادة المحاولة')}
                </Button>
              }
            />
          )}

          {current && byDay.length === 0 && (
            <EmptyState
              title={
                selected
                  ? L('Aucune intervention ce jour-là', 'لا توجد تدخلات في هذا اليوم')
                  : L('Aucune intervention ce mois-ci', 'لا توجد تدخلات هذا الشهر')
              }
              description={L('Vos prochaines interventions apparaîtront ici.', 'ستظهر تدخلاتك القادمة هنا.')}
              icon={<CalendarDays className="size-6" />}
            />
          )}

          {byDay.map(([date, events]) => (
            <section key={date} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-de9-gray">{events[0]?.jourLabel ?? date}</h3>
              {events.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function EventCard({ e }: { e: CalendrierEvenement }) {
  const L = useL();
  return (
    <Card>
      <CardContent className="flex items-start gap-4 py-4">
        <div className="flex w-14 flex-none flex-col items-center gap-1">
          <span aria-hidden className="grid size-12 place-items-center rounded-[14px] bg-secondary text-[22px]">
            {e.icone ?? '🧰'}
          </span>
          {e.heureLabel && (
            <span className="flex items-center gap-1 text-[12px] font-bold tabular-nums text-de9-ink" dir="ltr">
              <Clock className="size-3" />
              {e.heureLabel}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            {e.statutLabel && (
              <span
                className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', tonePill(STATUT_TON[e.statut ?? '']))}
              >
                {e.statutLabel}
              </span>
            )}
            {e.occurrence?.label && (
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-de9-slate">
                {e.recurrent && <RefreshCw className="size-3" />}
                {e.occurrence.label}
              </span>
            )}
          </div>
          <p className="text-[14px] font-bold break-words text-de9-ink">{e.titre}</p>
          {(e.service || e.categorie) && <p className="text-[12.5px] text-de9-gray">{e.service ?? e.categorie}</p>}
          {e.prestataire && (
            <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-de9-slate">
              <User className="size-3.5 flex-none text-de9-teal" />
              {e.prestataire}
            </p>
          )}
          {e.adresse && (
            <p className="mt-0.5 flex items-start gap-1.5 text-[12.5px] text-de9-slate">
              <MapPin className="mt-0.5 size-3.5 flex-none text-de9-teal" />
              {e.adresse}
            </p>
          )}
          {e.equipe.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {e.equipe.slice(0, 4).map((m) => (
                  <span
                    key={m.id ?? m.nom}
                    title={m.nom}
                    className="grid size-7 place-items-center rounded-full bg-de9-blue text-[10px] font-bold text-white ring-2 ring-card"
                  >
                    {m.initiales ?? m.nom.slice(0, 2).toUpperCase()}
                  </span>
                ))}
              </div>
              <span className="text-[12px] text-de9-gray">
                {e.equipe.length === 1
                  ? e.equipe[0]?.nom
                  : L(`${e.equipe.length} intervenants`, `${e.equipe.length} متدخلين`)}
              </span>
            </div>
          )}
          {e.commandeReference && (
            <p className="mt-2 text-[11.5px] text-de9-gray" dir="ltr">
              {e.commandeReference}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
