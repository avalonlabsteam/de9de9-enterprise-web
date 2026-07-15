import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

/** Toggles between French and Arabic; i18n's languageChanged handler flips <html dir>. */
export function LanguageToggle() {
  const { i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => void i18n.changeLanguage(isAr ? 'fr' : 'ar')}
      className="gap-1.5"
      aria-label="Changer de langue"
    >
      <Languages className="h-4 w-4" />
      <span className="font-semibold">{isAr ? 'FR' : 'ع'}</span>
    </Button>
  )
}
