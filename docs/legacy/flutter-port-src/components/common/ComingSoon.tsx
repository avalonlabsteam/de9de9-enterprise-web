import { useTranslation } from 'react-i18next'
import { Hammer } from 'lucide-react'

export function ComingSoon({ title }: { title: string }) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-24 text-center">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Hammer className="h-7 w-7" />
      </span>
      <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-sm font-semibold text-brand">{t('placeholder.comingSoon')}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t('placeholder.comingSoonBody')}</p>
    </div>
  )
}
