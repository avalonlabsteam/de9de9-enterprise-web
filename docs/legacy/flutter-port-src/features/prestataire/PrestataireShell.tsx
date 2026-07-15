import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, User, Building2, CalendarDays, Briefcase } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { LanguageToggle } from '@/components/common/LanguageToggle'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  icon: LucideIcon
  labelKey: string
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/app/prestataire', icon: Home, labelKey: 'prestataire.nav.accueil', end: true },
  { to: '/app/prestataire/b2c', icon: User, labelKey: 'prestataire.nav.b2c' },
  { to: '/app/prestataire/b2b', icon: Building2, labelKey: 'prestataire.nav.b2b' },
  { to: '/app/prestataire/calendrier', icon: CalendarDays, labelKey: 'prestataire.nav.calendrier' },
  { to: '/app/prestataire/profil', icon: Briefcase, labelKey: 'prestataire.nav.profil' },
]

export function PrestataireShell() {
  const { t } = useTranslation()
  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-border bg-card p-4 lg:flex">
        <div className="px-2 py-3">
          <Logo />
          <span className="mt-1 block ps-0.5 text-xs font-semibold text-brand">Espace Prestataire</span>
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-1 px-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">PRO</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 pb-24 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 backdrop-blur lg:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-brand' : 'text-muted-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                {t(item.labelKey)}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
