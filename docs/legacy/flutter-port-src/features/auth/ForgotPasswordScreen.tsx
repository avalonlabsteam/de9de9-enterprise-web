import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, ArrowLeft, MailCheck } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'

export function ForgotPasswordScreen() {
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSent(true) // mock
  }

  return (
    <AuthLayout title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
      {sent ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
            <MailCheck className="h-6 w-6" />
          </span>
          <p className="text-sm text-muted-foreground">
            Un lien de réinitialisation a été envoyé à votre adresse e-mail.
          </p>
          <Link to="/login" className="w-full">
            <Button variant="secondary" className="w-full">
              {t('auth.backToLogin')}
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label={t('auth.email')} htmlFor="email">
            <div className="relative">
              <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" className="ps-10" placeholder="vous@entreprise.dz" />
            </div>
          </Field>
          <Button type="submit" size="lg">
            {t('auth.sendLink')}
          </Button>
          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('auth.backToLogin')}
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}
