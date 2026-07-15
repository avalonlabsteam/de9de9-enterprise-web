import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import type { TenderStatus } from '@/types/client'
import { TENDER_STATUS_ORDER } from '@/types/client'
import { STATUS_META } from '@/lib/tenderStatus'
import { cn } from '@/lib/utils'

/** Vertical suivi timeline: En attente → Contacté → Assigné → En cours → Terminé. */
export function SuiviStepper({ status }: { status: TenderStatus }) {
  const { t } = useTranslation()
  const current = TENDER_STATUS_ORDER.indexOf(status)

  return (
    <ol className="relative">
      {TENDER_STATUS_ORDER.map((s, i) => {
        const done = i < current
        const active = i === current
        const meta = STATUS_META[s]
        const color = done || active ? meta.hex : 'hsl(var(--muted-foreground))'
        const isLast = i === TENDER_STATUS_ORDER.length - 1
        return (
          <li key={s} className="flex gap-3 pb-1">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition-colors',
                  active && 'ring-4',
                )}
                style={{
                  borderColor: done || active ? meta.hex : 'hsl(var(--border))',
                  backgroundColor: done ? meta.hex : 'transparent',
                  color: done ? '#fff' : color,
                  ...(active ? { boxShadow: `0 0 0 4px ${meta.hex}22` } : {}),
                }}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {!isLast && (
                <span
                  className="my-1 w-0.5 flex-1"
                  style={{ backgroundColor: i < current ? meta.hex : 'hsl(var(--border))' }}
                />
              )}
            </div>
            <span
              className={cn(
                'pt-0.5 pb-3 text-sm font-medium',
                active ? 'font-bold' : done ? '' : 'text-muted-foreground',
              )}
              style={active ? { color: meta.hex } : undefined}
            >
              {t(meta.i18nKey)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
