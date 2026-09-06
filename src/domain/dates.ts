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
