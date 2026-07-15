import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { ServiceFamily } from '@/types/catalogue'
import { accentOn, surfaceOn, CATEGORY_COLORS } from '@/theme/categoryColors'
import { useLocalized } from '@/lib/useLocalized'
import { useTranslation } from 'react-i18next'

export function FamilyCard({ family }: { family: ServiceFamily }) {
  const { pick, isDark } = useLocalized()
  const { t } = useTranslation()
  const accent = accentOn(family.colorKey, isDark)
  const surface = surfaceOn(family.colorKey, isDark)

  return (
    <Link
      to={`/app/catalogue/${family.id}`}
      className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Color rail */}
      <span
        className="absolute inset-y-0 start-0 w-1"
        style={{ backgroundColor: accent }}
      />
      <span
        className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-2xl"
        style={{ backgroundColor: surface }}
      >
        {family.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
            style={{ backgroundColor: surface, color: accent }}
          >
            {CATEGORY_COLORS[family.colorKey].label}
          </span>
        </div>
        <h3 className="mt-1 truncate font-semibold leading-tight">{pick(family.name)}</h3>
        <p className="text-xs text-muted-foreground">
          {t('catalogue.servicesCount', { count: family.subs.length })}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
    </Link>
  )
}
