import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import es from '@/locales/es.json'
import type { Locale } from '@/domain/types'

const DEFAULT_LOCALE: Locale = 'es'

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  returnNull: false,
})

export function applyLocale(locale: Locale = DEFAULT_LOCALE): void {
  const next: Locale = locale === 'en' ? 'en' : 'es'
  if (i18next.language !== next) void i18next.changeLanguage(next)
  if (typeof document !== 'undefined') document.documentElement.lang = next
}

applyLocale()

export default i18next
