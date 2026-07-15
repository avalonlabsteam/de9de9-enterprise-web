import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import fr from './locales/fr.json'
import ar from './locales/ar.json'

export const SUPPORTED_LANGS = ['fr', 'ar'] as const
export type Lang = (typeof SUPPORTED_LANGS)[number]
export const RTL_LANGS: Lang[] = ['ar']

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
    },
    fallbackLng: 'fr',
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'de9de9_lang',
      caches: ['localStorage'],
    },
  })

/** Keep <html dir/lang> in sync with the active language. */
export function applyDocumentDir(lang: string) {
  const isRtl = RTL_LANGS.includes(lang as Lang)
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
}

applyDocumentDir(i18n.language)
i18n.on('languageChanged', applyDocumentDir)

export default i18n
