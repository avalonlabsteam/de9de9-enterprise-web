import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/stores/themeStore'
import type { LocalizedText } from '@/types/catalogue'

/** Pick the localized field for the active language, and expose a dark flag. */
export function useLocalized() {
  const { i18n } = useTranslation()
  const lang = i18n.language.startsWith('ar') ? 'ar' : 'fr'
  const isDark = useThemeStore((s) => s.mode === 'dark')
  const pick = (text: LocalizedText) => text[lang]
  return { lang, isDark, pick }
}
