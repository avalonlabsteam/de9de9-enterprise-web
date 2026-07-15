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
            ? 'bg-[#E6F6EC] text-[#2E9E5B] dark:bg-[#123322] dark:text-[#5FCF8A]'
            : 'bg-[#FDECEC] text-de9-red dark:bg-[#331A1C] dark:text-[#FF7A80]',
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
            isRecharge
              ? 'text-[#2E9E5B] dark:text-[#5FCF8A]'
              : 'text-de9-red',
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
          <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
          <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-de9-gray">
                  <WalletIcon className="size-[18px]" />
                  {L('Solde actuel', 'الرصيد الحالي')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={cn(
                    'text-[34px] font-black leading-none tabular-nums',
                    data.balanceCredits < 0 ? 'text-de9-red' : 'text-de9-teal-dark',
                  )}
                >
                  {nf.format(data.balanceCredits)}
                </p>
                <p className="mt-1 text-[13px] font-bold text-de9-slate">{L('crédits', 'رصيد')}</p>
                <p className="mt-2 text-[12.5px] text-de9-gray">
                  {L('≈', '≈')} {nf.format(Math.round(data.balanceCredits / 10))} {L('DZD · 1 DZD = 10 crédits', 'دج · 1 دج = 10 رصيد')}
                </p>

                {data.balanceCredits < 0 && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#FDECEC] px-3 py-2.5 text-[12.5px] font-medium text-de9-red dark:bg-[#331A1C] dark:text-[#FF7A80]">
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
            <Card>
              <CardHeader>
                <CardTitle className="text-de9-gray">{L('Abonnement annuel', 'الاشتراك السنوي')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="text-[13px] text-de9-slate">
                  {L(
                    'Accès prioritaire et tarif préférentiel sur vos appels d’offres.',
                    'وصول ذو أولوية وسعر تفضيلي على طلباتك.',
                  )}
                </p>
                <p className="mt-3 text-[22px] font-black text-de9-ink">
                  {L('480 000 crédits / an', '480 000 رصيد / سنة')}
                </p>
                <div className="mt-auto pt-4">
                  <Button
                    className="w-full"
                    onClick={() => toast(L('Bientôt disponible', 'قريبًا'))}
                  >
                    {L("Choisir l'abonnement", 'اختيار الاشتراك')}
                  </Button>
                  <p className="mt-2 text-center text-[11.5px] text-de9-gray">
                    {L('Les rechargements sont effectués manuellement par de9de9.', 'تتم عمليات الشحن يدويًا من قبل de9de9.')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mouvements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-de9-ink">{L('Mouvements', 'الحركات')}</CardTitle>
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
