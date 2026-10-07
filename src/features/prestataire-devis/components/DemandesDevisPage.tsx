import { Link, useSearchParams } from 'react-router-dom';
import { Clock, Loader2, MapPin, RefreshCw } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toProblem } from '@/api/problem';
import { proLoadError } from '@/lib/proErrors';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { OngletBar } from '@/components/common/OngletBar';
import { CategoryBubble } from '@/components/common/CategoryBubble';
import { TonePill } from '@/components/actions/parts';
import { useDemandesDevis } from '../api/devis';
import type { DemandeCarte } from '../schemas/devis';

/**
 * « Demandes de devis » — de9de9's invitations to quote for its client
 * companies (`GET /prestataire/demandes-devis`, guide 13). Tabs, tags and order
 * come from the answer.
 */
export function DemandesDevisPage() {
  const L = useL();
  const [params, setParams] = useSearchParams();
  const onglet = params.get('onglet') ?? 'toutes';
  const query = useDemandesDevis(onglet);

  const pages = query.data?.pages ?? [];
  const last = pages.at(-1);
  const demandes = pages.flatMap((p) => p.demandes);
  const current = last?.onglet == null || last.onglet === onglet;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-5">
        <h1 className="text-[22px] font-extrabold text-de9-ink">{last?.titre ?? L('Demandes de devis', 'طلبات عروض الأسعار')}</h1>
        <p className="mt-1 text-[14px] text-de9-gray">
          {last?.sousTitre ??
            L('Envoyées par de9de9 pour ses clients entreprises', 'مرسلة من de9de9 لعملائها من الشركات')}
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
          title={L('Impossible de charger les demandes', 'تعذّر تحميل الطلبات')}
          description={proLoadError(toProblem(query.error), L)}
          action={
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              {L('Réessayer', 'إعادة المحاولة')}
            </Button>
          }
        />
      ) : demandes.length === 0 ? (
        <EmptyState title={last?.vide ?? L('Aucune demande dans cette catégorie', 'لا يوجد طلب في هذه الفئة')} />
      ) : (
        <>
          <div className={cn('grid gap-3 sm:grid-cols-2', !current && 'opacity-60')}>
            {demandes.map((d) => (
              <DemandeCard key={d.id} d={d} />
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

function DemandeCard({ d }: { d: DemandeCarte }) {
  const L = useL();
  return (
    <Link
      to={`/prestataire/demandes-devis/${encodeURIComponent(d.id)}`}
      className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-soft transition-shadow hover:shadow-lift focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:ring-1 dark:ring-border"
    >
      <div className="flex items-start gap-3">
        <CategoryBubble icone={d.icone} className="flex-none" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold break-words text-de9-ink">{d.titre}</p>
          {d.service && <p className="truncate text-[12.5px] text-de9-gray">{d.service}</p>}
        </div>
        {d.balle && <TonePill tag={d.balle} className="flex-none" />}
      </div>
      <div className="flex flex-col gap-1 text-xs text-de9-slate">
        {d.lieu && (
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3.5 flex-none text-de9-teal" />
            {d.lieu}
          </p>
        )}
        {d.cadenceLigne && (
          <p className="flex items-center gap-1.5">
            <RefreshCw className="size-3.5 flex-none text-de9-teal" />
            {d.cadenceLigne}
          </p>
        )}
        {(d.recueLe || d.echeance) && (
          <p className="flex flex-wrap items-center gap-x-1.5">
            <Clock className="size-3.5 flex-none text-de9-teal" />
            {d.recueLe}
            {d.recueLe && d.echeance && <span aria-hidden>·</span>}
            {d.echeance && <span className="font-semibold text-de9-orange-deep">{d.echeance}</span>}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {d.etat && <TonePill tag={d.etat} />}
        {d.monDevis?.montantLabel && (
          <p className="text-[12.5px] text-de9-slate">
            {L('Mon devis', 'عرضي')} : <b className="font-bold text-de9-ink tabular-nums">{d.monDevis.montantLabel}</b>
          </p>
        )}
      </div>
    </Link>
  );
}
