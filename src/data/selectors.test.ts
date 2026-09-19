import { describe, expect, it } from 'vitest'
import { initialState } from './seed'
import {
  agendaCalendarDay,
  agendaTasks,
  attendingResults,
  blockContext,
  dayLoad,
  dueAtForFilter,
  featuredAgendaTask,
  latestCommentOnDay,
  leastActiveAttending,
  pickerObjectives,
  pickerResults,
  planTotalRows,
  resultHealth,
  resultRailColor,
  resultStaleThisWeek,
  resultWeekStats,
  trackingStats,
  weekSeriesPulse,
  journalFor,
} from './selectors'
import type { AlephState, Comment, Objective, Result, Task } from '@/domain/types'

const NOW = new Date('2026-09-07T12:00:00')

function result(partial: Partial<Result> & Pick<Result, 'id' | 'name'>): Result {
  return {
    importance: 0,
    status: 'active',
    pillar: 'mind',
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

describe('featuredAgendaTask', () => {
  it('picks the first non-done agenda task and prefers in_progress', () => {
    const s = state({
      tasks: [
        task({ id: 'done', title: 'Done', dueAt: '2026-09-07', status: 'done_on_time', completedAt: '2026-09-07T09:00:00.000Z' }),
        task({ id: 'pending', title: 'Pending', dueAt: '2026-09-07', status: 'pending' }),
        task({ id: 'active', title: 'Active', dueAt: '2026-09-07', status: 'in_progress' }),
      ],
    })
    expect(featuredAgendaTask(s, 'today', undefined, NOW)?.id).toBe('active')
  })

  it('returns undefined when every agenda task is done', () => {
    const s = state({
      tasks: [
        task({ id: 'done', title: 'Done', dueAt: '2026-09-07', status: 'done_on_time', completedAt: '2026-09-07T09:00:00.000Z' }),
      ],
    })
    expect(featuredAgendaTask(s, 'today', undefined, NOW)).toBeUndefined()
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

  it('hides archived and done objectives from pickers', () => {
    const s = state({
      results: [result({ id: 'r', name: 'R' })],
      objectives: [
        objective({ id: 'live', resultId: 'r', name: 'Live' }),
        objective({ id: 'done', resultId: 'r', name: 'Done', status: 'done' }),
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

describe('weekSeriesPulse', () => {
  const friday = new Date('2026-09-11T12:00:00')
  const weekStart = new Date('2026-09-07T00:00:00')

  it('counts planned, done, and missed blocks for the week', () => {
    const s = state({
      tasks: [
        task({
          id: 'mon',
          title: 'Entrenar',
          seriesId: 's1',
          dueAt: '2026-09-07',
          status: 'pending',
        }),
        task({
          id: 'wed',
          title: 'Entrenar',
          seriesId: 's1',
          dueAt: '2026-09-09',
          status: 'done_on_time',
          completedAt: '2026-09-09T18:00:00.000Z',
          rewardApplied: true,
        }),
        task({
          id: 'fri',
          title: 'Entrenar',
          seriesId: 's1',
          dueAt: '2026-09-11',
          status: 'pending',
        }),
        task({
          id: 'next',
          title: 'Entrenar',
          seriesId: 's1',
          dueAt: '2026-09-14',
          status: 'pending',
        }),
      ],
    })
    expect(weekSeriesPulse(s, weekStart, friday)).toEqual([
      { seriesId: 's1', title: 'Entrenar', planned: 3, done: 1, missed: 1 },
    ])
  })
})

describe('journalFor', () => {
  it('does not roll objective or task comments into a result journal', () => {
    const s = state({
      results: [result({ id: 'r', name: 'R' })],
      objectives: [objective({ id: 'o', resultId: 'r', name: 'O' })],
      tasks: [task({ id: 't', title: 'T', resultId: 'r', objectiveId: 'o' })],
      comments: [
        comment({ id: 'cr', parentType: 'result', parentId: 'r', body: 'on result' }),
        comment({ id: 'co', parentType: 'objective', parentId: 'o', body: 'on objective' }),
        comment({ id: 'ct', parentType: 'task', parentId: 't', body: 'on task' }),
      ],
    })
    expect(journalFor(s, 'result', 'r').map((e) => e.comment.id)).toEqual(['cr'])
  })

  it('rolls task comments into an objective journal but not the reverse', () => {
    const s = state({
      results: [result({ id: 'r', name: 'R' })],
      objectives: [objective({ id: 'o', resultId: 'r', name: 'O' })],
      tasks: [task({ id: 't', title: 'T', objectiveId: 'o' })],
      comments: [
        comment({ id: 'co', parentType: 'objective', parentId: 'o', body: 'obj' }),
        comment({ id: 'ct', parentType: 'task', parentId: 't', body: 'task' }),
      ],
    })
    expect(journalFor(s, 'objective', 'o').map((e) => e.comment.id).sort()).toEqual(['co', 'ct'])
    expect(journalFor(s, 'task', 't').map((e) => e.comment.id)).toEqual(['ct'])
  })

  it('keeps the character journal separate from work threads', () => {
    const base = initialState('es')
    const s = state({
      comments: [
        comment({
          id: 'cc',
          parentType: 'character',
          parentId: base.character.id,
          body: 'across the work',
        }),
        comment({ id: 'ct', parentType: 'task', parentId: 't', body: 'task note' }),
      ],
    })
    expect(journalFor(s, 'character', base.character.id).map((e) => e.comment.body)).toEqual([
      'across the work',
    ])
    expect(journalFor(s, 'task', 't').map((e) => e.comment.body)).toEqual(['task note'])
  })
})

describe('blockContext', () => {
  it('marks anchored tasks with objective and result skill color', () => {
    const s = state({
      results: [result({ id: 'r', name: 'Literatura', skillId: 'study', pillar: 'mind' })],
      objectives: [objective({ id: 'o', resultId: 'r', name: 'Capítulo' })],
      tasks: [
        task({
          id: 't',
          title: 'Escribir',
          objectiveId: 'o',
          scheduledStart: '09:00',
          scheduledEnd: '10:30',
          doneCheck: 'Borrador listo',
          estimatedHours: 1.5,
        }),
      ],
    })
    const ctx = blockContext(s, s.tasks[0])
    expect(ctx.kind).toBe('anchored')
    expect(ctx.result?.name).toBe('Literatura')
    expect(ctx.objective?.name).toBe('Capítulo')
    expect(ctx.color).toBe('#60a5fa')
    expect(ctx.timeRange).toEqual({ start: '09:00', end: '10:30' })
    expect(ctx.doneWhen).toBe('Borrador listo')
    expect(ctx.hours).toBe(1.5)
  })

  it('inherits result from objective when task.resultId is missing', () => {
    const s = state({
      results: [result({ id: 'r', name: 'Empresa', skillId: 'work', pillar: 'body' })],
      objectives: [objective({ id: 'o', resultId: 'r', name: 'MVP' })],
      tasks: [task({ id: 't', title: 'Ship', objectiveId: 'o' })],
    })
    const ctx = blockContext(s, s.tasks[0])
    expect(ctx.kind).toBe('anchored')
    expect(ctx.result?.id).toBe('r')
    expect(ctx.color).toBe('#facc15')
  })

  it('marks result-only and loose kinds', () => {
    const s = state({
      results: [result({ id: 'r', name: 'Arte', skillId: 'creativity', pillar: 'soul' })],
      tasks: [
        task({ id: 't1', title: 'Sketch', resultId: 'r' }),
        task({ id: 't2', title: 'Loose note' }),
      ],
    })
    expect(blockContext(s, s.tasks[0]).kind).toBe('result-only')
    expect(blockContext(s, s.tasks[0]).color).toBe('#a78bfa')
    expect(blockContext(s, s.tasks[1]).kind).toBe('loose')
    expect(blockContext(s, s.tasks[1]).color).toContain('amber')
  })

  it('falls back to pillar color when no skill is set', () => {
    const s = state({
      results: [result({ id: 'r', name: 'Sin skill', pillar: 'mind' })],
      tasks: [task({ id: 't', title: 'Paso', resultId: 'r' })],
    })
    expect(blockContext(s, s.tasks[0]).color).toBe('#2F6BFF')
  })
})

describe('trackingStats', () => {
  it('scopes per-day and week totals to the ISO week of the anchor', () => {
    const s = state({
      tasks: [
        task({
          id: 'prev',
          title: 'Semana anterior',
          status: 'done_on_time',
          completedAt: '2026-09-13T15:00:00',
          estimatedHours: 2,
        }),
        task({
          id: 'in-week',
          title: 'Esta semana',
          status: 'done_on_time',
          completedAt: '2026-09-16T15:00:00',
          estimatedHours: 1.5,
        }),
        task({
          id: 'late-week',
          title: 'Tarde',
          status: 'done_late',
          completedAt: '2026-09-18T15:00:00',
          estimatedHours: 1,
        }),
      ],
    })
    const stats = trackingStats(s, '2026-09-18')
    expect(stats.completed).toBe(3)
    expect(stats.weekCompleted).toBe(2)
    expect(stats.weekOnTime).toBe(1)
    expect(stats.weekHours).toBe(2.5)
    expect(stats.perDay).toHaveLength(7)
    expect(stats.perDay[0]?.dayKey).toBe('2026-09-14')
    expect(stats.perDay[6]?.dayKey).toBe('2026-09-20')
    expect(stats.perDay.find((d) => d.dayKey === '2026-09-16')?.count).toBe(1)
    expect(stats.perDay.find((d) => d.dayKey === '2026-09-13')).toBeUndefined()
  })
})

describe('resultWeekStats', () => {
  it('counts planned and completed load for the selected week only', () => {
    const s = state({
      results: [result({ id: 'r', name: 'Arte', skillId: 'creativity', pillar: 'soul' })],
      tasks: [
        task({
          id: 'planned-done',
          title: 'A',
          resultId: 'r',
          scheduledFor: '2026-09-16',
          dueAt: '2026-09-16',
          status: 'done_on_time',
          completedAt: '2026-09-16T12:00:00',
          estimatedHours: 2,
        }),
        task({
          id: 'planned-open',
          title: 'B',
          resultId: 'r',
          scheduledFor: '2026-09-17',
          dueAt: '2026-09-17',
          estimatedHours: 1,
        }),
        task({
          id: 'other-week',
          title: 'C',
          resultId: 'r',
          scheduledFor: '2026-09-10',
          dueAt: '2026-09-10',
          status: 'done_on_time',
          completedAt: '2026-09-10T12:00:00',
          estimatedHours: 4,
        }),
      ],
    })
    const week = resultWeekStats(s, 'r', '2026-09-18')
    expect(week.planned).toBe(2)
    expect(week.done).toBe(1)
    expect(week.hours).toBe(2)
    expect(week.ratio).toBe(0.5)
    expect(resultRailColor(s, s.results[0])).toBe('#a78bfa')
  })
})

