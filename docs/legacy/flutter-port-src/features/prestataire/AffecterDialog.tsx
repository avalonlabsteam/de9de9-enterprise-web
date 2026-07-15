import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { usePrestataireStore } from '@/stores/prestataireStore'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WorkerAvatar } from './WorkerAvatar'
import { cn } from '@/lib/utils'

/** Reusable "Affecter un membre" modal — pick a team member for a job/order. */
export function AffecterDialog({
  open,
  onClose,
  currentWorkerId,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  currentWorkerId?: string
  onConfirm: (workerId: string) => void
}) {
  const { t } = useTranslation()
  const workers = usePrestataireStore((s) => s.workers)
  const [selected, setSelected] = useState<string | undefined>(currentWorkerId)

  return (
    <Dialog open={open} onClose={onClose} title={t('prestataire.affecter.title')}>
      <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
        {workers.map((w) => {
          const active = selected === w.id
          return (
            <button
              key={w.id}
              type="button"
              disabled={!w.available}
              onClick={() => setSelected(w.id)}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 text-start transition-colors',
                active ? 'border-brand bg-brand/5 ring-1 ring-brand' : 'border-border hover:bg-secondary/60',
                !w.available && 'opacity-50',
              )}
            >
              <WorkerAvatar worker={w} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{w.name}</p>
                <p className="text-xs text-muted-foreground">
                  {w.role}
                  {!w.available && ` · ${t('prestataire.effectif.unavailable')}`}
                </p>
              </div>
              {active && <Check className="h-4 w-4 text-brand" />}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          className="flex-1"
          disabled={!selected}
          onClick={() => {
            if (selected) onConfirm(selected)
            onClose()
          }}
        >
          {t('prestataire.affecter.confirm')}
        </Button>
      </div>
    </Dialog>
  )
}
