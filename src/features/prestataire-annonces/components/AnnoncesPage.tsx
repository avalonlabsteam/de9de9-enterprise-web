import { useMemo, useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT, useL } from '@/lib/i18n';
import { toProblem } from '@/api/problem';
import { proLoadError } from '@/lib/proErrors';
import { personColour } from '@/lib/personColour';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { TonePill } from '@/components/actions/parts';
import { useTeam } from '@/features/prestataire-equipe/api/workers';
import { useCalendrier } from '@/features/prestataire-calendar/api/calendar';
import { addDays, algiersToday } from '@/features/prestataire-calendar/lib/days';
import type { Evenement } from '@/features/prestataire-calendar/schemas/calendar';
import { AnnoncesListe } from './AnnoncesListe';

/* ------------------------------- Missions des pros ------------------------------- */

/** One call covers it: the API takes at most 93 days per window. */
const DAYS_EACH_SIDE = 46;

function MissionList({ title, missions }: { title: string; missions: Evenement[] }) {
  if (missions.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] font-semibold text-de9-gray">{title}</p>
      {missions.map((m) => (
        <div key={m.id} className="flex items-center gap-3 rounded-lg bg-de9-row px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-de9-ink">{m.titre}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-de9-gray">
              <MapPin className="size-3.5 flex-none text-de9-teal" />
              <span className="truncate">{[m.lieu, m.jourLabel ?? m.date, m.heureLabel].filter(Boolean).join(' · ')}</span>
            </p>
          </div>
          {m.statutLabel && <TonePill tag={{ label: m.statutLabel, ton: m.ton }} className="flex-none" />}
        </div>
      ))}
    </div>
  );
}

/**
 * « Missions des pros » — the team (guide 15) and what each member is staffed
 * on (guide 14's calendar, read once for a window around today).
 */
function MissionsProsTab() {
  const L = useL();
  const team = useTeam();
  const today = algiersToday();
  // B2B only: the calendar's B2C column still reads the manual inbox, not the de9de9 app's jobs (blocker B24).
  const calendrier = useCalendrier({
    du: addDays(today, -DAYS_EACH_SIDE),
    au: addDays(today, DAYS_EACH_SIDE),
    source: 'b2b',
  });
  const [openId, setOpenId] = useState<string | null>(null);

  const byMember = useMemo(() => {
    const map = new Map<string, Evenement[]>();
    for (const event of calendrier.data?.evenements ?? []) {
      for (const person of event.equipe) {
        const list = map.get(person.id) ?? [];
        list.push(event);
        map.set(person.id, list);
      }
    }
    return map;
  }, [calendrier.data]);

  if (team.isPending) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
    );
  }
  if (team.isError) {
    return (
      <EmptyState
        title={L("Impossible de charger l'équipe", 'تعذّر تحميل الفريق')}
        description={proLoadError(toProblem(team.error), L)}
        action={
          <Button variant="outline" size="sm" onClick={() => void team.refetch()}>
            {L('Réessayer', 'إعادة المحاولة')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-de9-gray">
        {L(
          'Missions B2B de chaque membre, sur les 6 semaines passées et à venir. Les prestations B2C prises sur l’app de9de9 n’y figurent pas encore.',
          'مهام B2B لكل عضو، خلال الأسابيع الستة الماضية والقادمة. خدمات B2C المأخوذة عبر تطبيق de9de9 لا تظهر هنا بعد.',
        )}
      </p>
      {calendrier.isError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
          {L('Les missions n’ont pas pu être chargées.', 'تعذّر تحميل المهام.')}{' '}
          <button type="button" className="cursor-pointer font-bold underline" onClick={() => void calendrier.refetch()}>
            {L('Réessayer', 'إعادة المحاولة')}
          </button>
        </p>
      )}

      {team.data.length === 0 ? (
        <EmptyState title={L('Aucun membre dans votre équipe', 'لا يوجد عضو في فريقك')} />
      ) : (
        <div className="flex flex-col gap-2">
          {team.data.map((member) => {
            const list = (byMember.get(member.id) ?? [])
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date) || (a.heureLabel ?? '').localeCompare(b.heureLabel ?? ''));
            const upcoming = list.filter((m) => m.date >= today);
            const past = list.filter((m) => m.date < today).reverse();
            const open = openId === member.id;
            return (
              <div key={member.id} className="overflow-hidden rounded-lg bg-card shadow-soft dark:ring-1 dark:ring-border">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : member.id)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-de9-row"
                  aria-expanded={open}
                >
                  <WorkerAvatar worker={{ name: member.fullName, colorHex: personColour(member.id) }} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-de9-ink">{member.fullName}</p>
                    {member.skill && <p className="truncate text-[12px] text-de9-gray">{member.skill}</p>}
                  </div>
                  <span className="flex-none text-[12px] font-bold text-de9-gray tabular-nums">
                    {calendrier.isPending ? '…' : list.length}
                  </span>
                  <ChevronDown className={cn('size-5 flex-none text-de9-gray transition-transform', open && 'rotate-180')} />
                </button>
                {open && (
                  <div className="border-t border-de9-line px-4 py-3">
                    {list.length === 0 ? (
                      <p className="py-2 text-center text-[13px] text-de9-gray">
                        {calendrier.isPending
                          ? L('Chargement…', 'جارٍ التحميل…')
                          : L('Aucune mission sur cette période', 'لا توجد مهمة في هذه الفترة')}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <MissionList title={L('Missions à venir', 'المهام القادمة')} missions={upcoming} />
                        <MissionList title={L('Missions passées', 'المهام السابقة')} missions={past} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {calendrier.data?.tronque && (
        <p className="text-[12px] text-de9-gray">
          {L('Liste partielle : trop de missions sur la période.', 'قائمة جزئية: عدد كبير من المهام في هذه الفترة.')}
        </p>
      )}
    </div>
  );
}

/* ------------------------------- Page ------------------------------- */

export function AnnoncesPage() {
  const t = useT();
  const L = useL();
  const [tab, setTab] = useState('mes');

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-black text-de9-ink">{L('Annonces', 'الإعلانات')}</h1>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="mes">{t('mesAnnonces')}</TabsTrigger>
          <TabsTrigger value="pros">{L('Missions des pros', 'مهام المحترفين')}</TabsTrigger>
        </TabsList>

        <TabsContent value="mes">
          <AnnoncesListe />
        </TabsContent>
        <TabsContent value="pros">
          <MissionsProsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
