import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Info, Loader2, Plus } from 'lucide-react';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toneBox, tonePill, toneText } from '@/lib/tones';
import { toProblem } from '@/api/problem';
import { ApiIcon } from '@/components/common/ApiIcon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { portefeuilleKey, usePortefeuille } from '../api/portefeuille';
import { routeForLien } from '../lib/liens';
import type { MouvementRow, Tuile } from '../schemas/portefeuille';
import { RechargeSheet } from './RechargeSheet';

/** Tones on the dark card: the same meanings, lighter shades. */
const DARK_TONE: Record<string, string> = {
  danger: 'text-red-300',
  attention: 'text-amber-300',
  succes: 'text-teal-300',
  valide: 'text-emerald-300',
  info: 'text-sky-300',
  action: 'text-violet-300',
};
const darkTone = (ton?: string | null) => DARK_TONE[ton ?? ''] ?? 'text-white';

/** Where the list was when the client opened a movement: restored on the way back. */
let savedScrollY = 0;

/**
 * « Portefeuille » (client) — read-only. The card, the banner, « ＋ Recharger »
 * (a contact sheet, no payment) and the « Mouvements », all printed as the
 * answer gives them. Nobody pays in the app: de9de9 credits the wallet.
 */
export function WalletPage() {
  const L = useL();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const query = usePortefeuille();
  const sentinel = useRef<HTMLDivElement>(null);

  const screen = query.data?.pages[0]?.screen ?? null;
  const rows = query.data?.pages.flatMap((page) => page.items) ?? [];
  const sheetOpen = params.get('recharger') === '1';

  /** Pull-to-refresh: back to page 1 of a fresh answer. */
  const refresh = () => void queryClient.resetQueries({ queryKey: portefeuilleKey });

  const loadMore = async () => {
    const result = await query.fetchNextPage();
    // A cursor the server no longer knows: reload the list from its start.
    if (result.isFetchNextPageError && toProblem(result.error).code === 'invalid_cursor') refresh();
  };

  // Infinite scroll: fetch the next page as the end of the list comes into view.
  const { hasNextPage, isFetchingNextPage } = query;
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  });
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) void loadMoreRef.current();
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage]);

  // Back from « Détail du mouvement »: same list, same place.
  useEffect(() => {
    if (savedScrollY > 0) requestAnimationFrame(() => window.scrollTo(0, savedScrollY));
    return () => {
      savedScrollY = window.scrollY;
    };
  }, []);

  const openLien = (tuile: Tuile) => {
    const route = tuile.lien ? routeForLien(tuile.lien) : null;
    if (route) navigate(route);
  };

  const loadError = query.isError && !screen ? toProblem(query.error) : null;

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-black text-de9-ink">{L('Portefeuille', 'المحفظة')}</h1>
      </header>

      {query.isPending && (
        <div className="flex flex-col gap-4">
          <div className="h-48 animate-pulse rounded-2xl bg-secondary" />
          <div className="h-12 animate-pulse rounded-full bg-secondary" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      )}

      {loadError && (
        <EmptyState
          title={L('Impossible de charger le portefeuille', 'تعذّر تحميل المحفظة')}
          description={
            loadError.code === 'company_not_client'
              ? (loadError.detail ?? "Cette entreprise n'a pas le rôle client.")
              : L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.')
          }
          action={
            loadError.code === 'company_not_client' ? undefined : (
              <Button variant="outline" size="sm" onClick={refresh}>
                {L('Réessayer', 'إعادة المحاولة')}
              </Button>
            )
          }
        />
      )}

      {screen && (
        <>
          {/* The dark « Crédits disponibles » card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#223042] to-[#0f172a] p-5 text-white shadow-lift">
            <p className="text-[13px] font-semibold text-white/70">{screen.carte.titre}</p>
            <p className={cn('mt-1 text-[32px] font-black tabular-nums', darkTone(screen.carte.disponiblesTon))}>
              {screen.carte.disponiblesLabel}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <TuileView tuile={screen.carte.solde} onOpen={openLien} />
              <TuileView tuile={screen.carte.bloques} onOpen={openLien} />
            </div>
            {screen.carte.taux && <p className="mt-3 text-[12px] text-white/60">{screen.carte.taux}</p>}
          </div>

          {/* The red banner — only when the wallet cannot cover the next approval */}
          {screen.alerte && (
            <p className={cn('flex items-start gap-2 rounded-xl border-s-4 px-4 py-3 text-[13px] font-medium', toneBox(screen.alerte.ton), toneText(screen.alerte.ton))}>
              <ApiIcon code={screen.alerte.icone ?? 'alerte'} className="mt-0.5 size-4 flex-none" />
              {screen.alerte.texte}
            </p>
          )}

          {screen.recharger && screen.feuilleRecharge && (
            <button
              type="button"
              onClick={() => setParams({ recharger: '1' })}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-de9-teal text-[15px] font-bold text-white shadow-glow hover:bg-de9-teal-dark"
            >
              {screen.recharger.icone === 'plus' ? <Plus className="size-5" /> : <ApiIcon code={screen.recharger.icone} className="size-5" />}
              {screen.recharger.label}
            </button>
          )}

          {screen.info && (
            <p className="flex items-start gap-2 text-[12.5px] text-de9-slate">
              <Info className="mt-0.5 size-4 flex-none text-de9-blue" />
              {screen.info}
            </p>
          )}

          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-bold text-de9-ink">{screen.mouvements.titre}</h2>
            {rows.length === 0 ? (
              <p className="rounded-xl bg-secondary/60 px-4 py-6 text-center text-[13px] text-de9-slate">
                {screen.mouvements.vide ?? L('Aucun mouvement pour l’instant.', 'لا توجد حركات حاليًا.')}
              </p>
            ) : (
              <Card>
                <CardContent className="divide-y divide-border px-0 py-1">
                  {rows.map((row) => (
                    <MouvementRowView
                      key={row.id}
                      row={row}
                      onOpen={() => navigate(`/client/wallet/mouvements/${encodeURIComponent(row.id)}`)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
            <div ref={sentinel} aria-hidden />
            {isFetchingNextPage && (
              <p className="flex items-center justify-center gap-2 py-2 text-[12.5px] text-de9-gray">
                <Loader2 className="size-4 animate-spin" />
                {L('Chargement…', 'جارٍ التحميل…')}
              </p>
            )}
            {query.isFetchNextPageError && toProblem(query.error).code !== 'invalid_cursor' && (
              <Button variant="outline" size="sm" className="self-center" onClick={() => void loadMore()}>
                {L('Réessayer', 'إعادة المحاولة')}
              </Button>
            )}
          </section>

          {sheetOpen && screen.feuilleRecharge && (
            <RechargeSheet feuille={screen.feuilleRecharge} onClose={() => setParams({}, { replace: true })} />
          )}
        </>
      )}
    </div>
  );
}

/** « Solde » / « 🔒 Bloqués » — dimmed when inactive, tappable only with a `lien`. */
function TuileView({ tuile, onOpen }: { tuile: Tuile; onOpen: (tuile: Tuile) => void }) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-white/70">
        <ApiIcon code={tuile.icone} className="size-3.5" />
        {tuile.label}
      </span>
      <span className={cn('mt-1 block text-[15px] font-bold tabular-nums', darkTone(tuile.ton))}>{tuile.valeurLabel}</span>
      {tuile.aide && <span className="mt-0.5 block text-[11.5px] text-white/60">{tuile.aide}</span>}
      {tuile.lien && (
        <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-teal-300">
          {tuile.lien.label}
          <ChevronRight className="size-3.5 rtl:rotate-180" />
        </span>
      )}
    </>
  );
  const className = cn('rounded-xl bg-white/10 p-3 text-start', !tuile.actif && 'opacity-50');
  return tuile.lien ? (
    <button type="button" onClick={() => onOpen(tuile)} className={cn(className, 'transition-colors hover:bg-white/15')}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** A row, drawn only from its printed fields — never from `montantCredits`. */
function MouvementRowView({ row, onOpen }: { row: MouvementRow; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-secondary/60"
    >
      <span className={cn('grid size-10 flex-none place-items-center rounded-full', tonePill(row.ton))}>
        <ApiIcon code={row.icone} className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-de9-ink">{row.titre}</span>
        <span className="block text-[12px] text-de9-gray">{row.dateLabel}</span>
      </span>
      <span className={cn('flex-none text-[14px] font-bold tabular-nums', toneText(row.ton))} dir="ltr">
        {row.montantLabel}
      </span>
      <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
    </button>
  );
}
