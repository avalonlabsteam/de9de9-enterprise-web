import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  Mail,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Wallet,
  FileText,
  LogOut,
  Moon,
  Sun,
  Languages,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useClientStore } from '@/stores/clientStore'
import { useThemeStore } from '@/stores/themeStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function ClientProfileScreen() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const kyc = useClientStore((s) => s.kyc)
  const { mode, toggle } = useThemeStore()
  const isAr = i18n.language.startsWith('ar')

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t('profile.title')}
      </h1>

      {/* Identity */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-5">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand/10 text-2xl font-extrabold text-brand">
            {(user?.company ?? 'E').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-lg font-bold leading-tight">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {user?.company ?? '—'}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {user?.email ?? '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KYC status */}
      <Link to="/app/profile/kyc" className="mt-3 block">
        <Card className="transition-colors hover:bg-secondary/40">
          <CardContent className="flex items-center gap-3 pt-5">
            <span
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-full',
                kyc.validated ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500',
              )}
            >
              {kyc.validated ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{t('profile.kycSection')}</p>
              <p className="text-xs text-muted-foreground">
                {kyc.validated ? t('profile.kycValidated') : t('profile.kycPending')}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground rtl:rotate-180" />
          </CardContent>
        </Card>
      </Link>

      {/* Quick links */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <LinkTile to="/app/wallet" icon={<Wallet className="h-5 w-5" />} label={t('profile.myWallet')} />
        <LinkTile to="/app/invoices" icon={<FileText className="h-5 w-5" />} label={t('profile.myInvoices')} />
      </div>

      {/* Settings */}
      <h2 className="mb-3 mt-7 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {t('profile.settings')}
      </h2>
      <Card>
        <CardContent className="flex flex-col divide-y divide-border pt-0">
          <Row
            icon={<Languages className="h-5 w-5 text-muted-foreground" />}
            label={t('profile.language')}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void i18n.changeLanguage(isAr ? 'fr' : 'ar')}
              >
                {isAr ? 'العربية' : 'Français'}
              </Button>
            }
          />
          <Row
            icon={
              mode === 'dark' ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )
            }
            label={t('profile.theme')}
            action={
              <Button variant="secondary" size="sm" onClick={toggle}>
                {mode === 'dark' ? t('theme.dark') : t('theme.light')}
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="mt-6 w-full gap-2 text-destructive hover:bg-destructive/10"
        onClick={() => {
          logout()
          navigate('/login')
        }}
      >
        <LogOut className="h-4 w-4 rtl:rotate-180" />
        {t('profile.logout')}
      </Button>
    </div>
  )
}

function LinkTile({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-4 text-sm font-semibold shadow-sm transition-colors hover:bg-secondary/40"
    >
      <span className="text-brand">{icon}</span>
      {label}
    </Link>
  )
}

function Row({
  icon,
  label,
  action,
}: {
  icon: React.ReactNode
  label: string
  action: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      {icon}
      <span className="flex-1 text-sm font-medium">{label}</span>
      {action}
    </div>
  )
}
