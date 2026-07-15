import { useTranslation } from 'react-i18next'
import type { TenderStatus } from '@/types/client'
import { STATUS_META } from '@/lib/tenderStatus'

export function StatusBadge({ status }: { status: TenderStatus }) {
  const { t } = useTranslation()
  const meta = STATUS_META[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ backgroundColor: `${meta.hex}1f`, color: meta.hex }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.hex }} />
      {t(meta.i18nKey)}
    </span>
  )
}
