import { useSearchParams } from 'react-router-dom';
import { ArrowDown, FileText, Lock, RefreshCw } from 'lucide-react';
import { toProblem } from '@/api/problem';
import { useL } from '@/lib/i18n';
import { tonePill } from '@/lib/tones';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { OngletBar } from '@/components/common/OngletBar';
import { CategorieVisual } from '@/features/client-catalogue/components/CategorieVisual';
import { useFactures } from '../api/useFactures';
import { ONGLETS, ongletSchema, type Facture, type FactureOnglet } from '../schemas/facture';
import { FactureSheet } from './FactureSheet';

/** The tabs before the first answer, and their Arabic — the API words them in French only. */
const ONGLET_FR: Record<FactureOnglet, string> = {
  toutes: 'Toutes',
  a_approuver: 'À approuver',
  approuvees: 'Approuvées',
  contestees: 'Contestées',
};
const ONGLET_AR: Record<FactureOnglet, string> = {
  toutes: 'الكل',
  a_approuver: 'للموافقة',
  approuvees: 'المقبولة',
  contestees: 'المُعترض عليها',
};

/** A card's `statut`: the tone the API itself gives it on the invoice's screen, and its Arabic. */
const STATUT: Record<string, { ton: string; ar: string }> = {
  a_approuver: { ton: 'attention', ar: 'للموافقة' },
  contestee: { ton: 'danger', ar: 'مُعترض عليها' },
  confirmee: { ton: 'valide', ar: 'مقبولة' },
};

function FactureCard({ facture: f, onOpen }: { facture: Facture; onOpen: () => void }) {
  const L = useL();
  const statut = STATUT[f.statut];
  // Frozen behind a contest, not taken: amber and a padlock, where a debit is red.
  const bloques = f.credits?.etat === 'bloques';
  return (
    <button type="button" onClick={onOpen} className="w-full rounded-lg text-start">
      <Card className="transition-shadow hover:shadow-lift">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden className="grid size-10 flex-none place-items-center rounded-full bg-secondary">
                <CategorieVisual icone={f.icone} iconClassName="size-7" emojiClassName="text-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-de9-ink">
                  <bdi>{f.titre}</bdi>
                </p>
                <p className="text-[12px] text-de9-gray">
                  {f.reference && <bdi>{f.reference}</bdi>}
                  {f.reference && f.dateLabel && ' · '}
                  {f.dateLabel && <bdi>{f.dateLabel}</bdi>}
                </p>
              </div>
            </div>
            <span className={cn('flex-none rounded-full px-2.5 py-1 text-[11px] font-bold', tonePill(statut?.ton))}>
              {L(f.statutLabel, statut?.ar ?? f.statutLabel)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Absent while the invoice waits for approval: nothing has moved yet. */}
            {f.credits && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums',
                  bloques ? 'bg-de9-orange/20 text-de9-orange-deep' : 'bg-de9-red-soft text-de9-red',
                )}
              >
                {bloques ? <Lock className="size-3.5" /> : <ArrowDown className="size-3.5" />}
                <bdi>{f.credits.label}</bdi>
              </span>
            )}
            {f.occurrence && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[12px] font-bold text-de9-slate">
                <RefreshCw className="size-3.5" />
                {f.occurrence.label}
              </span>
            )}
            <span className="ms-auto text-[14px] font-extrabold text-de9-ink tabular-nums">
              <bdi>{f.montantLabel}</bdi>
            </span>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

/**
 * « Factures » — `GET /client/factures`: the tabs with the API's counts, and
 * the invoices of the selected one. A card opens the invoice's own screen,
 * where it is approved or contested.
 */
