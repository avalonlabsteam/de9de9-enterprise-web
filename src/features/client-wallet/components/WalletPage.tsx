import { HelpCircle, ArrowDownLeft, ArrowUpRight, TriangleAlert, Wallet as WalletIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { uiActions } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useWallet } from '../api/useWallet';
import type { WalletTx } from '../schemas/wallet';

const nf = new Intl.NumberFormat('fr-FR');

function LedgerRow({ tx, L }: { tx: WalletTx; L: (fr: string, ar: string) => string }) {
  const isRecharge = tx.type === 'recharge';
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          'flex size-9 flex-none items-center justify-center rounded-full',
          isRecharge
            ? 'bg-de9-teal-soft text-de9-teal-dark'
            : 'bg-de9-red-soft text-de9-red',
        )}
      >
        {isRecharge ? <ArrowUpRight className="size-[18px]" /> : <ArrowDownLeft className="size-[18px]" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-bold text-de9-ink">{tx.label}</p>
        <p className="text-[12px] text-de9-gray">{tx.date}</p>
      </div>
      <div className="text-end">
        <p
          className={cn(
            'text-[13.5px] font-bold tabular-nums',
            isRecharge ? 'text-de9-teal-dark' : 'text-de9-red',
          )}
        >
          {isRecharge ? '+' : '−'}
          {nf.format(tx.amountCredits)}
        </p>
        <p className="text-[11px] text-de9-gray">{L('crédits', 'رصيد')}</p>
      </div>
    </div>
  );
}

export function WalletPage() {
  const L = useL();
  const { data, isPending, isError } = useWallet();

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black text-de9-ink">{L('Crédits', 'الرصيد')}</h1>
          <p className="mt-0.5 text-[13px] text-de9-gray">
            {L('Solde, abonnement et mouvements', 'الرصيد والاشتراك والحركات')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => uiActions.openSupport()}>
          <HelpCircle className="size-4" />
          {L('Aide', 'مساعدة')}
        </Button>
      </header>

      {isPending && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-40 animate-pulse rounded-lg bg-secondary" />
          <div className="h-40 animate-pulse rounded-lg bg-secondary" />
        </div>
      )}

      {isError && (
        <EmptyState
          title={L('Impossible de charger le portefeuille', 'تعذّر تحميل المحفظة')}
          description={L('Réessayez plus tard.', 'أعد المحاولة لاحقًا.')}
        />
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Solde actuel */}
            <Card className="border-0 bg-de9-teal text-white shadow-glow dark:ring-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5 text-white">
                  <span className="flex size-8 flex-none items-center justify-center rounded-full bg-white/25">
                    <WalletIcon className="size-[16px]" />
                  </span>
                  {L('Solde actuel', 'الرصيد الحالي')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[34px] font-bold leading-none tabular-nums text-white">
                  {nf.format(data.balanceCredits)}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-white/85">{L('crédits', 'رصيد')}</p>
                <p className="mt-2 text-[12.5px] text-white/75">
                  {L('≈', '≈')} {nf.format(Math.round(data.balanceCredits / 10))} {L('DZD · 1 DZD = 10 crédits', 'دج · 1 دج = 10 رصيد')}
                </p>

                {data.balanceCredits < 0 && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/20 px-3 py-2.5 text-[12.5px] font-medium text-white">
                    <TriangleAlert className="mt-0.5 size-4 flex-none" />
                    <span>
                      {L(
                        'Solde négatif. Contactez de9de9 pour recharger votre compte.',
                        'رصيد سالب. تواصل مع de9de9 لإعادة شحن حسابك.',
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Abonnement annuel */}
            <Card className="border-0 bg-de9-gray text-white shadow-soft dark:ring-1 dark:ring-border">
              <CardHeader>
                <CardTitle className="text-white">{L('Abonnement annuel', 'الاشتراك السنوي')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="text-[13px] text-white/85">
                  {L(
                    'Accès prioritaire et tarif préférentiel sur vos appels d’offres.',
                    'وصول ذو أولوية وسعر تفضيلي على طلباتك.',
                  )}
                </p>
                <p className="mt-3 text-[22px] font-bold text-white">
                  {L('480 000 crédits / an', '480 000 رصيد / سنة')}
                </p>
                <div className="mt-auto pt-4">
                  <Button
                    className="w-full bg-white text-de9-teal-dark shadow-soft hover:bg-white/90"
                    onClick={() => toast(L('Bientôt disponible', 'قريبًا'))}
                  >
                    {L("Choisir l'abonnement", 'اختيار الاشتراك')}
                  </Button>
                  <p className="mt-2 text-center text-[11.5px] text-white/70">
                    {L('Les rechargements sont effectués manuellement par de9de9.', 'تتم عمليات الشحن يدويًا من قبل de9de9.')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mouvements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-de9-gray">{L('Mouvements', 'الحركات')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.history.length === 0 ? (
                <EmptyState
                  title={L('Aucun mouvement', 'لا توجد حركات')}
                  description={L('Vos rechargements et déductions apparaîtront ici.', 'ستظهر عمليات الشحن والخصم هنا.')}
                />
              ) : (
                <div className="divide-y divide-border">
                  {data.history.map((tx) => (
                    <LedgerRow key={tx.id} tx={tx} L={L} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
