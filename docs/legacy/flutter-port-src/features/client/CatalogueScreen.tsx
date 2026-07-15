import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MOCK_FAMILIES } from '@/data/mockCatalogue'
import { CATEGORY_COLORS, onBadgeOn } from '@/theme/categoryColors'
import type { CategoryColorKey } from '@/types/catalogue'
import { FamilyCard } from './FamilyCard'
import { Input } from '@/components/ui/input'
import { useLocalized } from '@/lib/useLocalized'
import { cn } from '@/lib/utils'

const FILTERS: (CategoryColorKey | 'all')[] = ['all', 'noir', 'bleu', 'vert', 'rouge']

export function CatalogueScreen() {
  const { t } = useTranslation()
  const { pick, isDark } = useLocalized()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CategoryColorKey | 'all'>('all')

  const families = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MOCK_FAMILIES.filter((f) => {
      if (filter !== 'all' && f.colorKey !== filter) return false
      if (!q) return true
      if (pick(f.name).toLowerCase().includes(q)) return true
      return f.subs.some((s) => pick(s.name).toLowerCase().includes(q))
    })
  }, [query, filter, pick])

  const totalServices = MOCK_FAMILIES.reduce((n, f) => n + f.subs.length, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t('catalogue.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('catalogue.subtitle')} · {t('catalogue.familiesCount', { count: MOCK_FAMILIES.length })} ·{' '}
          {t('catalogue.servicesCount', { count: totalServices })}
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 ps-11"
          placeholder={t('catalogue.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Category filter chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((key) => {
          const active = filter === key
          const def = key === 'all' ? null : CATEGORY_COLORS[key]
          const accent = def ? (isDark ? def.darkAccent : def.main) : undefined
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                active
                  ? def
                    ? 'border-transparent'
                    : 'border-transparent bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
              style={
                active && def
                  ? { backgroundColor: accent, color: onBadgeOn(def.key, isDark) }
                  : undefined
              }
            >
              {key === 'all' ? t('catalogue.allCategories') : def!.label}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {families.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {t('catalogue.noResults')}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {families.map((f) => (
            <FamilyCard key={f.id} family={f} />
          ))}
        </div>
      )}
    </div>
  )
}
