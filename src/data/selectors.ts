import { isTaskDone } from '@/domain/economy'
import {
  addDays,
  daysBetween,
  deadlineOf,
  lastSevenDayKeys,
  startOfDay,
  startOfWeek,
  toDayKey,
  weekDayKeys,
} from '@/domain/dates'
import { STAGE_ORDER } from '@/domain/stage'
import type {
  AlephState,
  Comment,
  Difficulty,
  Objective,
  ParentType,
  Result,
  ResultProgress,
  ResultStatus,
  Skill,
  StageId,
  Task,
} from '@/domain/types'

export function activeResults(state: AlephState): Result[] {
  return state.results
    .filter((r) => r.status !== 'archived')
    .sort((a, b) => a.importance - b.importance)
}

/** Results the user is attending: status active only. Paused/archived/achieved do not count. */
export function attendingResults(state: AlephState): Result[] {
  return state.results
    .filter((r) => r.status === 'active')
    .sort((a, b) => a.importance - b.importance)
}

/** Results that may appear in create/edit/assign pickers. Archived never do. */
export function pickerResults(state: AlephState): Result[] {
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

/** Live objectives of a result for pickers. Same as objectivesOfResult; archived stay hidden. */
export function pickerObjectives(state: AlephState, resultId: string): Objective[] {
  return objectivesOfResult(state, resultId)
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
    (acc, stage) => ({
      ...acc,
      [stage]: objectives.filter((o) => deriveObjectiveStage(state, o.id) === stage).length,
    }),
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

/** The day a task shows on: its due day, else its scheduled day. */
export function taskDayKey(task: Task): string | undefined {
  if (task.dueAt) return toDayKey(task.dueAt)
  if (task.scheduledFor) return toDayKey(task.scheduledFor)
  return undefined
}

function byDayOrder(a: Task, b: Task): number {
  const ao = a.dayOrder ?? a.importance
  const bo = b.dayOrder ?? b.importance
  if (ao !== bo) return ao - bo
  return a.createdAt.localeCompare(b.createdAt)
}

/** The status of the result a task belongs to, resolving through its objective. */
export function taskResultStatus(state: AlephState, task: Task): ResultStatus | undefined {
  const objective = task.objectiveId
    ? state.objectives.find((o) => o.id === task.objectiveId)
    : undefined
  const resultId = task.resultId ?? objective?.resultId
  const result = resultId ? state.results.find((r) => r.id === resultId) : undefined
  return result?.status
}

function isArchivedTask(state: AlephState, task: Task): boolean {
  return taskResultStatus(state, task) === 'archived'
}

/** Tasks that belong to a given day: due that day or scheduled for it. */
export function tasksForDay(state: AlephState, dayKey: string): Task[] {
  return state.tasks
    .filter((t) => t.status !== 'cancelled' && !isArchivedTask(state, t) && taskDayKey(t) === dayKey)
    .sort(byDayOrder)
}

export type AgendaFilter = 'today' | 'tomorrow' | 'week' | 'overdue' | 'pick' | 'undated'

export const AGENDA_FILTERS: AgendaFilter[] = [
  'today',
  'tomorrow',
  'week',
  'overdue',
  'pick',
  'undated',
]

/** Due date the Home composer stamps, following the active filter. */
export function dueAtForFilter(
  filter: AgendaFilter,
  pickDate = '',
  now: Date = new Date(),
): string | undefined {
  if (filter === 'undated') return undefined
  if (filter === 'tomorrow') return toDayKey(addDays(now, 1))
  if (filter === 'pick') return pickDate || toDayKey(now)
  return toDayKey(now)
}

/** Calendar day for the 24h bar. Only Hoy and Elegir map to a single day. */
export function agendaCalendarDay(
  filter: AgendaFilter,
  pickDate = '',
  now: Date = new Date(),
): string | undefined {
  if (filter === 'today') return toDayKey(now)
  if (filter === 'pick') return pickDate || toDayKey(now)
  return undefined
}

export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  if (!task.dueAt || isTaskDone(task.status) || task.status === 'cancelled') return false
  return deadlineOf(task.dueAt).getTime() < startOfDay(now).getTime()
}

/** The agenda for a Home date filter. Archived and cancelled tasks never appear. */
export function agendaTasks(
  state: AlephState,
  filter: AgendaFilter,
  pickDate?: string,
  now: Date = new Date(),
): Task[] {
  const todayKey = toDayKey(now)
  const matches = (task: Task): boolean => {
    if (filter === 'undated') {
      return isOpen(task) && !task.dueAt && !task.scheduledFor
    }
    if (filter === 'overdue') {
      return isTaskOverdue(task, now)
    }
    const day = taskDayKey(task)
    if (!day) return false
    if (filter === 'today') return day === todayKey
    if (filter === 'tomorrow') return day === toDayKey(addDays(now, 1))
    if (filter === 'week') return day >= todayKey && day <= toDayKey(addDays(startOfWeek(now), 6))
    return day === (pickDate || todayKey)
  }
  return state.tasks
    .filter((t) => t.status !== 'cancelled' && !isArchivedTask(state, t) && matches(t))
    .sort(byDayOrder)
}

/** First open agenda task, preferring one already in progress. */
export function featuredAgendaTask(
  state: AlephState,
  filter: AgendaFilter = 'today',
  pickDate?: string,
  now: Date = new Date(),
): Task | undefined {
  const open = agendaTasks(state, filter, pickDate, now).filter((task) => !isTaskDone(task.status))
  return open.find((task) => task.status === 'in_progress') ?? open[0]
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

export interface SeriesPulse {
  seriesId: string
  title: string
  planned: number
  done: number
  missed: number
}

/**
 * Per-series counts for the week starting at weekStart (Monday).
 * missed = scheduled this week with day < today and status not done.
 */
export function weekSeriesPulse(
  state: AlephState,
  weekStart: Date | string,
  today: Date = new Date(),
): SeriesPulse[] {
  const weekDays = new Set(weekDayKeys(weekStart))
  const todayKey = toDayKey(today)
  const groups = new Map<string, Task[]>()

  for (const task of state.tasks) {
    if (!task.seriesId || task.status === 'cancelled') continue
    const day = taskDayKey(task)
    if (!day || !weekDays.has(day)) continue
    const list = groups.get(task.seriesId) ?? []
    list.push(task)
    groups.set(task.seriesId, list)
  }

  return [...groups.entries()]
    .map(([seriesId, tasks]) => {
      const planned = tasks.length
      const done = tasks.filter((task) => isTaskDone(task.status)).length
      const missed = tasks.filter((task) => {
        const day = taskDayKey(task)
        return Boolean(day && day < todayKey && !isTaskDone(task.status))
      }).length
      return { seriesId, title: tasks[0].title, planned, done, missed }
    })
    .filter((pulse) => pulse.planned > 0)
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

export function skillById(state: AlephState, id?: string): Skill | undefined {
  return id ? state.skills.find((s) => s.id === id) : undefined
}

// -------------------------------------------------------------- moments / steps

/** A task with no due date sorts after dated ones; ties break on importance. */
function byDueThenImportance(a: Task, b: Task): number {
  const ad = a.dueAt ? toDayKey(a.dueAt) : '9999-99-99'
  const bd = b.dueAt ? toDayKey(b.dueAt) : '9999-99-99'
  if (ad !== bd) return ad < bd ? -1 : 1
  return a.importance - b.importance
}

/** Next-step ranking: a task in execution outranks one still in research. */
function byMomentThenDue(a: Task, b: Task): number {
  const rank = (t: Task) => (t.stage === 'execution' ? 0 : 1)
  const diff = rank(a) - rank(b)
  return diff !== 0 ? diff : byDueThenImportance(a, b)
}

function isOpen(task: Task): boolean {
  return task.status === 'pending' || task.status === 'in_progress'
}

/** Where a task's XP lands: its own skill, else the objective's, else the result's. */
export function resolveTaskSkillId(state: AlephState, task: Task): string | undefined {
  if (task.skillId) return task.skillId
  const objective = task.objectiveId
    ? state.objectives.find((o) => o.id === task.objectiveId)
    : undefined
  if (objective?.skillId) return objective.skillId
  const resultId = task.resultId ?? objective?.resultId
  const result = resultId ? state.results.find((r) => r.id === resultId) : undefined
  return result?.skillId
}

/** The next concrete step of an objective, preferring an in-progress task. */
export function nextTaskOfObjective(state: AlephState, objectiveId: string): Task | undefined {
  return tasksOfObjective(state, objectiveId)
    .filter(isOpen)
    .sort(byMomentThenDue)[0]
}

/**
 * The objective's moment, derived for display only. The user never moves an
 * objective between columns; its tasks' moments do:
 *   open execution task -> execution; else open research task -> research;
 *   else (some work, all done) -> review; else research.
 */
export function deriveObjectiveStage(state: AlephState, objectiveId: string): StageId {
  const tasks = tasksOfObjective(state, objectiveId).filter((t) => t.status !== 'cancelled')
  if (tasks.some((t) => t.stage === 'execution' && isOpen(t))) return 'execution'
  if (tasks.some((t) => t.stage === 'research' && isOpen(t))) return 'research'
  if (tasks.length > 0 && tasks.every((t) => isTaskDone(t.status))) return 'review'
  return 'research'
}

export interface ObjectiveHealth {
  key: string
  params?: Record<string, string | number>
}

/** One honest line about an objective: what is running, waiting, or missing. */
export function objectiveHealth(state: AlephState, objectiveId: string): ObjectiveHealth {
  const tasks = tasksOfObjective(state, objectiveId).filter((t) => t.status !== 'cancelled')
  const execOpen = tasks.filter((t) => t.stage === 'execution' && isOpen(t))
  if (execOpen.length > 0) {
    const lead = [...execOpen].sort(byDueThenImportance)[0]
    return {
      key: 'planning.objectives.health.inProgress',
      params: { count: execOpen.length, title: lead.title },
    }
  }
  const researchOpen = tasks.filter((t) => t.stage === 'research' && isOpen(t))
  if (researchOpen.length > 0) {
    return { key: 'planning.objectives.health.research', params: { count: researchOpen.length } }
  }
  if (tasks.length > 0 && tasks.every((t) => isTaskDone(t.status))) {
    return { key: 'planning.objectives.health.readyToClose' }
  }
  return { key: 'planning.objectives.noConcreteStep' }
}

export interface ResultHealth {
  key: string
  params?: Record<string, string | number>
}

/**
 * A single honest line about where a result stands. Prefers an in-progress
 * (execution) task, else research, else an empty lever.
 */
export function resultHealth(state: AlephState, resultId: string): ResultHealth {
  const objectives = objectivesOfResult(state, resultId)
  const resultTasks = tasksOfResult(state, resultId).filter(isOpen)
  const next = [...resultTasks].sort(byMomentThenDue)[0]
  if (next) return { key: 'planning.results.health.next', params: { title: next.title } }

  if (objectives.length === 0) return { key: 'planning.results.health.noObjectives' }

  const counts = objectives.map((o) => ({
    objective: o,
    live: tasksOfObjective(state, o.id).filter((t) => t.status !== 'cancelled').length,
  }))
  const withWork = counts.filter((c) => c.live > 0)
  const empty = counts.filter((c) => c.live === 0)
  if (objectives.length >= 2 && withWork.length === 1 && empty.length >= 1) {
    return {
      key: 'planning.results.health.unbalanced',
      params: { emptyObjective: empty[0].objective.name },
    }
  }

  return { key: 'planning.results.health.allClear' }
}

/** Earliest live objective stage on the result; undefined when there are no objectives. */
export function stageFocusOfResult(state: AlephState, resultId: string): StageId | undefined {
  const objectives = objectivesOfResult(state, resultId)
  if (objectives.length === 0) return undefined
  for (const stage of STAGE_ORDER) {
    if (objectives.some((objective) => deriveObjectiveStage(state, objective.id) === stage)) {
      return stage
    }
  }
  return undefined
}

/** The next concrete step of a result, preferring an in-progress task. */
export function nextTaskOfResult(state: AlephState, resultId: string): Task | undefined {
  return tasksOfResult(state, resultId)
    .filter(isOpen)
    .sort(byMomentThenDue)[0]
}

export interface PlanTotalRow {
  result: Result
  next: Task | undefined
  stale: boolean
}

export function planTotalRows(state: AlephState, now: Date = new Date()): PlanTotalRow[] {
  return attendingResults(state).map((result) => ({
    result,
    next: nextTaskOfResult(state, result.id),
    stale: resultStaleThisWeek(state, result.id, now),
  }))
}

function lastActivityAt(state: AlephState, resultId: string): string | undefined {
  const completed = tasksOfResult(state, resultId)
    .map((t) => t.completedAt)
    .filter((value): value is string => Boolean(value))
  const comments = journalFor(state, 'result', resultId).map((entry) => entry.comment.createdAt)
  const stamps = [...completed, ...comments]
  if (stamps.length === 0) return undefined
  return stamps.sort()[stamps.length - 1]
}

/** No completed task and no journal in the last 7 days. */
export function resultStaleThisWeek(
  state: AlephState,
  resultId: string,
  now: Date = new Date(),
): boolean {
  const last = lastActivityAt(state, resultId)
  if (!last) return true
  return daysBetween(last, now) >= 7
}

/**
 * Least-active attending result: never-touched first, else oldest last
 * completed task or journal. Used when offering the bitácora instead of a 4th result.
 */
export function leastActiveAttending(state: AlephState): Result | undefined {
  const attending = attendingResults(state)
  if (attending.length === 0) return undefined
  return [...attending].sort((a, b) => {
    const la = lastActivityAt(state, a.id)
    const lb = lastActivityAt(state, b.id)
    if (!la && !lb) return a.importance - b.importance
    if (!la) return -1
    if (!lb) return 1
    const byTime = la.localeCompare(lb)
    return byTime !== 0 ? byTime : a.importance - b.importance
  })[0]
}

export interface DayLoadSegment {
  id: string
  title: string
  hours: number
  difficulty: Difficulty
}

export interface DayLoad {
  hours: number
  capped: number
  overflow: boolean
  segments: DayLoadSegment[]
}

/** Open tasks dated that day, plus tasks completed that day that are also dated that day. */
export function dayLoad(state: AlephState, dayKey: string): DayLoad {
  const segments: DayLoadSegment[] = state.tasks
    .filter((task) => {
      if (task.status === 'cancelled' || isArchivedTask(state, task)) return false
      if (taskDayKey(task) !== dayKey) return false
      if (isOpen(task)) return true
      return Boolean(
        isTaskDone(task.status) && task.completedAt && toDayKey(task.completedAt) === dayKey,
      )
    })
    .sort(byDayOrder)
    .map((task) => ({
      id: task.id,
      title: task.title,
      hours: task.estimatedHours,
      difficulty: task.difficulty,
    }))

  const hours = Math.round(segments.reduce((sum, s) => sum + s.hours, 0) * 100) / 100
  return {
    hours,
    capped: Math.min(hours, 24),
    overflow: hours > 24,
    segments,
  }
}

export function latestCommentOnDay(state: AlephState, dayKey: string): Comment | undefined {
  return [...state.comments]
    .filter((comment) => toDayKey(comment.createdAt) === dayKey)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

export function nextReviewDue(
  state: AlephState,
  objectiveId: string,
  now: Date = new Date(),
): string | undefined {
  const objective = objectiveById(state, objectiveId)
  if (!objective?.reviewEvery) return undefined
  const last = journalFor(state, 'objective', objectiveId)[0]?.comment.createdAt
  if (objective.reviewEvery === 'weekly') {
    if (!last) return toDayKey(now)
    return toDayKey(addDays(last, 7))
  }
  const n = Math.max(1, objective.reviewEveryN ?? 3)
  const since = last ? new Date(last).getTime() : 0
  const doneSince = tasksOfObjective(state, objectiveId).filter(
    (task) =>
      isTaskDone(task.status) && task.completedAt && new Date(task.completedAt).getTime() > since,
  ).length
  if (doneSince >= n) return toDayKey(now)
  return undefined
}
