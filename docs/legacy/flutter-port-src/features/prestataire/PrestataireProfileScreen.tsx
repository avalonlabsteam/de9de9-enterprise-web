import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Briefcase,
  Users,
  BarChart3,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Languages,
  ArrowLeftRight,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function PrestataireProfileScreen() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const { mode, toggle } = useThemeStore()
  const isAr = i18n.language.startsWith('ar')

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t('prestataire.profile.title')}
      </h1>

      {/* Identity */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-5">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Briefcase className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight">{t('prestataire.profile.company')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('prestataire.profile.tagline')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Management links */}
      <h2 className="mb-3 mt-7 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {t('prestataire.profile.links')}
      </h2>
      <Card>
        <CardContent className="flex flex-col divide-y divide-border pt-0">
          <NavRow to="/app/prestataire/effectif" icon={<Users className="h-5 w-5 text-brand" />} label={t('prestataire.accueil.effectif')} />
          <NavRow to="/app/prestataire/stats" icon={<BarChart3 className="h-5 w-5 text-brand" />} label={t('prestataire.accueil.stats')} />
        </CardContent>
      </Card>

      {/* Settings */}
      <h2 className="mb-3 mt-7 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {t('prestataire.profile.settings')}
      </h2>
      <Card>
        <CardContent className="flex flex-col divide-y divide-border pt-0">
          <div className="flex items-center gap-3 py-3.5">
            <Languages className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">{t('profile.language')}</span>
            <Button variant="secondary" size="sm" onClick={() => void i18n.changeLanguage(isAr ? 'fr' : 'ar')}>
              {isAr ? 'العربية' : 'Français'}
            </Button>
          </div>
          <div className="flex items-center gap-3 py-3.5">
            {mode === 'dark' ? (
              <Moon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Sun className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="flex-1 text-sm font-medium">{t('profile.theme')}</span>
            <Button variant="secondary" size="sm" onClick={toggle}>
              {mode === 'dark' ? t('theme.dark') : t('theme.light')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="mt-6 w-full gap-2"
        onClick={() => navigate('/app/catalogue')}
      >
        <ArrowLeftRight className="h-4 w-4" />
        {t('prestataire.profile.switchClient')}
      </Button>

      <Button
        variant="outline"
        className="mt-3 w-full gap-2 text-destructive hover:bg-destructive/10"
        onClick={() => {
          logout()
          navigate('/login')
        }}
      >
        <LogOut className="h-4 w-4 rtl:rotate-180" />
        {t('prestataire.profile.logout')}
      </Button>
    </div>
  )
}

function NavRow({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 py-3.5">
      {icon}
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted-foreground rtl:rotate-180" />
    </Link>
  )
}
