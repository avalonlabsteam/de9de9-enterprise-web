import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'

export function LoginScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')

  // Mock: login always routes to the Cliente space (role is chosen at signup).
  function onSubmit(e: FormEvent) {
    e.preventDefault()
    login(email || 'demo@entreprise.dz')
    navigate('/app/catalogue')
  }

  return (
    <AuthLayout title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label={t('auth.email')} htmlFor="email">
          <div className="relative">
            <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="ps-10"
              placeholder="vous@entreprise.dz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </Field>

        <Field label={t('auth.password')} htmlFor="password">
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="ps-10"
              placeholder="••••••••"
            />
          </div>
        </Field>

        <Link
          to="/forgot-password"
          className="self-end text-sm font-medium text-brand hover:underline"
        >
          {t('auth.forgotPassword')}
        </Link>

        <Button type="submit" size="lg" className="mt-1">
          {t('auth.login')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.noAccount')}{' '}
        <Link to="/signup" className="font-semibold text-brand hover:underline">
          {t('auth.signup')}
        </Link>
      </p>
    </AuthLayout>
  )
}
