import { useMemo, useState } from 'react';
import { ChevronDown, MapPin, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT, useL } from '@/lib/i18n';
import { toProblem } from '@/api/problem';
import { proLoadError } from '@/lib/proErrors';
import { personColour } from '@/lib/personColour';
import { uiActions } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { TonePill } from '@/components/actions/parts';
import type { AnnonceCard } from '@/features/auth/schemas/accueil';
import { usePrestataireAccueil } from '@/features/prestataire-dashboard/api/dashboard';
import { useTeam } from '@/features/prestataire-equipe/api/workers';
import { useCalendrier } from '@/features/prestataire-calendar/api/calendar';
import { addDays, algiersToday } from '@/features/prestataire-calendar/lib/days';
import type { Evenement } from '@/features/prestataire-calendar/schemas/calendar';

/* ------------------------------- Mes annonces ------------------------------- */

function AnnonceTile({ annonce }: { annonce: AnnonceCard }) {
  const L = useL();
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <span className="grid size-11 flex-none place-items-center rounded-full bg-secondary text-[20px]">
          {annonce.icone ?? '🧰'}
        </span>
        <div className="min-w-0 flex-1">
          {annonce.categorie && <p className="truncate text-xs font-semibold text-de9-teal">{annonce.categorie}</p>}
          <p className="text-[15px] font-bold break-words text-de9-ink">{annonce.service}</p>
          <p className="mt-0.5 text-[13px] text-de9-slate">{annonce.prixLabel ?? L('Sur devis', 'حسب عرض السعر')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {annonce.canaux.map((canal) => (
              <span
                key={canal}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                  canal === 'B2C' ? 'bg-de9-blue-tint text-de9-blue' : 'bg-accent text-de9-teal-dark',
                )}
              >
                {canal === 'B2C' ? L('B2C · app de9de9', 'B2C · تطبيق de9de9') : canal}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * « Mes annonces » — the services on the company's directory card, which is
 * also what Entreprise publishes for it on the de9de9 app (guide 16b §11-12).
 * Read-only: the card is edited by de9de9, there is no company route to write it.
 */
function MesAnnoncesTab() {
  const L = useL();
  const accueil = usePrestataireAccueil();
  const annonces = accueil?.annonces ?? [];
  // « actif » on the de9de9 app, yet no service of the card is mapped to it.
  const notPublished = accueil?.b2c?.statut === 'actif' && annonces.length > 0 && !annonces.some((a) => a.canaux.includes('B2C'));

  return (
    <div className="flex flex-col gap-4">
      {annonces.length === 0 ? (
        <EmptyState
          title={L('Aucun service sur votre fiche', 'لا توجد خدمات في بطاقتك')}
          description={L('Contactez de9de9 pour la compléter.', 'اتصل بـ de9de9 لإكمالها.')}
          icon={<Megaphone className="size-6" />}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {annonces.map((annonce, i) => (
            <AnnonceTile key={`${annonce.sousCategorieCode ?? annonce.service}-${i}`} annonce={annonce} />
          ))}
        </div>
      )}

      {notPublished && (
        <p className="rounded-lg bg-de9-orange/15 px-4 py-3 text-[13px] text-de9-orange-deep">
          {L(
            "Vos services ne sont pas encore publiés sur l'app de9de9.",
            'خدماتك غير منشورة بعد على تطبيق de9de9.',
          )}
        </p>
      )}

      <div className="flex flex-col items-start gap-3 rounded-lg bg-de9-row px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-de9-slate">
          {L(
            'Vos services sont gérés par de9de9 : catégories, zones et tarifs de votre fiche.',
            'خدماتك تُدار من طرف de9de9: الفئات والمناطق والأسعار في بطاقتك.',
          )}
        </p>
        <Button variant="outline" size="sm" className="flex-none" onClick={uiActions.openSupport}>
          {L('Demander une modification à de9de9', 'طلب تعديل من de9de9')}
        </Button>
      </div>
    </div>
  );
}

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
          <MesAnnoncesTab />
        </TabsContent>
        <TabsContent value="pros">
          <MissionsProsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
