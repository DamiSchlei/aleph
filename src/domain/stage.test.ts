import { describe, expect, it } from 'vitest'
import { canAdvance, nextStage, openedStages, previousStage, STAGE_ORDER } from './stage'
import { canAddObjective, MAX_OBJECTIVES_PER_RESULT } from './limits'
import type { Objective } from './types'

describe('stage order', () => {
  it('is research, execution, review', () => {
    expect(STAGE_ORDER).toEqual(['research', 'execution', 'review'])
  })

  it('cannot jump research to review', () => {
    expect(canAdvance('research', 'execution')).toBe(true)
    expect(canAdvance('execution', 'review')).toBe(true)
    expect(canAdvance('research', 'review')).toBe(false)
  })

  it('walks forward and back one step at a time', () => {
    expect(nextStage('research')).toBe('execution')
    expect(nextStage('review')).toBeNull()
    expect(previousStage('research')).toBeNull()
    expect(previousStage('review')).toBe('execution')
  })

  it('keeps reached stages open for new tasks', () => {
    expect(openedStages('research')).toEqual(['research'])
    expect(openedStages('execution')).toEqual(['research', 'execution'])
  })
})

describe('objective limit', () => {
  const make = (id: string, archivedAt?: string): Objective => ({
    id,
    resultId: 'r1',
    name: id,
    importance: 1,
    currentStage: 'research',
    status: 'pending',
    archivedAt,
  })

  it('allows up to four active objectives per result', () => {
    expect(MAX_OBJECTIVES_PER_RESULT).toBe(4)
    const four = ['a', 'b', 'c', 'd'].map((id) => make(id))
    expect(canAddObjective(four.slice(0, 3), 'r1')).toBe(true)
    expect(canAddObjective(four, 'r1')).toBe(false)
  })

  it('does not count archived objectives', () => {
    const objectives = [make('a'), make('b'), make('c'), make('d', '2026-01-01T00:00:00.000Z')]
    expect(canAddObjective(objectives, 'r1')).toBe(true)
  })

  it('counts per result', () => {
    const objectives = [make('a'), make('b'), make('c'), make('d')]
    expect(canAddObjective(objectives, 'r2')).toBe(true)
  })
})
