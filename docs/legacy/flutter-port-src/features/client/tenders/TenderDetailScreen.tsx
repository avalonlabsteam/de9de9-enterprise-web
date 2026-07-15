import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MapPin, Clock, Repeat, Wallet, ShieldCheck } from 'lucide-react'
import { useClientStore } from '@/stores/clientStore'
import { findFamily } from '@/data/mockCatalogue'
import { accentOn, CATEGORY_COLORS } from '@/theme/categoryColors'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SuiviStepper } from './SuiviStepper'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLocalized } from '@/lib/useLocalized'
import { formatDate, formatDzd } from '@/lib/format'

export function TenderDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { isDark } = useLocalized()
  const tender = useClientStore((s) => s.tenders.find((x) => x.id === id))

  if (!tender) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">404</p>
        <Link to="/app/tenders" className="mt-4 inline-block text-brand hover:underline">
          {t('common.back')}
        </Link>
      </div>
    )
  }

  const family = findFamily(tender.familyId)
  const accent = family ? accentOn(family.colorKey, isDark) : '#888'

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/app/tenders')}
        className="mb-4 -ms-2 gap-1.5"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('common.back')}
      </Button>

      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl"
          style={{ backgroundColor: `${accent}1f` }}
        >
          {family?.icon ?? '📄'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">{tender.id}</span>
            <StatusBadge status={tender.status} />
            {family && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: `${accent}1f`, color: accent }}
              >
                {CATEGORY_COLORS[family.colorKey].label}
              </span>
            )}
          </div>
          <h1 className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">
            {tender.serviceName}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('tenders.createdOn', { date: formatDate(tender.createdAt, i18n.language) })}
          </p>
        </div>
      </div>

      {/* Meta grid */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetaTile icon={<MapPin className="h-4 w-4" />} label={t('tenders.wilaya')} value={tender.wilaya} />
        <MetaTile icon={<Clock className="h-4 w-4" />} label={t('tenders.delay')} value={tender.delai} />
        <MetaTile
          icon={<Repeat className="h-4 w-4" />}
          label={t('tenders.type')}
          value={tender.type === 'recurrent' ? `${t('publish.recurrent')} · ${tender.recurrence ?? ''}` : t('publish.ponctuel')}
        />
        <MetaTile
          icon={<Wallet className="h-4 w-4" />}
          label={t('tenders.budget')}
          value={tender.budgetDzd ? formatDzd(tender.budgetDzd) : t('tenders.noBudget')}
        />
      </div>

      {/* Description */}
      <Card className="mb-5">
        <CardContent className="pt-5">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {t('tenders.description')}
          </h2>
          <p className="text-sm leading-relaxed">{tender.description}</p>
        </CardContent>
      </Card>

      {/* Blind-assignment note */}
      {tender.status === 'assigne' && (
        <div
          className="mb-5 flex items-start gap-3 rounded-xl border p-4"
          style={{ borderColor: `${accent}55`, backgroundColor: `${accent}12` }}
        >
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} />
          <p className="text-sm">{t('tenders.assignedBlind')}</p>
        </div>
      )}

      {/* Suivi */}
      <Card>
        <CardContent className="pt-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {t('tenders.suiviTitle')}
          </h2>
          <SuiviStepper status={tender.status} />
        </CardContent>
      </Card>
    </div>
  )
}

function MetaTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold leading-tight">{value}</p>
    </div>
  )
}
