import { isTaskDone } from '@/domain/economy'
import { lastSevenDayKeys, startOfWeek, toDayKey, deadlineOf, daysBetween } from '@/domain/dates'
import { STAGE_ORDER } from '@/domain/stage'
import type {
  AlephState,
  Comment,
  Objective,
  ParentType,
  Result,
  ResultProgress,
  Skill,
  StageId,
  Task,
} from '@/domain/types'

export function activeResults(state: AlephState): Result[] {
  return state.results
    .filter((r) => r.status !== 'archived')
    .sort((a, b) => a.importance - b.importance)
}

export function resultById(state: AlephState, id?: string): Result | undefined {
  return id ? state.results.find((r) => r.id === id) : undefined
}

export function objectiveById(state: AlephState, id?: string): Objective | undefined {
  return id ? state.objectives.find((o) => o.id === id) : undefined
}

export function objectivesOfResult(state: AlephState, resultId: string): Objective[] {
  return state.objectives
    .filter((o) => o.resultId === resultId && !o.archivedAt)
    .sort((a, b) => a.importance - b.importance)
}

export function tasksOfObjective(state: AlephState, objectiveId: string, stage?: StageId): Task[] {
  return state.tasks
    .filter((t) => t.objectiveId === objectiveId && (!stage || t.stage === stage))
    .sort((a, b) => a.importance - b.importance)
}

/** Tasks under a result, either attached straight to it or through its objectives. */
export function tasksOfResult(state: AlephState, resultId: string): Task[] {
  const objectiveIds = new Set(state.objectives.filter((o) => o.resultId === resultId).map((o) => o.id))
  return state.tasks.filter(
    (t) => t.resultId === resultId || (t.objectiveId && objectiveIds.has(t.objectiveId)),
  )
}

function progressOf(tasks: Task[]): Pick<ResultProgress, 'tasksDone' | 'tasksTotal' | 'hoursDone' | 'hoursEstimated' | 'ratio'> {
  const live = tasks.filter((t) => t.status !== 'cancelled')
  const done = live.filter((t) => isTaskDone(t.status))
  const hoursDone = done.reduce((sum, t) => sum + (t.actualHours ?? t.estimatedHours), 0)
  const hoursEstimated = live.reduce((sum, t) => sum + t.estimatedHours, 0)
  return {
    tasksDone: done.length,
    tasksTotal: live.length,
    hoursDone,
    hoursEstimated,
    ratio: live.length === 0 ? null : done.length / live.length,
  }
}

export function resultProgress(state: AlephState, resultId: string): ResultProgress {
  const objectives = objectivesOfResult(state, resultId)
  const objectivesByStage = STAGE_ORDER.reduce(
    (acc, stage) => ({ ...acc, [stage]: objectives.filter((o) => o.currentStage === stage).length }),
    {} as Record<StageId, number>,
  )
  return {
    ...progressOf(tasksOfResult(state, resultId)),
    objectiveCount: objectives.length,
    objectivesByStage,
  }
}

export function objectiveProgress(state: AlephState, objectiveId: string) {
  return progressOf(tasksOfObjective(state, objectiveId))
}

// -------------------------------------------------------------------- agenda

/** Tasks that belong to a given day: due that day or scheduled for it. */
export function tasksForDay(state: AlephState, dayKey: string): Task[] {
  return state.tasks
    .filter((t) => {
      if (t.status === 'cancelled') return false
      const due = t.dueAt ? toDayKey(t.dueAt) : undefined
      const scheduled = t.scheduledFor ? toDayKey(t.scheduledFor) : undefined
      return due === dayKey || scheduled === dayKey
    })
    .sort((a, b) => {
      const ao = a.dayOrder ?? a.importance
      const bo = b.dayOrder ?? b.importance
      if (ao !== bo) return ao - bo
      return a.createdAt.localeCompare(b.createdAt)
    })
}

// ------------------------------------------------------------------ tracking

export interface TrackingStats {
  completed: number
  onTime: number
  late: number
  /** Null when nothing is late: an average over an empty sample is not zero. */
  avgDelayDays: number | null
  hoursLast7: number
  perDay: Array<{ dayKey: string; count: number; hours: number }>
  weekHours: number
  weekCompleted: number
  weekOnTime: number
}

