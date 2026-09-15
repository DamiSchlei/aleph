import { describe, expect, it } from 'vitest'
import { addMonths, monthDayKeys, startOfMonth, toDayKey } from './dates'

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
