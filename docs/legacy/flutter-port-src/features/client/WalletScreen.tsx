import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, FileText, AlertTriangle, Info } from 'lucide-react'
import { useClientStore } from '@/stores/clientStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { creditsToDzd, formatCredits, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function WalletScreen() {
  const { t, i18n } = useTranslation()
  const wallet = useClientStore((s) => s.wallet)
  const toggleSubscription = useClientStore((s) => s.toggleSubscription)
  const isNegative = wallet.balanceCredits < 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t('wallet.title')}
      </h1>

      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-md">
        <div
          className="pointer-events-none absolute -end-10 -top-10 h-40 w-40 rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--brand)) 0, transparent 70%)', opacity: 0.5 }}
        />
        <div className="relative flex items-center gap-2 text-primary-foreground/70">
          <WalletIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{t('wallet.balance')}</span>
        </div>
        <p className="relative mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {formatCredits(wallet.balanceCredits)}
        </p>
        <p className="relative mt-1 text-sm text-primary-foreground/60">
          {t('wallet.balanceDzd', { value: creditsToDzd(wallet.balanceCredits) })}
        </p>
      </div>

      {isNegative && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t('wallet.negativeWarning')}
        </div>
      )}

      {/* Subscription + recharge info */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm font-semibold">{t('wallet.subscription')}</p>
              <p
                className={cn(
                  'text-xs font-bold',
                  wallet.subscriptionActive ? 'text-brand' : 'text-muted-foreground',
                )}
              >
                {wallet.subscriptionActive
                  ? t('wallet.subscriptionActive')
                  : t('wallet.subscriptionInactive')}
              </p>
            </div>
            <Button size="sm" variant={wallet.subscriptionActive ? 'secondary' : 'default'} onClick={toggleSubscription}>
              {wallet.subscriptionActive ? t('wallet.subscriptionInactive') : t('wallet.subscriptionActive')}
            </Button>
          </CardContent>
        </Card>
        <Link to="/app/invoices">
          <Card className="h-full transition-colors hover:bg-secondary/40">
            <CardContent className="flex items-center justify-between pt-5">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-brand" />
                <span className="text-sm font-semibold">{t('wallet.viewInvoices')}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        {t('wallet.rechargeInfo')}
      </div>

      {/* Ledger */}
      <h2 className="mb-3 mt-7 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {t('wallet.history')}
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {wallet.transactions.map((tx, i) => {
          const isRecharge = tx.type === 'recharge'
          return (
            <div
              key={tx.id}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderTop: i === 0 ? undefined : '1px solid hsl(var(--border))' }}
            >
              <span
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-full',
                  isRecharge ? 'bg-emerald-500/15 text-emerald-500' : 'bg-destructive/15 text-destructive',
                )}
              >
                {isRecharge ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{tx.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(tx.date, i18n.language)}
                  {tx.invoiceId ? ` · ${tx.invoiceId}` : ''}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 text-sm font-bold',
                  isRecharge ? 'text-emerald-500' : 'text-destructive',
                )}
              >
                {isRecharge ? '+' : '−'}
                {formatCredits(tx.amountCredits)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
