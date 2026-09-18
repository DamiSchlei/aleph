import { describe, expect, it } from 'vitest'
import {
  addMonths,
  formatWeekHeading,
  isoWeekNumber,
  monthDayKeys,
  startOfMonth,
  startOfWeek,
  toDayKey,
  weekRangeLabel,
} from './dates'

describe('month helpers', () => {
  it('startOfMonth returns the first calendar day', () => {
    expect(toDayKey(startOfMonth('2026-09-15'))).toBe('2026-09-01')
  })

  it('monthDayKeys lists every day of the month', () => {
    const keys = monthDayKeys('2026-02-10')
    expect(keys[0]).toBe('2026-02-01')
    expect(keys.at(-1)).toBe('2026-02-28')
    expect(keys).toHaveLength(28)
  })

  it('addMonths clamps to the last day of a shorter month', () => {
    expect(toDayKey(addMonths('2026-01-31', 1))).toBe('2026-02-28')
  })
})

describe('isoWeekNumber', () => {
  it('returns ISO week for mid-year Mondays', () => {
    // 2026-09-14 is Monday of ISO week 38
    expect(isoWeekNumber('2026-09-14')).toBe(38)
    expect(isoWeekNumber('2026-09-17')).toBe(38)
    expect(isoWeekNumber('2026-09-20')).toBe(38)
  })

  it('puts early January days into the previous ISO year week when needed', () => {
    // 2026-01-01 is Thursday → week 1
    expect(isoWeekNumber('2026-01-01')).toBe(1)
    // 2025-12-29 is Monday of week 1 of 2026
    expect(isoWeekNumber('2025-12-29')).toBe(1)
  })

  it('aligns with startOfWeek Monday', () => {
    const monday = toDayKey(startOfWeek('2026-09-17'))
    expect(monday).toBe('2026-09-14')
    expect(isoWeekNumber(monday)).toBe(38)
  })
})

describe('week labels', () => {
  it('formats a same-month range', () => {
    expect(weekRangeLabel('2026-09-14', 'es')).toMatch(/14–20/)
    expect(weekRangeLabel('2026-09-14', 'en')).toMatch(/14–20/)
  })

  it('formats week heading with number and range', () => {
    expect(formatWeekHeading('2026-09-17', 'es')).toMatch(/^Semana 38 · /)
    expect(formatWeekHeading('2026-09-17', 'en')).toMatch(/^Week 38 · /)
    expect(formatWeekHeading('2026-09-17', 'es')).toContain('2026')
  })
})
