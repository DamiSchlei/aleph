import { beforeEach, describe, expect, it } from 'vitest'
import {
  captureLooseTask,
  closeTask,
  completeTask,
  createObjective,
  createResult,
  createTask,
  createTaskSeries,
  executeTask,
  executeTaskWithNote,
  reopenTask,
  setObjectiveStatus,
  updateResult,
} from './actions'
import { getState, setState } from './store'
import { initialState } from './seed'

beforeEach(() => {
  setState(() => initialState('es'))
})

describe('task complete and reopen', () => {
  it('pays XP once; reopen returns to research without a second payout', () => {
    createResult({ name: 'Empresa' })
    const result = getState().results[0]
    const created = createTask({
      title: 'Paso',
      resultId: result.id,
      estimatedHours: 1,
      difficulty: 'low',
    })
    executeTask(created.id)
    const first = completeTask(created.id)
    expect(first?.paid).toBe(true)
    expect(first?.reward.xp).toBeGreaterThan(0)
    const xpAfterPay = getState().character.xp
    const moneyAfterPay = getState().character.money

    reopenTask(created.id)
    const reopened = getState().tasks.find((t) => t.id === created.id)!
    expect(reopened.status).toBe('pending')
    expect(reopened.stage).toBe('research')
    expect(reopened.rewardApplied).toBe(true)
    expect(getState().character.xp).toBe(xpAfterPay)

    const second = completeTask(created.id)
    expect(second?.paid).toBe(false)
    expect(second?.reward.xp).toBe(0)
    expect(getState().character.xp).toBe(xpAfterPay)
    expect(getState().character.money).toBe(moneyAfterPay)
    expect(getState().tasks.find((t) => t.id === created.id)?.status).toMatch(/^done_/)
  })
})

describe('createTaskSeries', () => {
  const friday = new Date('2026-09-11T12:00:00')

  it('creates one Task per weekday from today through Sunday, never past dates', () => {
    const created = createTaskSeries(
      {
        title: 'Entrenar',
        weekdays: [1, 5, 7],
        hoursPerBlock: 1.5,
        horizon: 'week',
      },
      friday,
    )
    expect(created.map((t) => t.dueAt)).toEqual(['2026-09-11', '2026-09-13'])
    expect(created.every((t) => t.seriesId && t.seriesId === created[0].seriesId)).toBe(true)
    expect(created.every((t) => t.estimatedHours === 1.5)).toBe(true)
    expect(created[0].seriesWeekdays).toEqual([1, 5, 7])
    expect(getState()).not.toHaveProperty('blocks')
  })

  it('spans today through month end and caps at 20', () => {
    const created = createTaskSeries(
      {
        title: 'Daily',
        weekdays: [1, 2, 3, 4, 5, 6, 7],
        hoursPerBlock: 1,
        horizon: 'month',
      },
      new Date('2026-09-01T12:00:00'),
    )
    expect(created).toHaveLength(20)
    expect(created[0].dueAt).toBe('2026-09-01')
    expect(created[19].dueAt).toBe('2026-09-20')
    expect(created.every((t) => t.dueAt && t.dueAt >= '2026-09-01')).toBe(true)
    expect(created.every((t) => t.dueAt && t.dueAt <= '2026-09-30')).toBe(true)
  })

  it('skips a day that already has a task for the same seriesId', () => {
    createTask({
      title: 'Entrenar',
      dueAt: '2026-09-11',
      scheduledFor: '2026-09-11',
      seriesId: 'series_keep',
      seriesWeekdays: [5, 6],
    })
    const created = createTaskSeries(
      {
        title: 'Entrenar',
        weekdays: [5, 6],
        hoursPerBlock: 1,
        horizon: 'week',
        seriesId: 'series_keep',
      },
      friday,
    )
    expect(created.map((t) => t.dueAt)).toEqual(['2026-09-12'])
    expect(getState().tasks.filter((t) => t.seriesId === 'series_keep')).toHaveLength(2)
  })

  it('does not stamp a series onto a composer capture', () => {
    const loose = captureLooseTask('Anotar', { dueAt: '2026-09-11' })
    expect(loose?.seriesId).toBeUndefined()
    expect(loose?.seriesWeekdays).toBeUndefined()
  })
})

describe('executeTaskWithNote', () => {
  it('refuses an empty comment and does not execute', () => {
    const created = createTask({ title: 'Escribir', estimatedHours: 1, difficulty: 'low' })
    expect(executeTaskWithNote(created.id, '   ')).toBe(false)
    expect(getState().tasks.find((t) => t.id === created.id)?.status).toBe('pending')
    expect(getState().tasks.find((t) => t.id === created.id)?.stage).toBe('research')
    expect(getState().comments).toHaveLength(0)
  })

  it('executes with a comment and does not pay', () => {
    const created = createTask({ title: 'Escribir', estimatedHours: 1, difficulty: 'low' })
    const xpBefore = getState().character.xp
    expect(executeTaskWithNote(created.id, 'Voy a escribir')).toBe(true)
    const task = getState().tasks.find((t) => t.id === created.id)!
    expect(task.stage).toBe('execution')
    expect(task.status).toBe('in_progress')
    expect(task.rewardApplied).toBe(false)
    expect(getState().character.xp).toBe(xpBefore)
    expect(getState().comments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ parentType: 'task', parentId: created.id, body: 'Voy a escribir' }),
      ]),
    )
  })
})

