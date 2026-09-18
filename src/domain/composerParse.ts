import { addDays, toDayKey } from '@/domain/dates'
import type { Difficulty } from '@/domain/types'

export interface ComposerParseResult {
  title: string
  scheduledFor: string
  estimatedHours: number
  difficulty: Difficulty
}

const HOUR_RE = /\b(\d+(?:[.,]\d+)?)\s*h\b/i
const DIFF_RE = /\b(baja|media|alta|low|medium|high)\b/i

const WEEKDAY_ALIASES: Array<{ keys: string[]; offsetFromMonday: number }> = [
  { keys: ['lunes', 'monday', 'lun', 'mon'], offsetFromMonday: 0 },
  { keys: ['martes', 'tuesday', 'mar', 'tue'], offsetFromMonday: 1 },
  { keys: ['miércoles', 'miercoles', 'wednesday', 'mié', 'mie', 'wed'], offsetFromMonday: 2 },
  { keys: ['jueves', 'thursday', 'jue', 'thu'], offsetFromMonday: 3 },
  { keys: ['viernes', 'friday', 'vie', 'fri'], offsetFromMonday: 4 },
  { keys: ['sábado', 'sabado', 'saturday', 'sáb', 'sab', 'sat'], offsetFromMonday: 5 },
  { keys: ['domingo', 'sunday', 'dom', 'sun'], offsetFromMonday: 6 },
]

function nextWeekday(from: Date, offsetFromMonday: number): string {
  const day = (from.getDay() + 6) % 7 // Mon=0
  const delta = (offsetFromMonday - day + 7) % 7 || 7
  return toDayKey(addDays(from, delta))
}

function stripToken(text: string, token: string): string {
  const re = new RegExp(`(^|\\s)${token}(?=\\s|$)`, 'ig')
  return text.replace(re, ' ').replace(/\s+/g, ' ').trim()
}

/** Parse Home composer text: optional day / hours / difficulty tokens, then title. */
export function parseComposerInput(
  raw: string,
  visibleDay: string,
  now: Date = new Date(),
): ComposerParseResult {
  let text = raw.trim()
  let scheduledFor = visibleDay
  let estimatedHours = 1
  let difficulty: Difficulty = 'medium'

  if (/\bhoy\b/i.test(text) || /\btoday\b/i.test(text)) {
    scheduledFor = toDayKey(now)
    text = stripToken(text, 'hoy')
    text = stripToken(text, 'today')
  } else if (/\bmañana\b/i.test(text) || /\bmanana\b/i.test(text) || /\btomorrow\b/i.test(text)) {
    scheduledFor = toDayKey(addDays(now, 1))
    text = stripToken(text, 'mañana')
    text = stripToken(text, 'manana')
    text = stripToken(text, 'tomorrow')
  } else {
    for (const entry of WEEKDAY_ALIASES) {
      const hit = entry.keys.find((key) => new RegExp(`\\b${key}\\b`, 'i').test(text))
      if (!hit) continue
      scheduledFor = nextWeekday(now, entry.offsetFromMonday)
      text = stripToken(text, hit)
      break
    }
  }

  const hourMatch = text.match(HOUR_RE)
  if (hourMatch) {
    estimatedHours = Number(hourMatch[1].replace(',', '.'))
    if (!Number.isFinite(estimatedHours) || estimatedHours <= 0) estimatedHours = 1
    text = text.replace(HOUR_RE, ' ').replace(/\s+/g, ' ').trim()
  }

  const diffMatch = text.match(DIFF_RE)
  if (diffMatch) {
    const token = diffMatch[1].toLowerCase()
    difficulty =
      token === 'baja' || token === 'low'
        ? 'low'
        : token === 'alta' || token === 'high'
          ? 'high'
          : 'medium'
    text = text.replace(DIFF_RE, ' ').replace(/\s+/g, ' ').trim()
  }

  return {
    title: text || raw.trim(),
    scheduledFor,
    estimatedHours,
    difficulty,
  }
}

/**
 * Home composer write: keep parsed title / hours / difficulty, but always
 * schedule on the strip-selected `dayKey` (never mañana / weekday hops).
 */
export function composerWriteForDay(
  raw: string,
  dayKey: string,
  hours: number,
  now: Date = new Date(),
): {
  title: string
  scheduledFor: string
  dueAt: string
  estimatedHours: number
  difficulty: Difficulty
} {
  const parsed = parseComposerInput(raw, dayKey, now)
  const hasHourToken = HOUR_RE.test(raw)
  return {
    title: parsed.title,
    scheduledFor: dayKey,
    dueAt: dayKey,
    estimatedHours: hasHourToken ? parsed.estimatedHours : hours,
    difficulty: parsed.difficulty,
  }
}
