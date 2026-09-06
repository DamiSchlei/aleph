import { describe, expect, it } from 'vitest'
import {
  addCharacterXp,
  addSkillXp,
  computeReward,
  isOnTime,
  shouldPayReward,
  xpToNextForLevel,
} from './economy'

describe('computeReward', () => {
  it('uses hours x difficulty with no due date', () => {
    expect(computeReward({ estimatedHours: 2, difficulty: 'low' })).toMatchObject({
      xp: 20,
      money: 10,
      hours: 2,
      onTime: true,
      status: 'done_on_time',
    })
    expect(computeReward({ estimatedHours: 2, difficulty: 'medium' })).toMatchObject({
      xp: 28,
      money: 14,
    })
    expect(computeReward({ estimatedHours: 2, difficulty: 'high' })).toMatchObject({
      xp: 36,
      money: 18,
    })
  })

  it('prefers actualHours over estimatedHours', () => {
    const reward = computeReward({ estimatedHours: 4, actualHours: 1, difficulty: 'low' })
    expect(reward.hours).toBe(1)
    expect(reward.xp).toBe(10)
  })

  it('adds 25% to xp and money when completed on or before the due date', () => {
    const reward = computeReward({
      estimatedHours: 2,
      difficulty: 'low',
      dueAt: '2026-03-10',
      completedAt: '2026-03-10T21:00:00',
    })
    // base 20 / 10, +25%
    expect(reward).toMatchObject({ xp: 25, money: 13, onTime: true, status: 'done_on_time' })
  })

  it('halves money and leaves xp intact when late', () => {
    const reward = computeReward({
      estimatedHours: 2,
      difficulty: 'low',
      dueAt: '2026-03-10',
      completedAt: '2026-03-12T09:00:00',
    })
    expect(reward).toMatchObject({ xp: 20, money: 5, onTime: false, status: 'done_late' })
    expect(reward.daysLate).toBe(2)
  })

  it('adds 20% for a task under an active result', () => {
    const reward = computeReward({ estimatedHours: 2, difficulty: 'low', activeResult: true })
    expect(reward).toMatchObject({ xp: 24, money: 12 })
  })

  it('stacks the on-time bonus and the active-result bonus in order', () => {
    const reward = computeReward({
      estimatedHours: 2,
      difficulty: 'medium',
      dueAt: '2026-03-10',
      completedAt: '2026-03-09T10:00:00',
      activeResult: true,
    })
    // base 28 -> x1.25 = 35 -> x1.2 = 42
    expect(reward.xp).toBe(42)
    // base 14 -> x1.25 = 17.5 -> x1.2 = 21
    expect(reward.money).toBe(21)
  })

  it('applies the active-result bonus to halved money when late', () => {
    const reward = computeReward({
      estimatedHours: 2,
      difficulty: 'low',
      dueAt: '2026-03-10',
      completedAt: '2026-03-11T10:00:00',
      activeResult: true,
    })
    expect(reward.xp).toBe(24)
    expect(reward.money).toBe(6)
  })

  it('treats a task with no due date as on time', () => {
    expect(isOnTime(undefined, new Date())).toBe(true)
  })

  it('counts a date-only due date as due at the end of that day', () => {
    expect(isOnTime('2026-03-10', '2026-03-10T23:30:00')).toBe(true)
    expect(isOnTime('2026-03-10', '2026-03-11T00:30:00')).toBe(false)
  })
})

describe('shouldPayReward', () => {
  it('refuses to pay a task twice', () => {
    expect(shouldPayReward({ rewardApplied: false })).toBe(true)
    expect(shouldPayReward({ rewardApplied: true })).toBe(false)
  })
})

describe('addCharacterXp', () => {
  it('accumulates xp without levelling', () => {
    expect(addCharacterXp({ level: 1, xp: 10, xpToNext: 100 }, 30)).toEqual({
      level: 1,
      xp: 40,
      xpToNext: 100,
      levelsGained: 0,
    })
  })

  it('levels up and carries the overflow', () => {
    expect(addCharacterXp({ level: 1, xp: 90, xpToNext: 100 }, 30)).toEqual({
      level: 2,
      xp: 20,
      xpToNext: 200,
      levelsGained: 1,
    })
  })

  it('levels up more than once from a single grant', () => {
    expect(addCharacterXp({ level: 1, xp: 0, xpToNext: 100 }, 350)).toEqual({
      level: 3,
      xp: 50,
      xpToNext: 300,
      levelsGained: 2,
    })
  })

  it('scales the threshold with the level', () => {
    expect(xpToNextForLevel(1)).toBe(100)
    expect(xpToNextForLevel(7)).toBe(700)
  })
})

describe('addSkillXp', () => {
  it('keeps xp inside 0-100', () => {
    expect(addSkillXp({ level: 1, xp: 80 }, 45)).toEqual({ level: 2, xp: 25, levelsGained: 1 })
  })

  it('rolls over several skill levels', () => {
    expect(addSkillXp({ level: 2, xp: 50 }, 260)).toEqual({ level: 5, xp: 10, levelsGained: 3 })
  })
})
