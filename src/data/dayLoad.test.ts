import { describe, expect, it } from 'vitest'
import {
  closedHoursForDay,
  freeHoursForDay,
  lostHoursForDay,
  plannedHoursForDay,
  weekCapHours,
} from './dayLoad'
import type { AlephState, Task } from '@/domain/types'

function task(partial: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    stage: 'research',
    estimatedHours: 1,
    difficulty: 'medium',
    importance: 0,
    status: 'pending',
    rewardApplied: false,
    createdAt: '2026-09-14T12:00:00.000Z',
    ...partial,
  }
}

function state(tasks: Task[]): AlephState {
  return {
    version: 1,
    character: {
      id: 'character',
      name: 'Nova',
      level: 1,
      xp: 0,
      xpToNext: 100,
      money: 0,
      avatar: {
        skinId: 'skin_sand',
        hairId: 'hair_short',
        eyesId: 'eyes_dark',
        outfitId: 'outfit_tee',
        accessoryId: 'accessory_none',
        backgroundId: 'bg_dawn',
      },
      ownedCosmeticIds: [],
      locale: 'es',
      dailyHourCap: 5,
      onboarded: true,
    },
    skills: [],
    results: [],
    objectives: [],
    tasks,
    comments: [],
    relations: [],
  }
}

describe('dayLoad', () => {
  it('planned is open estimated hours only', () => {
    const s = state([
      task({ id: 'a', title: 'open', scheduledFor: '2026-09-14', estimatedHours: 2 }),
      task({
        id: 'b',
        title: 'done',
        scheduledFor: '2026-09-14',
        estimatedHours: 3,
        status: 'done_on_time',
        completedAt: '2026-09-14T18:00:00.000Z',
        actualHours: 3,
      }),
    ])
    expect(plannedHoursForDay(s, '2026-09-14')).toBe(2)
  })

  it('closed uses actualHours when set', () => {
    const s = state([
      task({
        id: 'b',
        title: 'done',
        scheduledFor: '2026-09-13',
        estimatedHours: 2,
        status: 'done_on_time',
        completedAt: '2026-09-14T10:00:00.000Z',
        actualHours: 1,
      }),
    ])
    expect(closedHoursForDay(s, '2026-09-14')).toBe(1)
  })

  it('free and lost match DoD examples', () => {
    expect(freeHoursForDay(5, 2)).toBe(3)
    expect(lostHoursForDay(5, 1)).toBe(4)
    expect(weekCapHours(5)).toBe(35)
  })
})
