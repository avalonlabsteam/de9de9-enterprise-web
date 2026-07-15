import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, LayoutGrid, FileText, Wallet } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { LanguageToggle } from '@/components/common/LanguageToggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ICONS = [LayoutGrid, FileText, Wallet]

export function OnboardingScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)

  const slides = [
    { title: t('onboarding.slide1Title'), body: t('onboarding.slide1Body') },
    { title: t('onboarding.slide2Title'), body: t('onboarding.slide2Body') },
    { title: t('onboarding.slide3Title'), body: t('onboarding.slide3Body') },
  ]
  const isLast = index === slides.length - 1
  const Icon = ICONS[index]

  function next() {
    if (isLast) navigate('/login')
    else setIndex((i) => i + 1)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between p-5">
        <Logo />
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            {t('common.skip')}
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div key={index} className="flex animate-fade-in flex-col items-center">
          <div className="relative mb-10 grid h-44 w-44 place-items-center">
            <div className="absolute inset-0 rounded-[2rem] bg-brand/10" />
            <div className="absolute inset-4 rounded-[1.6rem] bg-brand/10" />
            <span className="relative grid h-24 w-24 place-items-center rounded-3xl bg-brand text-brand-foreground shadow-lg">
              <Icon className="h-11 w-11" />
            </span>
          </div>
          <h1 className="max-w-md text-2xl font-extrabold tracking-tight sm:text-3xl">
            {slides[index].title}
          </h1>
          <p className="mt-3 max-w-sm text-muted-foreground">{slides[index].body}</p>
        </div>
      </main>

      <footer className="flex flex-col items-center gap-6 px-6 pb-12">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                'h-2 rounded-full transition-all',
                i === index ? 'w-7 bg-brand' : 'w-2 bg-border',
              )}
            />
          ))}
        </div>
        <Button size="lg" onClick={next} className="w-full max-w-sm">
          {isLast ? t('common.start') : t('common.next')}
          <ArrowRight className="h-5 w-5 rtl:rotate-180" />
        </Button>
      </footer>
    </div>
  )
}
