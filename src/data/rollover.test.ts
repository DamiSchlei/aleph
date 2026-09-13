import { beforeEach, describe, expect, it } from 'vitest'
import { captureLooseTask, rollPendingTasksToToday } from './actions'
import { tasksForDay } from './selectors'
import { getState, setState } from './store'
import { initialState } from './seed'

beforeEach(() => {
  setState(() => initialState('es'))
})

describe('rollPendingTasksToToday', () => {
  it('moves open past tasks onto today at the top', () => {
    captureLooseTask('Ayer', { scheduledFor: '2026-09-10', dueAt: '2026-09-10' })
    captureLooseTask('Hoy', { scheduledFor: '2026-09-13', dueAt: '2026-09-13' })
    rollPendingTasksToToday(new Date(2026, 8, 13))
    const today = tasksForDay(getState(), '2026-09-13')
    expect(today.map((task) => task.title)).toEqual(['Ayer', 'Hoy'])
  })
})
