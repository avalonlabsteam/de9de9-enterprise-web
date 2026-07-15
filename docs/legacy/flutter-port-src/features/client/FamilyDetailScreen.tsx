import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react'
import { findFamily } from '@/data/mockCatalogue'
import { accentOn, surfaceOn, onBadgeOn, CATEGORY_COLORS } from '@/theme/categoryColors'
import { useLocalized } from '@/lib/useLocalized'
import { Button } from '@/components/ui/button'

export function FamilyDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { pick, isDark } = useLocalized()
  const family = findFamily(Number(id))

  if (!family) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">404 — {t('catalogue.noResults')}</p>
        <Link to="/app/catalogue" className="mt-4 inline-block text-brand hover:underline">
          {t('common.back')}
        </Link>
      </div>
    )
  }

  const accent = accentOn(family.colorKey, isDark)
  const surface = surfaceOn(family.colorKey, isDark)
  const onBadge = onBadgeOn(family.colorKey, isDark)

  return (
    <div>
      {/* Color header */}
      <div className="relative overflow-hidden px-4 pb-8 pt-5 sm:px-6" style={{ backgroundColor: surface }}>
        <div className="mx-auto max-w-3xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/catalogue')}
            className="mb-4 -ms-2 gap-1.5 hover:bg-black/5"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('common.back')}
          </Button>
          <div className="flex items-start gap-4">
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-card/70 text-3xl shadow-sm"
            >
              {family.icon}
            </span>
            <div className="min-w-0">
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide"
                style={{ backgroundColor: accent, color: onBadge }}
              >
                {CATEGORY_COLORS[family.colorKey].label}
              </span>
              <h1 className="mt-2 text-xl font-extrabold leading-tight sm:text-2xl">
                {pick(family.name)}
              </h1>
              <p className="mt-1 text-sm text-foreground/70">
                {t('family.subsCount', { count: family.subs.length })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-services */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {t('family.servicesTitle')}
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {family.subs.map((sub, i) => (
            <button
              key={sub.id}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-secondary/60"
              style={{ borderTop: i === 0 ? undefined : '1px solid hsl(var(--border))' }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: accent }}
              />
              <span className="flex-1 text-sm font-medium">{pick(sub.name)}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link to={`/app/tenders/new?family=${family.id}`} className="flex-1">
            <Button size="lg" className="w-full" style={{ backgroundColor: accent, color: onBadge }}>
              <FileText className="h-5 w-5" />
              {t('family.publishTender')}
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="flex-1">
            {t('family.requestQuote')}
          </Button>
        </div>
      </div>
    </div>
  )
}
