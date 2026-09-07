import { describe, expect, it } from 'vitest'
import { initialState } from './seed'
import {
  agendaCalendarDay,
  agendaTasks,
  attendingResults,
  dayLoad,
  dueAtForFilter,
  latestCommentOnDay,
  leastActiveAttending,
  pickerObjectives,
  pickerResults,
  planTotalRows,
  resultHealth,
  resultStaleThisWeek,
} from './selectors'
import type { AlephState, Comment, Objective, Result, Task } from '@/domain/types'

const NOW = new Date('2026-09-07T12:00:00')

function result(partial: Partial<Result> & Pick<Result, 'id' | 'name'>): Result {
  return {
    importance: 0,
    status: 'active',
    ...partial,
  }
}

function objective(partial: Partial<Objective> & Pick<Objective, 'id' | 'resultId' | 'name'>): Objective {
  return {
    importance: 1,
    currentStage: 'research',
    status: 'pending',
    ...partial,
  }
}

function task(partial: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    stage: 'research',
    estimatedHours: 1,
    difficulty: 'medium',
    importance: 0,
    status: 'pending',
    rewardApplied: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    ...partial,
  }
}

function comment(partial: Partial<Comment> & Pick<Comment, 'id' | 'parentType' | 'parentId' | 'body'>): Comment {
  return {
    createdAt: '2026-09-07T10:00:00.000Z',
    ...partial,
  }
}

function state(patch: Partial<AlephState>): AlephState {
  return { ...initialState('es'), ...patch }
}

describe('dueAtForFilter', () => {
  it('follows Hoy, Mañana, Elegir and Todas', () => {
    expect(dueAtForFilter('today', '', NOW)).toBe('2026-09-07')
    expect(dueAtForFilter('tomorrow', '', NOW)).toBe('2026-09-08')
    expect(dueAtForFilter('pick', '2026-09-20', NOW)).toBe('2026-09-20')
    expect(dueAtForFilter('undated', '', NOW)).toBeUndefined()
    expect(dueAtForFilter('week', '', NOW)).toBe('2026-09-07')
  })

  it('maps only Hoy and Elegir to a calendar day for the 24h bar', () => {
    expect(agendaCalendarDay('today', '', NOW)).toBe('2026-09-07')
    expect(agendaCalendarDay('pick', '2026-09-12', NOW)).toBe('2026-09-12')
    expect(agendaCalendarDay('tomorrow', '', NOW)).toBeUndefined()
    expect(agendaCalendarDay('week', '', NOW)).toBeUndefined()
    expect(agendaCalendarDay('undated', '', NOW)).toBeUndefined()
  })
})

describe('agendaTasks undated', () => {
  it('lists open tasks with no dueAt and no scheduledFor', () => {
    const s = state({
      tasks: [
        task({ id: 'open', title: 'loose' }),
        task({ id: 'dated', title: 'today', dueAt: '2026-09-07', scheduledFor: '2026-09-07' }),
        task({ id: 'done', title: 'done undated', status: 'done_on_time', completedAt: '2026-09-01T00:00:00.000Z' }),
      ],
    })
    expect(agendaTasks(s, 'undated', undefined, NOW).map((t) => t.id)).toEqual(['open'])
  })
})

