import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronRight, MapPin, FileText } from 'lucide-react'
import { useClientStore } from '@/stores/clientStore'
import { findFamily } from '@/data/mockCatalogue'
import { accentOn } from '@/theme/categoryColors'
import { TENDER_STATUS_ORDER, type TenderStatus } from '@/types/client'
import { STATUS_META } from '@/lib/tenderStatus'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/lib/useLocalized'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function MyTendersScreen() {
  const { t, i18n } = useTranslation()
  const { isDark } = useLocalized()
  const tenders = useClientStore((s) => s.tenders)
  const [filter, setFilter] = useState<TenderStatus | 'all'>('all')

  const filtered = useMemo(
    () => (filter === 'all' ? tenders : tenders.filter((x) => x.status === filter)),
    [tenders, filter],
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t('tenders.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('tenders.subtitle')}</p>
        </div>
        <Link to="/app/tenders/new">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tenders.new')}</span>
          </Button>
        </Link>
      </div>

      {/* Status filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          {t('tenders.filterAll')}
        </FilterChip>
        {TENDER_STATUS_ORDER.map((s) => (
          <FilterChip
            key={s}
            active={filter === s}
            color={STATUS_META[s].hex}
            onClick={() => setFilter(s)}
          >
            {t(STATUS_META[s].i18nKey)}
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('tenders.empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((tender) => {
            const family = findFamily(tender.familyId)
            const accent = family ? accentOn(family.colorKey, isDark) : '#888'
            return (
              <Link
                key={tender.id}
                to={`/app/tenders/${tender.id}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl"
                  style={{ backgroundColor: `${accent}1f` }}
                >
                  {family?.icon ?? '📄'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">{tender.id}</span>
                    <StatusBadge status={tender.status} />
                  </div>
                  <h3 className="mt-0.5 truncate font-semibold leading-tight">
                    {tender.serviceName}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {tender.wilaya} · {formatDate(tender.createdAt, i18n.language)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean
  color?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
        active
          ? color
            ? 'border-transparent text-white'
            : 'border-transparent bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {children}
    </button>
  )
}
