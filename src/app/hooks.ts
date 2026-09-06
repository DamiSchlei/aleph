import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAleph } from '@/data/store'
import { applyLocale } from '@/i18n'
import type { Locale } from '@/domain/types'

/** Keeps i18next in step with Character.locale and returns the active locale. */
export function useLocale(): Locale {
  const locale = useAleph().character.locale
  const { i18n } = useTranslation()

  useEffect(() => {
    applyLocale(locale)
  }, [locale])

  return (i18n.language as Locale) === 'es' ? 'es' : locale
}
