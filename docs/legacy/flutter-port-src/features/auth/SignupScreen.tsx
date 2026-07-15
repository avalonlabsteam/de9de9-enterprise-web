import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, Mail, Lock, Briefcase, ShoppingBag, Check } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { AppRole } from '@/types/catalogue'

export function SignupScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const signup = useAuthStore((s) => s.signup)
  const [role, setRole] = useState<AppRole>('cliente')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')

  // Role is chosen here (not at login). Cliente → catalogue, Prestataire → its space.
  function onSubmit(e: FormEvent) {
    e.preventDefault()
    signup({
      email: email || 'demo@entreprise.dz',
      company: company || 'Mon Entreprise',
      role,
    })
    navigate(role === 'cliente' ? '/app/catalogue' : '/app/prestataire')
  }

  return (
    <AuthLayout title={t('auth.signupTitle')} subtitle={t('auth.signupSubtitle')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Role choice */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t('auth.roleQuestion')}</span>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <RoleCard
              active={role === 'cliente'}
              onClick={() => setRole('cliente')}
              icon={<ShoppingBag className="h-5 w-5" />}
              title={t('auth.roleCliente')}
              desc={t('auth.roleClienteDesc')}
            />
            <RoleCard
              active={role === 'prestataire'}
              onClick={() => setRole('prestataire')}
              icon={<Briefcase className="h-5 w-5" />}
              title={t('auth.rolePrestataire')}
              desc={t('auth.rolePrestataireDesc')}
            />
          </div>
        </div>

        <Field label={t('auth.company')} htmlFor="company">
          <div className="relative">
            <Building2 className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="company"
              className="ps-10"
              placeholder="SARL Exemple"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        </Field>

        <Field label={t('auth.email')} htmlFor="email">
          <div className="relative">
            <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
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
            <Input id="password" type="password" className="ps-10" placeholder="••••••••" />
          </div>
        </Field>

        <Button type="submit" size="lg" className="mt-1">
          {t('auth.signup')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          {t('auth.login')}
        </Link>
      </p>
    </AuthLayout>
  )
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col gap-1.5 rounded-lg border p-3.5 text-start transition-all',
        active
          ? 'border-brand bg-brand/5 ring-1 ring-brand'
          : 'border-border hover:border-brand/40 hover:bg-secondary/60',
      )}
    >
      {active && (
        <span className="absolute end-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-brand text-brand-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}
      <span
        className={cn(
          'grid h-9 w-9 place-items-center rounded-lg',
          active ? 'bg-brand text-brand-foreground' : 'bg-secondary text-foreground',
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-semibold leading-tight">{title}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </button>
  )
}
