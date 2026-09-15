import { describe, expect, it } from 'vitest'
import {
  activeObjectivesOfResult,
  canAddObjective,
  completedObjectivesOfResult,
  livingObjectivesOfResult,
} from './limits'
import type { Objective } from './types'

function obj(
  partial: Pick<Objective, 'id' | 'status'> & Partial<Objective>,
): Objective {
  return {
    resultId: 'r1',
    name: partial.id,
    importance: 0,
    currentStage: 'research',
    ...partial,
  }
}

describe('objective quota', () => {
  it('3 active + 1 done → canAdd true', () => {
    const list = [
      obj({ id: 'a', status: 'pending' }),
      obj({ id: 'b', status: 'in_progress' }),
      obj({ id: 'c', status: 'blocked' }),
      obj({ id: 'd', status: 'done' }),
    ]
    expect(activeObjectivesOfResult(list, 'r1')).toHaveLength(3)
    expect(completedObjectivesOfResult(list, 'r1')).toHaveLength(1)
    expect(livingObjectivesOfResult(list, 'r1')).toHaveLength(4)
    expect(canAddObjective(list, 'r1')).toBe(true)
  })

  it('4 active → canAdd false', () => {
    const list = [
      obj({ id: 'a', status: 'pending' }),
      obj({ id: 'b', status: 'pending' }),
      obj({ id: 'c', status: 'pending' }),
      obj({ id: 'd', status: 'pending' }),
    ]
    expect(canAddObjective(list, 'r1')).toBe(false)
  })

  it('4 done, 0 active → canAdd true', () => {
    const list = [
      obj({ id: 'a', status: 'done' }),
      obj({ id: 'b', status: 'done' }),
      obj({ id: 'c', status: 'done' }),
      obj({ id: 'd', status: 'done' }),
    ]
    expect(activeObjectivesOfResult(list, 'r1')).toHaveLength(0)
    expect(canAddObjective(list, 'r1')).toBe(true)
  })

  it('archived never counts as active or living', () => {
    const list = [
      obj({ id: 'a', status: 'pending', archivedAt: '2026-01-01T00:00:00.000Z' }),
      obj({ id: 'b', status: 'done', archivedAt: '2026-01-01T00:00:00.000Z' }),
      obj({ id: 'c', status: 'pending' }),
    ]
    expect(activeObjectivesOfResult(list, 'r1').map((o) => o.id)).toEqual(['c'])
    expect(livingObjectivesOfResult(list, 'r1').map((o) => o.id)).toEqual(['c'])
    expect(completedObjectivesOfResult(list, 'r1')).toHaveLength(0)
  })
})
