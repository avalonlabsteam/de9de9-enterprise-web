import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/stores/themeStore'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { mode, toggle } = useThemeStore()
  const { t } = useTranslation()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={t('theme.toggle')}
      title={t('theme.toggle')}
    >
      {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
