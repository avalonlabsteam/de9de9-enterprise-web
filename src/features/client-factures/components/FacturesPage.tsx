import { useState } from 'react';
import { HelpCircle, FileText, ArrowDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { uiActions } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DocViewer } from '@/components/common/DocViewer';
import { useFactures } from '../api/useFactures';
import type { Facture, FactureStatus } from '../schemas/facture';

const nf = new Intl.NumberFormat('fr-FR');

type Filter = 'all' | FactureStatus;

const STATUS_META: Record<
  FactureStatus,
  { labelFr: string; labelAr: string; kind: 'wait' | 'done' | 'action' }
> = {
  waiting: { labelFr: 'En attente de confirmation', labelAr: 'في انتظار التأكيد', kind: 'wait' },
  approved: { labelFr: 'Approuvée', labelAr: 'مقبولة', kind: 'done' },
  contested: { labelFr: 'Contestée', labelAr: 'مُعترض عليها', kind: 'action' },
};

function FactureCard({
  facture,
  onOpen,
  L,
}: {
  facture: Facture;
  onOpen: (f: Facture) => void;
  L: (fr: string, ar: string) => string;
}) {
  const meta = STATUS_META[facture.status];
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(facture)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(facture);
        }
      }}
      className="cursor-pointer transition-shadow hover:shadow-md"
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-9 flex-none items-center justify-center rounded-full bg-secondary text-de9-teal-dark">
              <FileText className="size-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-de9-ink">{facture.label}</p>
              <p className="text-[12px] text-de9-gray">
                {facture.id} · {facture.issuedAt}
              </p>
            </div>
          </div>
          <StatusBadge label={L(meta.labelFr, meta.labelAr)} kind={meta.kind} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FDECEC] px-2.5 py-1 text-[12px] font-bold text-de9-red dark:bg-[#331A1C] dark:text-[#FF7A80]">
            <ArrowDown className="size-3.5" />−{nf.format(facture.amountDzd * 10)} {L('crédits', 'رصيد')}
          </span>
          {facture.occurrenceLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[12px] font-bold text-de9-slate">
              <RefreshCw className="size-3.5" />
              {facture.occurrenceLabel}
            </span>
          )}
          <span className="ms-auto text-[14px] font-black text-de9-ink tabular-nums">
            {nf.format(facture.amountDzd)} DZD
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function FacturesPage() {
  const L = useL();
  const { data, isPending, isError } = useFactures();
  const [filter, setFilter] = useState<Filter>('all');
  const [active, setActive] = useState<Facture | null>(null);

  const factures = data ?? [];
  const counts = {
    all: factures.length,
    waiting: factures.filter((f) => f.status === 'waiting').length,
    approved: factures.filter((f) => f.status === 'approved').length,
    contested: factures.filter((f) => f.status === 'contested').length,
  };
  const visible = filter === 'all' ? factures : factures.filter((f) => f.status === filter);

  const pills: { key: Filter; labelFr: string; labelAr: string; count: number }[] = [
    { key: 'all', labelFr: 'Toutes', labelAr: 'الكل', count: counts.all },
    { key: 'waiting', labelFr: 'En attente', labelAr: 'قيد الانتظار', count: counts.waiting },
    { key: 'approved', labelFr: 'Approuvées', labelAr: 'المقبولة', count: counts.approved },
    { key: 'contested', labelFr: 'Contestées', labelAr: 'المُعترض عليها', count: counts.contested },
  ];

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black text-de9-ink">{L('Factures', 'الفواتير')}</h1>
          <p className="mt-0.5 text-[13px] text-de9-gray">
            {L('Confirmez les factures de vos prestations.', 'أكّد فواتير خدماتك.')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => uiActions.openSupport()}>
          <HelpCircle className="size-4" />
          {L('Aide', 'مساعدة')}
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        {pills.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setFilter(p.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors',
              filter === p.key
                ? 'bg-de9-teal-dark text-white'
                : 'bg-secondary text-de9-slate hover:text-de9-ink',
            )}
          >
            {L(p.labelFr, p.labelAr)}
            <span
              className={cn(
                'inline-flex min-w-5 justify-center rounded-full px-1.5 text-[11px] tabular-nums',
                filter === p.key ? 'bg-white/20 text-white' : 'bg-card text-de9-gray',
              )}
            >
              {p.count}
            </span>
          </button>
        ))}
      </div>

      {isPending && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          title={L('Impossible de charger les factures', 'تعذّر تحميل الفواتير')}
          description={L('Réessayez plus tard.', 'أعد المحاولة لاحقًا.')}
        />
      )}

      {data && visible.length === 0 && (
        <EmptyState
          title={L('Aucune facture', 'لا توجد فواتير')}
          description={L('Vos factures apparaîtront ici.', 'ستظهر فواتيرك هنا.')}
          icon={<FileText className="size-6" />}
        />
      )}

      {data && visible.length > 0 && (
        <div className="flex flex-col gap-3">
          {visible.map((f) => (
            <FactureCard key={f.id} facture={f} onOpen={setActive} L={L} />
          ))}
        </div>
      )}

      <DocViewer
        open={active !== null}
        onOpenChange={(o) => !o && setActive(null)}
        doc={
          active
            ? {
                montant: `${nf.format(active.amountDzd)} DZD`,
                emetteur: active.tenderId,
                date: active.issuedAt,
                creditsDeduits: `${nf.format(active.amountDzd * 10)} ${L('crédits', 'رصيد')}`,
                statut: L(STATUS_META[active.status].labelFr, STATUS_META[active.status].labelAr),
                status: active.status,
              }
            : {}
        }
        onApprove={() => toast(L('Facture approuvée', 'تمت الموافقة على الفاتورة'))}
        onContest={() => toast(L('Facture contestée', 'تم الاعتراض على الفاتورة'))}
      />
    </div>
  );
}
