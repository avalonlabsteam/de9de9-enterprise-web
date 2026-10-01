import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { tonePill } from '@/lib/tones';
import { toProblem, toProblemOfBlob } from '@/api/problem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { OngletBar } from '@/components/common/OngletBar';
import { paiementsListeKey, recuHrefOf, telechargerRecu, usePaiements, type Filtre } from '../api/paiements';
import type { PaiementRow } from '../schemas/paiements';

function Row({ row, onOpen }: { row: PaiementRow; onOpen: () => void }) {
  const L = useL();
  const [downloading, setDownloading] = useState(false);

  const telecharger = async () => {
    setDownloading(true);
    try {
      await telechargerRecu(recuHrefOf(row.id), row.reference);
    } catch (error) {
      toast.error((await toProblemOfBlob(error)).detail ?? L('Téléchargement impossible.', 'تعذّر التنزيل.'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-1 pe-2">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-secondary/60"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-[13px] font-bold text-de9-ink" dir="ltr">
              {row.reference}
            </span>
            {row.statutLabel && (
              <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', tonePill(row.ton))}>{row.statutLabel}</span>
            )}
          </span>
          <span className="mt-0.5 block text-[13px] font-semibold text-de9-ink" dir="ltr">
            {[row.montantLabel, row.creditsLabel].filter(Boolean).join(' · ')}
          </span>
          <span className="block text-[12px] text-de9-gray">
            <span dir="ltr">{row.dateLabel}</span>
            {row.payeurNom && ` · ${L(`Payé par ${row.payeurNom}`, `دفع من طرف ${row.payeurNom}`)}`}
          </span>
        </span>
        <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
      </button>
      {row.statut === 'approuve' && (
        <Button
          variant="ghost"
          size="icon"
          disabled={downloading}
          onClick={() => void telecharger()}
          aria-label={L('Télécharger le reçu', 'تنزيل الإيصال')}
          title={L('Télécharger le reçu', 'تنزيل الإيصال')}
        >
          {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        </Button>
      )}
    </div>
  );
}

/**
 * « Paiements en ligne » — every card payment of the company, newest first,
 * whoever paid. A row opens the payment page: it polls while the payment is
 * not final, and reads the stored state otherwise.
 */
export function PaiementsPage() {
  const L = useL();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const query = usePaiements(filtre);
  const rows = query.data?.pages.flatMap((page) => page.items) ?? [];
  const sentinel = useRef<HTMLDivElement>(null);

  const reload = () => void queryClient.resetQueries({ queryKey: paiementsListeKey });
  const loadMore = async () => {
    const result = await query.fetchNextPage();
    // A cursor the server no longer knows: the list again, from its start.
    if (result.isFetchNextPageError && toProblem(result.error).code === 'invalid_cursor') reload();
  };

  // Infinite scroll, as on « Mouvements ».
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

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5 pb-12">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate('/client/wallet')} aria-label={L('Retour au portefeuille', 'العودة إلى المحفظة')}>
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Button>
        <h1 className="text-xl font-extrabold text-de9-ink">{L('Paiements en ligne', 'المدفوعات الإلكترونية')}</h1>
      </header>

      <OngletBar
        active={filtre}
        onSelect={(code) => setFiltre(code as Filtre)}
        onglets={[
          { code: 'tous', label: L('Tous', 'الكل') },
          { code: 'en_cours', label: L('En cours', 'قيد المعالجة') },
          { code: 'payes', label: L('Payés', 'المدفوعة') },
        ]}
      />

      {query.isPending ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : query.isError && rows.length === 0 ? (
        <EmptyState
          title={L('Impossible de charger les paiements', 'تعذّر تحميل المدفوعات')}
          description={toProblem(query.error).detail ?? L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.')}
          action={
            <Button variant="outline" size="sm" onClick={reload}>
              {L('Réessayer', 'إعادة المحاولة')}
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <p className="rounded-xl bg-secondary/60 px-4 py-6 text-center text-[13px] text-de9-slate">
          {L('Aucun paiement en ligne pour l’instant.', 'لا توجد مدفوعات إلكترونية حاليًا.')}
        </p>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border px-0 py-1">
            {rows.map((row) => (
              <Row
                key={row.id}
                row={row}
                onOpen={() => navigate(`/client/wallet/paiements/${encodeURIComponent(row.id)}`, { state: { final: row.final } })}
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
    </div>
  );
}
