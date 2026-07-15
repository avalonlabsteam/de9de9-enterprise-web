import { cn } from '@/lib/utils'

/** De9De9 wordmark. The "9"s nod to the brand name; brand accent on the digits. */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 font-extrabold tracking-tight', className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground text-lg shadow-sm">
        D9
      </span>
      <span className="text-xl">
        De<span className="text-brand">9</span>De<span className="text-brand">9</span>
      </span>
    </div>
  )
}