describe('attending results and plan total', () => {
  it('counts only status=active', () => {
    const s = state({
      results: [
        result({ id: 'a', name: 'A', importance: 0, status: 'active' }),
        result({ id: 'p', name: 'P', importance: 1, status: 'paused' }),
        result({ id: 'x', name: 'X', importance: 2, status: 'archived' }),
      ],
    })
    expect(attendingResults(s).map((r) => r.id)).toEqual(['a'])
    expect(pickerResults(s).map((r) => r.id)).toEqual(['a', 'p'])
  })

  it('hides archived objectives from pickers', () => {
    const s = state({
      results: [result({ id: 'r', name: 'R' })],
      objectives: [
        objective({ id: 'live', resultId: 'r', name: 'Live' }),
        objective({ id: 'gone', resultId: 'r', name: 'Gone', archivedAt: '2026-01-01T00:00:00.000Z' }),
      ],
    })
    expect(pickerObjectives(s, 'r').map((o) => o.id)).toEqual(['live'])
  })

  it('prefers an execution next step and flags a stale week', () => {
    const s = state({
      results: [result({ id: 'r', name: 'Sport', importance: 0 })],
      objectives: [objective({ id: 'o', resultId: 'r', name: 'Train' })],
      tasks: [
        task({
          id: 'research',
          title: 'Read',
          resultId: 'r',
          objectiveId: 'o',
          stage: 'research',
        }),
        task({
          id: 'exec',
          title: 'Run',
          resultId: 'r',
          objectiveId: 'o',
          stage: 'execution',
          status: 'in_progress',
        }),
      ],
    })
    const rows = planTotalRows(s, NOW)
    expect(rows[0].next?.title).toBe('Run')
    expect(rows[0].stale).toBe(true)
    expect(resultHealth(s, 'r')).toEqual({
      key: 'planning.results.health.next',
      params: { title: 'Run' },
    })
  })

  it('picks the never-touched attending result as least active', () => {
    const s = state({
      results: [
        result({ id: 'busy', name: 'Busy', importance: 0 }),
        result({ id: 'quiet', name: 'Quiet', importance: 1 }),
      ],
      tasks: [
        task({
          id: 't1',
          title: 'Done',
          resultId: 'busy',
          status: 'done_on_time',
          completedAt: '2026-09-06T00:00:00.000Z',
          rewardApplied: true,
        }),
      ],
    })
    expect(leastActiveAttending(s)?.id).toBe('quiet')
    expect(resultStaleThisWeek(s, 'busy', NOW)).toBe(false)
    expect(resultStaleThisWeek(s, 'quiet', NOW)).toBe(true)
  })
})

describe('dayLoad', () => {
  it('sums open and completed-today hours and caps display at 24', () => {
    const s = state({
      tasks: [
        task({ id: 'a', title: 'A', estimatedHours: 10, dueAt: '2026-09-07', scheduledFor: '2026-09-07' }),
        task({
          id: 'b',
          title: 'B',
          estimatedHours: 20,
          dueAt: '2026-09-07',
          scheduledFor: '2026-09-07',
          status: 'done_on_time',
          completedAt: '2026-09-07T09:00:00.000Z',
          rewardApplied: true,
        }),
        task({
          id: 'old',
          title: 'Old',
          estimatedHours: 8,
          dueAt: '2026-09-07',
          scheduledFor: '2026-09-07',
          status: 'done_on_time',
          completedAt: '2026-09-01T09:00:00.000Z',
          rewardApplied: true,
        }),
      ],
    })
    const load = dayLoad(s, '2026-09-07')
    expect(load.hours).toBe(30)
    expect(load.capped).toBe(24)
    expect(load.overflow).toBe(true)
    expect(load.segments.map((seg) => seg.id)).toEqual(['a', 'b'])
  })
})

describe('literature day', () => {
  it('returns the latest comment from that day', () => {
    const s = state({
      comments: [
        comment({
          id: 'c1',
          parentType: 'task',
          parentId: 't',
          body: 'earlier',
          createdAt: '2026-09-07T08:00:00.000Z',
        }),
        comment({
          id: 'c2',
          parentType: 'task',
          parentId: 't',
          body: 'later',
          createdAt: '2026-09-07T11:00:00.000Z',
        }),
        comment({
          id: 'c3',
          parentType: 'result',
          parentId: 'r',
          body: 'yesterday',
          createdAt: '2026-09-06T11:00:00.000Z',
        }),
      ],
    })
    expect(latestCommentOnDay(s, '2026-09-07')?.body).toBe('later')
  })
})
