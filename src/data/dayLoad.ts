import { isTaskDone } from '@/domain/economy'
import { addDays, startOfWeek, toDayKey, weekDayKeys } from '@/domain/dates'
import type { AlephState, Task } from '@/domain/types'
import { taskDayKey, tasksForDay } from './selectors'

/** Hours a task counts for capacity math. */
export function taskHourValue(task: Task): number {
  if (isTaskDone(task.status) && task.actualHours !== undefined) return task.actualHours
  return task.estimatedHours
}

/** Open (not done) commitment on a day — drives free capacity. */
export function plannedHoursForDay(state: AlephState, dayKey: string): number {
  return tasksForDay(state, dayKey)
    .filter((task) => !isTaskDone(task.status))
    .reduce((sum, task) => sum + task.estimatedHours, 0)
}

/** Hours closed on a calendar day (by completedAt). */
export function closedHoursForDay(state: AlephState, dayKey: string): number {
  return state.tasks
    .filter(
      (task) =>
        isTaskDone(task.status) &&
        task.status !== 'cancelled' &&
        task.completedAt &&
        toDayKey(task.completedAt) === dayKey,
    )
    .reduce((sum, task) => sum + taskHourValue(task), 0)
}

export function freeHoursForDay(cap: number, planned: number): number {
  return Math.max(0, cap - planned)
}

export function lostHoursForDay(cap: number, closed: number): number {
  return Math.max(0, cap - closed)
}

export function weekCapHours(cap: number): number {
  return cap * 7
}

export function plannedHoursForWeek(state: AlephState, weekStartKey: string): number {
  return weekDayKeys(weekStartKey).reduce(
    (sum, day) => sum + plannedHoursForDay(state, day),
    0,
  )
}

export function closedHoursForWeek(state: AlephState, weekStartKey: string): number {
  return weekDayKeys(weekStartKey).reduce(
    (sum, day) => sum + closedHoursForDay(state, day),
    0,
  )
}

/** Open hours still sitting on the week (same as planned for open tasks). */
export function openHoursForWeek(state: AlephState, weekStartKey: string): number {
  return plannedHoursForWeek(state, weekStartKey)
}

/** Monday keys for a ±window week pager centered on the week of `anchor`. */
export function buildWeekStarts(anchor: Date, window = 6): string[] {
  const center = startOfWeek(anchor)
  return Array.from({ length: window * 2 + 1 }, (_, i) =>
    toDayKey(addDays(center, (i - window) * 7)),
  )
}

export function weekStartKeyOf(dayKey: string): string {
  return toDayKey(startOfWeek(dayKey))
}

/** Committed (open) hours for a day — alias used by week rows. */
export function committedHoursForDay(state: AlephState, dayKey: string): number {
  return plannedHoursForDay(state, dayKey)
}

/** All non-cancelled tasks on a day (including done) — for week row closed+open display. */
export function dayTaskHoursBreakdown(state: AlephState, dayKey: string): {
  committed: number
  closed: number
} {
  return {
    committed: plannedHoursForDay(state, dayKey),
    closed: closedHoursForDay(state, dayKey),
  }
}

/** True if any non-cancelled task is scheduled on the day (for empty ghost treatment). */
export function dayHasBlocks(state: AlephState, dayKey: string): boolean {
  return tasksForDay(state, dayKey).length > 0
}

export function tasksScheduledOnDay(state: AlephState, dayKey: string): Task[] {
  return state.tasks.filter(
    (task) => task.status !== 'cancelled' && taskDayKey(task) === dayKey,
  )
}
