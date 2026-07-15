import type { ReactNode } from 'react'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { LanguageToggle } from '@/components/common/LanguageToggle'

/**
 * Two-pane auth shell: a brand panel (hidden on small screens) and the form.
 * Keeps onboarding/login/signup/forgot visually consistent.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh w-full lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, hsl(var(--brand)) 0, transparent 45%), radial-gradient(circle at 80% 70%, #46B3AA 0, transparent 40%)',
          }}
        />
        <Logo className="relative text-primary-foreground" />
        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight">
            La marketplace B2B des services aux entreprises
          </h2>
          <p className="mt-3 text-primary-foreground/70">
            16 familles de services · prestataires vérifiés · devis & factures centralisés.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/50">
          © De9De9 Entreprise · Algérie
        </p>
      </div>

      {/* Form panel */}
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between p-5">
          <Logo className="lg:hidden" />
          <div className="ms-auto flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 pb-12">
          <div className="w-full max-w-sm animate-fade-in">
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
