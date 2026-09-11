import { describe, expect, it } from 'vitest'
import { dayMoment } from './dayMoment'

function atHour(hour: number): Date {
  return new Date(2026, 8, 11, hour, 0, 0)
}

describe('dayMoment', () => {
  it('maps local hours to morning, afternoon, evening, night', () => {
    expect(dayMoment(atHour(5))).toBe('morning')
    expect(dayMoment(atHour(11))).toBe('morning')
    expect(dayMoment(atHour(12))).toBe('afternoon')
    expect(dayMoment(atHour(17))).toBe('afternoon')
    expect(dayMoment(atHour(18))).toBe('evening')
    expect(dayMoment(atHour(21))).toBe('evening')
    expect(dayMoment(atHour(22))).toBe('night')
    expect(dayMoment(atHour(4))).toBe('night')
    expect(dayMoment(atHour(0))).toBe('night')
  })
})
