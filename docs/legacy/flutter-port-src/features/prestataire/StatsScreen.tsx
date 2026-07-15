import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CircleDollarSign, BadgeCheck, Star, TrendingUp } from 'lucide-react'
import { MONTHLY_REVENUE } from '@/data/mockPrestataire'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function StatsScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const kpis = [
    { icon: <CircleDollarSign className="h-5 w-5" />, label: t('prestataire.stats.revenue'), value: '312 000 DZD' },
    { icon: <BadgeCheck className="h-5 w-5" />, label: t('prestataire.stats.missions'), value: '48' },
    { icon: <Star className="h-5 w-5" />, label: t('prestataire.stats.rating'), value: '4.8 / 5' },
    { icon: <TrendingUp className="h-5 w-5" />, label: t('prestataire.stats.winRate'), value: '62 %' },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/app/prestataire')}
        className="mb-4 -ms-2 gap-1.5"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('common.back')}
      </Button>

      <h1 className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t('prestataire.stats.title')}
      </h1>

      <div className="grid grid-cols-2 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">{k.icon}</span>
            <p className="mt-3 text-xl font-extrabold leading-none">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <CardContent className="pt-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {t('prestataire.stats.monthlyRevenue')}
          </h2>
          <div className="flex h-44 items-end justify-between gap-2">
            {MONTHLY_REVENUE.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-brand/85 transition-all"
                  style={{ height: `${m.ratio * 100}%` }}
                />
                <span className="text-[11px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
