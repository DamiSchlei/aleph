import { beforeEach, describe, expect, it } from 'vitest'
import {
  addComment,
  addWalkerEntry,
  createObjective,
  createResult,
  completeTask,
  createTask,
  executeTask,
  reopenTask,
  setWalkerMood,
} from './actions'
import { journalFor } from './selectors'
import { getState, setState } from './store'
import { initialState } from './seed'
import { normalize } from './storage'

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

describe('result law and objective ser', () => {
  it('saves a result with only a name', () => {
    const result = createResult({ name: '  Primera venta  ' })
    expect(result.name).toBe('Primera venta')
    expect(result.law).toBeUndefined()
    expect(getState().results[0].law).toBeUndefined()
  })

  it('persists optional law and ser', () => {
    const result = createResult({
      name: 'Club de running',
      law: '  Ser constante para que otro se sume  ',
    })
    expect(result.law).toBe('Ser constante para que otro se sume')
    const objective = createObjective({
      resultId: result.id,
      name: 'Salir tres veces',
      ser: '  Visible y puntual  ',
    })
    expect(objective.ser).toBe('Visible y puntual')
    expect(getState().objectives[0].ser).toBe('Visible y puntual')
  })
})

describe('walker journal', () => {
  it('stores walker entries outside result journals', () => {
    const result = createResult({ name: 'Empresa' })
    addComment('result', result.id, 'Nota de la empresa')
    addWalkerEntry({ body: 'Voy tirante', mood: 'tight' })
    const rolled = journalFor(getState(), 'result', result.id)
    expect(rolled.map((entry) => entry.comment.body)).toEqual(['Nota de la empresa'])
    expect(getState().walkerEntries).toHaveLength(1)
    expect(getState().walkerEntries[0].body).toBe('Voy tirante')
    expect(getState().walkerEntries[0].mood).toBe('tight')
  })

  it('patches today’s latest entry mood and ignores empty bodies', () => {
    expect(addWalkerEntry({ body: '   ' })).toBeNull()
    addWalkerEntry({ body: 'Primera' })
    setWalkerMood('low')
    expect(getState().walkerEntries[0].mood).toBe('low')
    setWalkerMood('up')
    expect(getState().walkerEntries[0].mood).toBe('up')
  })
})

describe('normalize old snapshots', () => {
  it('fills walkerEntries and keeps results without law', () => {
    const loaded = normalize({
      version: 1,
      character: { name: 'Aleph', locale: 'es' },
      results: [{ id: 'r1', name: 'Viejo', importance: 0, status: 'active' }],
      objectives: [],
      tasks: [],
      comments: [],
      relations: [],
    })
    expect(loaded.walkerEntries).toEqual([])
    expect(loaded.results[0].law).toBeUndefined()
    expect(loaded.objectives).toEqual([])
  })
})
