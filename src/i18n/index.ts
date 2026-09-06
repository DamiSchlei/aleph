import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import es from '@/locales/es.json'
import type { Locale } from '@/domain/types'

/**
 * Visible copy is frozen to `es`. Both locale bundles stay in the repo so a future
 * Settings screen can turn language back on, but the app never switches at runtime.
 */
const ACTIVE_LOCALE: Locale = 'es'

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: ACTIVE_LOCALE,
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  returnNull: false,
})

export function applyLocale(locale: Locale = ACTIVE_LOCALE): void {
  if (i18next.language !== locale) void i18next.changeLanguage(locale)
  if (typeof document !== 'undefined') document.documentElement.lang = locale
}

applyLocale()

export default i18next
