import { beforeEach, describe, expect, it } from 'vitest'
import {
  completeTask,
  createResult,
  createTask,
  executeTask,
  reopenTask,
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
