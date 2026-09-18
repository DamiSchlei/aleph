/** Pure date helpers. Everything is local-time based: the user lives in one timezone. */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export function toDayKey(value: Date | string): string {
  const d = typeof value === 'string' ? parseLocal(value) : value
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parses an ISO date or datetime. Date-only strings become local midnight, not UTC. */
export function parseLocal(value: string): Date {
  if (DATE_ONLY.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

/** A date-only due date is due at the end of that day. */
export function deadlineOf(dueAt: string): Date {
  if (DATE_ONLY.test(dueAt)) {
    const [y, m, d] = dueAt.split('-').map(Number)
    return new Date(y, m - 1, d, 23, 59, 59, 999)
  }
  return new Date(dueAt)
}

export function startOfDay(value: Date | string): Date {
  const d = typeof value === 'string' ? parseLocal(value) : new Date(value)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(value: Date | string, days: number): Date {
  const d = typeof value === 'string' ? parseLocal(value) : new Date(value)
  d.setDate(d.getDate() + days)
  return d
}

export function daysBetween(from: Date | string, to: Date | string): number {
  const a = startOfDay(from).getTime()
  const b = startOfDay(to).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** Monday of the week containing `value`. */
export function startOfWeek(value: Date | string): Date {
  const d = startOfDay(value)
  const shift = (d.getDay() + 6) % 7
  return addDays(d, -shift)
}

/** The seven day keys of the week containing `value`, Monday first. */
export function weekDayKeys(value: Date | string): string[] {
  const monday = startOfWeek(value)
  return Array.from({ length: 7 }, (_, i) => toDayKey(addDays(monday, i)))
}

/** The last seven day keys ending today, oldest first. */
export function lastSevenDayKeys(today: Date | string = new Date()): string[] {
  return Array.from({ length: 7 }, (_, i) => toDayKey(addDays(today, i - 6)))
}

/** Monday=1 … Sunday=7. */
export function isoWeekday(value: Date | string): number {
  const day = (typeof value === 'string' ? parseLocal(value) : value).getDay()
  return day === 0 ? 7 : day
}

/** First calendar day of the month containing `value`. */
export function startOfMonth(value: Date | string): Date {
  const d = startOfDay(value)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Last calendar day of the month containing `value`. */
export function endOfMonth(value: Date | string): Date {
  const d = startOfDay(value)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

/** Shift by calendar months, clamping the day to the target month's length. */
export function addMonths(value: Date | string, months: number): Date {
  const source = typeof value === 'string' ? parseLocal(value) : new Date(value)
  const day = source.getDate()
  const cursor = new Date(source.getFullYear(), source.getMonth() + months, 1)
  const last = endOfMonth(cursor).getDate()
  cursor.setDate(Math.min(day, last))
  cursor.setHours(source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds())
  return cursor
}

/** Day keys of the calendar month containing `value`, first to last. */
export function monthDayKeys(value: Date | string): string[] {
  const start = startOfMonth(value)
  const endKey = toDayKey(endOfMonth(value))
  const keys: string[] = []
  for (let cursor = start; toDayKey(cursor) <= endKey; cursor = addDays(cursor, 1)) {
    keys.push(toDayKey(cursor))
  }
  return keys
}

/**
 * ISO-8601 week number. Week starts Monday.
 * Week 1 is the week that contains the year's first Thursday.
 */
export function isoWeekNumber(value: Date | string): number {
  const d = startOfDay(value)
  // Thursday of this week decides the ISO year/week.
  const thursday = addDays(d, 4 - isoWeekday(d))
  const yearStart = new Date(thursday.getFullYear(), 0, 1)
  return Math.floor((thursday.getTime() - yearStart.getTime()) / 86_400_000 / 7) + 1
}

/** Compact range for a Monday-start week, e.g. "14–20 sep". */
export function weekRangeLabel(startKey: string, locale: 'en' | 'es'): string {
  const tag = locale === 'en' ? 'en-US' : 'es-AR'
  const start = parseLocal(startKey)
  const end = addDays(start, 6)
  const startDay = start.getDate()
  const endDay = end.getDate()
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    const month = new Intl.DateTimeFormat(tag, { month: 'short' }).format(end)
    return `${startDay}–${endDay} ${month}`
  }
  const startLabel = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short' }).format(start)
  const endLabel = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short' }).format(end)
  return `${startLabel} – ${endLabel}`
}

/** "Semana 38 · 14–20 sep 2026" / "Week 38 · 14–20 Sep 2026". */
export function formatWeekHeading(anchorKey: string, locale: 'en' | 'es'): string {
  const monday = startOfWeek(anchorKey)
  const mondayKey = toDayKey(monday)
  const n = isoWeekNumber(monday)
  const year = addDays(monday, 6).getFullYear()
  const range = `${weekRangeLabel(mondayKey, locale)} ${year}`
  return locale === 'en' ? `Week ${n} · ${range}` : `Semana ${n} · ${range}`
}

/**
 * Matching weekdays from today through the horizon, never past dates.
 * Caps at `cap` (20 for series). ISO weekdays: 1=Mon … 7=Sun.
 */
export function seriesDayKeys(
  weekdays: number[],
  horizon: 'week' | 'month',
  today: Date | string = new Date(),
  cap = 20,
): string[] {
  const wanted = new Set(weekdays.filter((day) => day >= 1 && day <= 7))
  if (wanted.size === 0 || cap <= 0) return []
  const start = startOfDay(today)
  const end = horizon === 'week' ? addDays(startOfWeek(start), 6) : endOfMonth(start)
  const keys: string[] = []
  for (let cursor = start; toDayKey(cursor) <= toDayKey(end) && keys.length < cap; cursor = addDays(cursor, 1)) {
    if (wanted.has(isoWeekday(cursor))) keys.push(toDayKey(cursor))
  }
  return keys
}