export function trackingStats(state: AlephState, today: Date = new Date()): TrackingStats {
  const done = state.tasks.filter((t) => isTaskDone(t.status) && t.completedAt)
  const onTime = done.filter((t) => t.status === 'done_on_time')
  const late = done.filter((t) => t.status === 'done_late')

  const delays = late.map((t) =>
    t.dueAt && t.completedAt ? Math.max(1, daysBetween(deadlineOf(t.dueAt), t.completedAt)) : 1,
  )
  const avgDelayDays = delays.length
    ? Math.round((delays.reduce((a, b) => a + b, 0) / delays.length) * 10) / 10
    : null

  const days = lastSevenDayKeys(today)
  const perDay = days.map((dayKey) => {
    const dayTasks = done.filter((t) => toDayKey(t.completedAt!) === dayKey)
    return {
      dayKey,
      count: dayTasks.length,
      hours: dayTasks.reduce((sum, t) => sum + (t.actualHours ?? t.estimatedHours), 0),
    }
  })

  const weekStart = startOfWeek(today).getTime()
  const weekTasks = done.filter((t) => new Date(t.completedAt!).getTime() >= weekStart)

  return {
    completed: done.length,
    onTime: onTime.length,
    late: late.length,
    avgDelayDays,
    hoursLast7: Math.round(perDay.reduce((sum, d) => sum + d.hours, 0) * 10) / 10,
    perDay,
    weekHours: Math.round(weekTasks.reduce((sum, t) => sum + (t.actualHours ?? t.estimatedHours), 0) * 10) / 10,
    weekCompleted: weekTasks.length,
    weekOnTime: weekTasks.filter((t) => t.status === 'done_on_time').length,
  }
}

export interface SkillActivity {
  mostActive: Skill | null
  quietest: Skill | null
  totalXp: number
}

/** Ranks skills by accumulated XP. Returns nulls when no skill XP exists at all. */
export function skillActivity(state: AlephState): SkillActivity {
  const scored = state.skills.map((skill) => ({
    skill,
    xp: (skill.level - 1) * 100 + skill.xp,
  }))
  const totalXp = scored.reduce((sum, s) => sum + s.xp, 0)
  if (totalXp === 0) return { mostActive: null, quietest: null, totalXp: 0 }
  const sorted = [...scored].sort((a, b) => b.xp - a.xp)
  return {
    mostActive: sorted[0].skill,
    quietest: sorted[sorted.length - 1].skill,
    totalXp,
  }
}

// ------------------------------------------------------------------- journal

export interface JournalEntry {
  comment: Comment
  originType: ParentType
  originTitle: string
}

function originTitle(state: AlephState, type: ParentType, id: string): string {
  if (type === 'result') return state.results.find((r) => r.id === id)?.name ?? ''
  if (type === 'objective') return state.objectives.find((o) => o.id === id)?.name ?? ''
  return state.tasks.find((t) => t.id === id)?.title ?? ''
}

/**
 * A journal rolls up: a result shows its own comments plus those of its objectives
 * and their tasks, newest first.
 */
export function journalFor(state: AlephState, type: ParentType, id: string): JournalEntry[] {
  const ids = new Set<string>([id])
  const types = new Map<string, ParentType>([[id, type]])

  const include = (childType: ParentType, childId: string) => {
    ids.add(childId)
    types.set(childId, childType)
  }

  if (type === 'result') {
    state.objectives
      .filter((o) => o.resultId === id)
      .forEach((o) => {
        include('objective', o.id)
        state.tasks.filter((t) => t.objectiveId === o.id).forEach((t) => include('task', t.id))
      })
    state.tasks.filter((t) => t.resultId === id).forEach((t) => include('task', t.id))
  }

  if (type === 'objective') {
    state.tasks.filter((t) => t.objectiveId === id).forEach((t) => include('task', t.id))
  }

  return state.comments
    .filter((c) => ids.has(c.parentId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((comment) => ({
      comment,
      originType: types.get(comment.parentId) ?? comment.parentType,
      originTitle: originTitle(state, types.get(comment.parentId) ?? comment.parentType, comment.parentId),
    }))
}

// ----------------------------------------------------------------- relations

export function relationsOf(state: AlephState, type: ParentType, id: string) {
  return state.relations.filter(
    (r) => (r.fromType === type && r.fromId === id) || (r.toType === type && r.toId === id),
  )
}

/** Unfinished tasks this task declares a `depends_on` relation to. */
export function blockingDependencies(state: AlephState, taskId: string): Task[] {
  return state.relations
    .filter((r) => r.kind === 'depends_on' && r.fromType === 'task' && r.fromId === taskId)
    .map((r) => state.tasks.find((t) => t.id === r.toId))
    .filter((t): t is Task => Boolean(t) && !isTaskDone(t!.status))
}

export function skillById(state: AlephState, id?: string): Skill | undefined {
  return id ? state.skills.find((s) => s.id === id) : undefined
}
