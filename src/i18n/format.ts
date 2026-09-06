import type { Locale } from '@/domain/types'

const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-AR',
}

export function intlLocale(locale: Locale): string {
  return INTL_LOCALE[locale] ?? 'en-US'
}

export function formatHours(hours: number, locale: Locale): string {
  const rounded = Math.round(hours * 100) / 100
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 2 }).format(rounded)
}

export function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 0 }).format(amount)
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1 }).format(value)
}

export function formatDate(value: string | Date, locale: Locale): string {
  const date = typeof value === 'string' ? parseForDisplay(value) : value
  return new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short' }).format(date)
}

export function formatLongDate(value: string | Date, locale: Locale): string {
  const date = typeof value === 'string' ? parseForDisplay(value) : value
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

export function formatDateTime(value: string | Date, locale: Locale): string {
  const date = typeof value === 'string' ? parseForDisplay(value) : value
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function parseForDisplay(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}
