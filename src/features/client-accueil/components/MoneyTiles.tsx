import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileCheck, Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useL } from '@/lib/i18n';
import type { ClientAccueil } from '@/features/auth/schemas/accueil';
import { formatDa } from '../lib/format';

/** Invoices waiting on the client — the one action the home asks for. */
export function ApprovalCta({ count, amountDzd }: { count: number; amountDzd: number }) {
  const L = useL();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/client/factures?statut=a_approuver')}
      className="@container flex w-full items-center gap-3 rounded-lg bg-de9-orange/15 px-4 py-3 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
    >
      <span className="grid size-10 flex-none place-items-center rounded-full bg-de9-orange-deep text-white">
        <FileCheck className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-bold text-de9-orange-deep">
          {count === 1
            ? L('1 facture à approuver', 'فاتورة واحدة بانتظار موافقتك')
            : L(`${count} factures à approuver`, `${count} فواتير بانتظار موافقتك`)}
        </span>
        {amountDzd > 0 && (
          <span className="block break-words text-[12px] font-semibold tabular-nums text-de9-ink">
            {formatDa(amountDzd)} DA
          </span>
        )}
      </span>
      <span className="flex flex-none items-center gap-1 rounded-full bg-de9-orange-deep px-2 py-1.5 text-[12px] font-bold text-white @sm:px-3">
        {/* Narrow: the chevron alone, so the count keeps its room; the text already says it. */}
        <span className="hidden @sm:inline">{L('À approuver', 'للموافقة')}</span>
        <ChevronRight className="size-4 rtl:rotate-180" />
      </span>
    </button>
  );
}

/** A money tile's illustration: decorative, and sized by the tile's own width — two tiles share a row. */
function TileArt({ src }: { src: string }) {
  return <img src={src} alt="" aria-hidden className="size-14 flex-none object-contain @3xs:size-20 @sm:size-24" />;
}

/** Spendable balance in DA; the frozen share is called out, never hidden in the total. */
export function CreditsTile({ credits }: { credits: ClientAccueil['credits'] }) {
  const L = useL();
  const navigate = useNavigate();

  return (
    <div className="@container flex items-center gap-4 rounded-lg bg-card px-6 py-5 shadow-soft dark:ring-1 dark:ring-border">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold text-de9-ink">{L('Crédits disponibles', 'الرصيد المتاح')}</span>
        <p className="mt-3 break-words text-2xl font-bold tabular-nums text-de9-ink">
          {formatDa(credits.disponiblesDzd)} DA
        </p>
        {credits.bloquesCredits > 0 && (
          <p className="mt-1 flex items-start gap-1.5 text-[12px] text-de9-orange-deep">
            <Lock className="mt-0.5 size-3.5 flex-none" />
            {L(
              `${formatDa(credits.bloquesCredits / 10)} DA bloqués par une facture contestée`,
              `${formatDa(credits.bloquesCredits / 10)} DA محجوزة بسبب فاتورة محلّ نزاع`,
            )}
          </p>
        )}
        <Button
          // Nothing to spend yet: the recharge is the next step, so it leads.
          variant={credits.soldeCredits === 0 ? 'default' : 'outline'}
          className="mt-4 h-9 gap-1.5 self-start"
          // Straight to the « Recharger mes crédits » sheet (guide 10, entry points).
          onClick={() => navigate('/client/wallet?recharger=1')}
        >
          <Plus className="size-4" />
          {L('Recharger', 'شحن الرصيد')}
        </Button>
      </div>
      <TileArt src="/accueil-credits.webp" />
    </div>
  );
}

/** Invoices approved or paid, whole history. */
export function DepensesTile({ totalDzd }: { totalDzd: number }) {
  const L = useL();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/client/factures')}
      className="@container flex items-center gap-4 rounded-lg bg-card px-6 py-5 text-start shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-border"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-de9-ink">{L('Dépenses', 'المصاريف')}</span>
        <span className="mt-3 block break-words text-2xl font-bold tabular-nums text-de9-ink">
          {formatDa(totalDzd)} DA
        </span>
        <span className="mt-1 block text-[12px] text-de9-gray">
          {L('Factures approuvées ou payées', 'الفواتير الموافق عليها أو المدفوعة')}
        </span>
      </span>
      <TileArt src="/accueil-depenses.webp" />
    </button>
  );
}
