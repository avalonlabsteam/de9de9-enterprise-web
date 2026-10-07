import { Link, useSearchParams } from 'react-router-dom';
import { Building2, CalendarDays, Loader2 } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toProblem } from '@/api/problem';
import { proLoadError } from '@/lib/proErrors';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { OngletBar } from '@/components/common/OngletBar';
import { TonePill } from '@/components/actions/parts';
import { useMissions } from '../api/missions';
import type { MissionCarte } from '../schemas/missions';
import { CategoryBubble } from '@/components/common/CategoryBubble';

/**
 * « B2B · Entreprises » — the missions de9de9 assigned for client companies
 * (`GET /prestataire/missions`), one card per commande, focused on its current
 * occurrence. Tabs, pills and order all come from the answer.
 */
export function MissionsPage() {
  const L = useL();
  const [params, setParams] = useSearchParams();
  const onglet = params.get('onglet') ?? 'toutes';
  const query = useMissions(onglet);

  const pages = query.data?.pages ?? [];
  // The counts of the latest page are the freshest.
  const last = pages.at(-1);
  const missions = pages.flatMap((p) => p.missions);
  // The previous tab may still be on screen while this one loads.
  const current = last?.onglet == null || last.onglet === onglet;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-5">
        <h1 className="text-[22px] font-extrabold text-de9-ink">{last?.titre ?? L('B2B · Entreprises', 'B2B · شركات')}</h1>
        <p className="mt-1 text-[14px] text-de9-gray">
          {last?.sousTitre ?? L('Missions assignées par de9de9 (clients entreprises)', 'مهام مُسندة من de9de9 (عملاء شركات)')}
        </p>
      </header>

      {last && last.onglets.length > 0 && (
        <OngletBar
          className="mb-4"
          onglets={last.onglets}
          active={onglet}
          onSelect={(code) => setParams(code === 'toutes' ? {} : { onglet: code }, { replace: true })}
        />
      )}

      {query.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-card/60 shadow-soft dark:ring-1 dark:ring-border" />
          ))}
        </div>
      ) : query.isError && !last ? (
        <EmptyState
          title={L('Impossible de charger les missions', 'تعذّر تحميل المهام')}
          description={proLoadError(toProblem(query.error), L)}
          action={
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              {L('Réessayer', 'إعادة المحاولة')}
            </Button>
          }
        />
      ) : missions.length === 0 ? (
        <EmptyState title={last?.vide ?? L('Aucune mission dans cette catégorie', 'لا توجد مهمة في هذه الفئة')} />
      ) : (
        <>
          <div className={cn('grid gap-3 sm:grid-cols-2', !current && 'opacity-60')}>
            {missions.map((m) => (
              <MissionCard key={m.id} m={m} />
            ))}
          </div>
          {query.hasNextPage && (
            <div className="mt-5 flex justify-center">
              <Button variant="outline" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
                {query.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
                {L('Afficher plus', 'عرض المزيد')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** One mission: its current occurrence's ball, pills and line (§1.2). */
function MissionCard({ m }: { m: MissionCarte }) {
  return (
    <Link
      to={`/prestataire/missions/${encodeURIComponent(m.id)}`}
      className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-soft transition-shadow hover:shadow-lift focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:ring-1 dark:ring-border"
    >
      <div className="flex items-start gap-3">
        <CategoryBubble icone={m.icone ?? m.categorie?.icone} famille={m.categorie?.famille} className="flex-none" />
        <div className="min-w-0 flex-1">
          {m.client && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-de9-teal-dark">
              <Building2 className="size-3.5 flex-none" />
              <span className="truncate">{m.client}</span>
            </p>
          )}
          <p className="text-[15px] font-bold break-words text-de9-ink">{m.service}</p>
          {m.reference && (
            <p className="truncate text-[11px] text-de9-gray" dir="ltr">
              {m.reference}
            </p>
          )}
        </div>
        {m.balle && <TonePill tag={m.balle} className="flex-none" />}
      </div>
      {m.occurrenceLigne && (
        <p className="flex items-center gap-1.5 text-xs text-de9-slate">
          <CalendarDays className="size-3.5 flex-none text-de9-teal" />
          {m.occurrenceLigne}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {m.etatVisite && <TonePill tag={m.etatVisite} />}
        {m.etatFacture && <TonePill tag={m.etatFacture} />}
      </div>
    </Link>
  );
}
