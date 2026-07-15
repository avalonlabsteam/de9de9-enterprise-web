import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Download, FileText, Link2 } from 'lucide-react'
import { useClientStore } from '@/stores/clientStore'
import { Button } from '@/components/ui/button'
import { formatDate, formatDzd } from '@/lib/format'

export function InvoicesScreen() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const invoices = useClientStore((s) => s.invoices)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/app/wallet')}
        className="mb-4 -ms-2 gap-1.5"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('common.back')}
      </Button>

      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t('invoices.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('invoices.subtitle')}</p>

      {invoices.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border py-16 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('invoices.empty')}</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">{inv.id}</span>
                  {inv.occurrenceLabel && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                      {inv.occurrenceLabel}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm font-semibold">{inv.label}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Link2 className="h-3 w-3" />
                  {t('invoices.linkedTo', { id: inv.tenderId })} ·{' '}
                  {t('invoices.issuedOn', { date: formatDate(inv.issuedAt, i18n.language) })}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-sm font-extrabold">{formatDzd(inv.amountDzd)}</span>
                <Button variant="ghost" size="sm" className="gap-1.5 text-brand">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('invoices.download')}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
