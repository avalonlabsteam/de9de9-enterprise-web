import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { usePrestataireStore } from '@/stores/prestataireStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WorkerAvatar } from './WorkerAvatar'
import { cn } from '@/lib/utils'

export function EffectifScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const workers = usePrestataireStore((s) => s.workers)
  const toggle = usePrestataireStore((s) => s.toggleWorker)

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

      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t('prestataire.effectif.title')}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t('prestataire.effectif.subtitle')} · {t('prestataire.effectif.membersCount', { count: workers.length })}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {workers.map((w) => (
          <Card key={w.id}>
            <CardContent className="flex items-center gap-3 pt-5">
              <WorkerAvatar worker={w} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold leading-tight">{w.name}</p>
                <p className="text-xs text-muted-foreground">{w.role}</p>
              </div>
              <button
                onClick={() => toggle(w.id)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors',
                  w.available
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-secondary text-muted-foreground',
                )}
              >
                {w.available ? t('prestataire.effectif.available') : t('prestataire.effectif.unavailable')}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