export function FacturesPage() {
  const L = useL();
  const [params, setParams] = useSearchParams();
  // The tab and the invoice on display live in the address, so the wallet (`?statut=contestees`),
  // the home and an alert (`?facture=…`) land straight on them. An unknown tab reads « Toutes »
  // rather than reaching the API as a 400.
  const parsed = ongletSchema.safeParse(params.get('statut'));
  const statut: FactureOnglet = parsed.success ? parsed.data : 'toutes';
  const ouverte = params.get('facture');
  const query = useFactures(statut);

  const pages = query.data?.pages ?? [];
  const loaded = pages.length > 0;
  const onglets = pages[0]?.onglets.length
    ? pages[0].onglets
    : ONGLETS.map((code) => ({ code, label: ONGLET_FR[code], count: 0 }));
  const factures = pages.flatMap((page) => page.data);

  const selectOnglet = (code: string) => {
    const next = ongletSchema.safeParse(code);
    if (next.success) setParams(next.data === 'toutes' ? {} : { statut: next.data }, { replace: true });
  };

  /** Opening adds a step « Retour » closes; closing adds none. */
  const ouvrir = (id: string | null) => {
    const p = new URLSearchParams(params);
    if (id) p.set('facture', id);
    else p.delete('facture');
    setParams(p, { replace: id === null });
  };

  const errorView = () => {
    const problem = toProblem(query.error);
    const autreEspace = problem.code === 'company_not_client' || problem.status === 403;
    const description =
      problem.code === 'company_not_client'
        ? L("L'espace client n'est pas activé pour votre entreprise.", 'مساحة العميل غير مفعّلة لشركتك.')
        : problem.status === 403
          ? L('Cette page appartient à l’espace client : passez-y depuis le menu.', 'هذه الصفحة تابعة لمساحة العميل: انتقل إليها من القائمة.')
          : problem.code === 'network'
            ? L('Connexion impossible. Réessayez.', 'تعذّر الاتصال. أعد المحاولة.')
            : L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.');
    return (
      <EmptyState
        title={L('Impossible de charger les factures', 'تعذّر تحميل الفواتير')}
        description={description}
        action={
          autreEspace ? undefined : (
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              {L('Réessayer', 'إعادة المحاولة')}
            </Button>
          )
        }
      />
    );
  };

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-extrabold text-de9-ink">{L('Factures', 'الفواتير')}</h1>
        <p className="mt-0.5 text-[13px] text-de9-gray">
          {L('Confirmez les factures de vos prestations.', 'أكّد فواتير خدماتك.')}
        </p>
      </header>

      <OngletBar
        active={statut}
        onSelect={selectOnglet}
        onglets={onglets.map((onglet) => {
          const code = ongletSchema.safeParse(onglet.code);
          return {
            code: onglet.code,
            label: L(onglet.label, code.success ? ONGLET_AR[code.data] : onglet.label),
            // The API's counts, never a count of the cards on screen; none until the first answer.
            count: loaded ? onglet.count : undefined,
          };
        })}
      />

      {query.isPending && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      )}

      {query.isError && errorView()}

      {!query.isError && loaded && factures.length === 0 && (
        <EmptyState
          title={L('Aucune facture', 'لا توجد فواتير')}
          description={statut === 'toutes' ? L('Vos factures apparaîtront ici.', 'ستظهر فواتيرك هنا.') : undefined}
          icon={<FileText className="size-6" />}
        />
      )}

      {!query.isError && factures.length > 0 && (
        // Dimmed while another tab loads: these are still the previous tab's cards.
        <div className={cn('flex flex-col gap-3 transition-opacity', query.isPlaceholderData && 'opacity-60')}>
          {factures.map((f) => (
            <FactureCard key={f.id} facture={f} onOpen={() => ouvrir(f.id)} />
          ))}

          {query.hasNextPage && (
            <Button
              variant="outline"
              onClick={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="self-center"
            >
              {query.isFetchingNextPage ? L('Chargement…', 'جارٍ التحميل…') : L('Voir plus', 'عرض المزيد')}
            </Button>
          )}
        </div>
      )}

      <FactureSheet id={ouverte} onClose={() => ouvrir(null)} />
    </div>
  );
}
