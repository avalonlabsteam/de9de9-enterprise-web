import type { Worker } from '@/types/prestataire'
import { cn } from '@/lib/utils'

/** Initials for the avatar fallback. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function WorkerAvatar({
  worker,
  size = 'md',
  className,
}: {
  worker: Worker
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-bold text-white',
        size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs',
        className,
      )}
      style={{ backgroundColor: worker.colorHex }}
      title={worker.name}
    >
      {initials(worker.name)}
    </span>
  )
}
