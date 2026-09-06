import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import es from '@/locales/es.json'
import { getState } from '@/data/store'
import type { Locale } from '@/domain/types'

export const SUPPORTED_LOCALES: Locale[] = ['en', 'es']

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
}

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: getState().character.locale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
})

export function applyLocale(locale: Locale): void {
  if (i18next.language !== locale) void i18next.changeLanguage(locale)
  if (typeof document !== 'undefined') document.documentElement.lang = locale
}

applyLocale(getState().character.locale)

export default i18next