describe('closeTask', () => {
  it('does not advance without hours and a comment', () => {
    const created = createTask({ title: 'Cerrar', estimatedHours: 2, difficulty: 'low' })
    expect(closeTask(created.id, { actualHours: 0, comment: 'Nota' })).toBeNull()
    expect(closeTask(created.id, { actualHours: 1, comment: '   ' })).toBeNull()
    const task = getState().tasks.find((t) => t.id === created.id)!
    expect(task.status).toBe('pending')
    expect(task.rewardApplied).toBe(false)
    expect(getState().comments).toHaveLength(0)
    expect(getState().character.xp).toBe(0)
  })

  it('uses actualHours for the payout and persists the comment', () => {
    const created = createTask({ title: 'Cerrar', estimatedHours: 4, difficulty: 'low' })
    const outcome = closeTask(created.id, { actualHours: 1, comment: 'Quedó el cierre' })
    expect(outcome?.paid).toBe(true)
    expect(outcome?.reward.hours).toBe(1)
    expect(outcome?.reward.xp).toBe(10)
    expect(getState().character.xp).toBe(10)
    const task = getState().tasks.find((t) => t.id === created.id)!
    expect(task.actualHours).toBe(1)
    expect(task.status).toMatch(/^done_/)
    expect(getState().comments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ parentType: 'task', parentId: created.id, body: 'Quedó el cierre' }),
      ]),
    )
  })

  it('pays once; reopen and close again does not pay a second currency', () => {
    const created = createTask({ title: 'Cerrar', estimatedHours: 1, difficulty: 'low' })
    const first = closeTask(created.id, { actualHours: 1, comment: 'Primera' })
    expect(first?.paid).toBe(true)
    const xpAfterPay = getState().character.xp
    const moneyAfterPay = getState().character.money

    reopenTask(created.id)
    const second = closeTask(created.id, { actualHours: 1, comment: 'Segunda' })
    expect(second?.paid).toBe(false)
    expect(second?.reward.xp).toBe(0)
    expect(getState().character.xp).toBe(xpAfterPay)
    expect(getState().character.money).toBe(moneyAfterPay)
    expect(getState().comments.filter((c) => c.parentId === created.id)).toHaveLength(2)
  })
})

describe('result pillar', () => {
  it('defaults createResult pillar to mind and derives from skillId', () => {
    const plain = createResult({ name: 'Sin skill' })
    expect(plain.pillar).toBe('mind')
    const body = createResult({ name: 'Cuerpo', skillId: 'health' })
    expect(body.pillar).toBe('body')
    const explicit = createResult({ name: 'Alma', skillId: 'study', pillar: 'soul' })
    expect(explicit.pillar).toBe('soul')
  })

  it('does not overwrite an existing pillar when only skillId changes', () => {
    const created = createResult({ name: 'Empresa', pillar: 'soul' })
    updateResult(created.id, { skillId: 'health' })
    expect(getState().results.find((r) => r.id === created.id)?.pillar).toBe('soul')
  })
})

describe('objective quota and status', () => {
  it('frees a quota slot when an objective is marked done', () => {
    const result = createResult({ name: 'Cuota' })
    for (let i = 0; i < 4; i++) {
      createObjective({ resultId: result.id, name: `O${i}` })
    }
    expect(() => createObjective({ resultId: result.id, name: 'Extra' })).toThrow(
      'MAX_OBJECTIVES_PER_RESULT',
    )

    const fourth = getState().objectives.find((o) => o.name === 'O3')!
    setObjectiveStatus(fourth.id, 'done')
    expect(createObjective({ resultId: result.id, name: 'Nuevo' }).name).toBe('Nuevo')
  })

  it('marking done does not change character XP, skill XP, or money', () => {
    const result = createResult({ name: 'Empresa' })
    const objective = createObjective({ resultId: result.id, name: 'Cerrar' })
    const before = getState()
    const xp = before.character.xp
    const money = before.character.money
    const skillXp = before.skills.map((s) => s.xp)

    setObjectiveStatus(objective.id, 'done')

    const after = getState()
    expect(after.character.xp).toBe(xp)
    expect(after.character.money).toBe(money)
    expect(after.skills.map((s) => s.xp)).toEqual(skillXp)
    expect(after.objectives.find((o) => o.id === objective.id)?.archivedAt).toBeUndefined()
    expect(after.objectives.find((o) => o.id === objective.id)?.status).toBe('done')
  })
})
