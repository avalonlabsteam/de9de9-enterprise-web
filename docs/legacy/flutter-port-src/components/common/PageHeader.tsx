import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

/** Standard inner-screen header with an optional back button and title/subtitle. */
export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string
  subtitle?: string
  /** Path to navigate back to; renders a back button when set. */
  back?: string
  action?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <header className="mb-6">
      {back && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(back)}
          className="mb-3 -ms-2 gap-1.5"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {/* label kept generic via title context; uses arrow only */}
        </Button>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}
