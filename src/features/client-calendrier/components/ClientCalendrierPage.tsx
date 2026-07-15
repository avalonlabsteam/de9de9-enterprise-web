import { useNavigate } from 'react-router-dom';
import { HelpCircle, MapPin, ChevronRight, CalendarDays } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { uiActions } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useClientCalendar } from '../api/useClientCalendar';
import type { ClientEvent } from '../schemas/calendar';

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

interface MonthGroup {
  key: string;
  year: number;
  month: number;
  events: ClientEvent[];
}

/**
 * Parse a date-only 'YYYY-MM-DD' as LOCAL midnight. `new Date('YYYY-MM-DD')`
 * parses as UTC, which shifts the day/weekday by one in UTC-negative timezones.
 */
function parseLocalDate(date: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(date);
}

function groupByMonth(events: ClientEvent[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();
  for (const e of [...events].sort((a, b) => a.date.localeCompare(b.date))) {
    const d = parseLocalDate(e.date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${month}`;
    let g = map.get(key);
    if (!g) {
      g = { key, year, month, events: [] };
      map.set(key, g);
    }
    g.events.push(e);
  }
  return [...map.values()];
}

export function ClientCalendrierPage() {
  const L = useL();
  const navigate = useNavigate();
  const { data, isPending, isError } = useClientCalendar();

  const months = data ? groupByMonth(data) : [];

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black text-de9-ink">{L('Calendrier', 'التقويم')}</h1>
          <p className="mt-0.5 text-[13px] text-de9-gray">{L('Vos prestations confirmées', 'خدماتك المؤكدة')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => uiActions.openSupport()}>
          <HelpCircle className="size-4" />
          {L('Aide', 'مساعدة')}
        </Button>
      </header>

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

      {data && months.length === 0 && (
        <EmptyState
          title={L('Aucune prestation confirmée', 'لا توجد خدمات مؤكدة')}
          description={L('Vos prochaines interventions apparaîtront ici.', 'ستظهر مواعيدك القادمة هنا.')}
          icon={<CalendarDays className="size-6" />}
        />
      )}

      {data &&
        months.map((g) => (
          <section key={g.key} className="flex flex-col gap-3">
            <h2 className="text-[15px] font-black text-de9-slate">
              {L(MONTHS_FR[g.month] ?? '', MONTHS_AR[g.month] ?? '')} {g.year}
            </h2>
            <div className="flex flex-col gap-3">
              {g.events.map((e) => {
                const d = parseLocalDate(e.date);
                return (
                  <Card
                    key={e.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/client/tender/' + e.tenderId)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        navigate('/client/tender/' + e.tenderId);
                      }
                    }}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <CardContent className="flex items-center gap-4">
                      <div className="flex size-14 flex-none flex-col items-center justify-center rounded-xl bg-[#E9F6F5] text-de9-teal-dark dark:bg-[#14322E]">
                        <span className="text-[20px] font-black leading-none tabular-nums">{d.getDate()}</span>
                        <span className="text-[11px] font-bold">
                          {L(WEEKDAYS_FR[d.getDay()] ?? '', WEEKDAYS_AR[d.getDay()] ?? '')}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5">
                          <StatusBadge label={L('Confirmé', 'مؤكد')} kind="done" />
                        </div>
                        <p className="truncate text-[14px] font-bold text-de9-ink">{e.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[12px] text-de9-gray">
                          <MapPin className="size-3.5" />
                          {e.wilaya}
                        </p>
                      </div>
                      <ChevronRight className="size-5 flex-none text-de9-gray rtl:rotate-180" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}
