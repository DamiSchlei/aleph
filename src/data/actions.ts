import { getState, newId, setState } from './store'
import { addCharacterXp, addSkillXp, computeReward, isTaskDone, shouldPayReward, type Reward } from '@/domain/economy'
import { MAX_OBJECTIVES_PER_RESULT, MAX_SERIES_BLOCKS, activeObjectivesOfResult, MIN_ESTIMATED_HOURS } from '@/domain/limits'
import { seriesDayKeys, toDayKey } from '@/domain/dates'
import { taskDayKey } from '@/data/selectors'
import type {
  Character,
  Comment,
  Cosmetic,
  CosmeticCategory,
  Difficulty,
  Objective,
  ObjectiveInventory,
  ParentType,
  Result,
  ResultStatus,
  Skill,
  Task,
  TaskCheckItem,
} from '@/domain/types'

const now = () => new Date().toISOString()

// ---------------------------------------------------------------- character

export function renameCharacter(name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  setState((s) => ({ ...s, character: { ...s.character, name: trimmed } }))
}

export function setCharacterLocale(locale: Character['locale']): void {
  setState((s) => ({ ...s, character: { ...s.character, locale } }))
}

export function markOnboarded(): void {
  setState((s) => ({ ...s, character: { ...s.character, onboarded: true } }))
}

export function setDailyHourCap(hours: number): void {
  if (!Number.isFinite(hours) || hours <= 0) return
  setState((s) => ({ ...s, character: { ...s.character, dailyHourCap: hours } }))
}


/**
 * Basic avatar layers (skin, hair, eyes, outfit, accessory, background) are all
 * free from level 1, so equipping never touches money. A future shop would sell
 * extras (bundles, frames), not these basics.
 */
export function equipCosmetic(category: CosmeticCategory, cosmeticId: string): void {
  setState((s) => ({
    ...s,
    character: {
      ...s.character,
      avatar: { ...s.character.avatar, [`${category}Id`]: cosmeticId },
    },
  }))
}

// ------------------------------------------------------------------- skills

export function createSkill(input: { name: string; icon: string; color?: string }): Skill {
  const skill: Skill = {
    id: newId('skill'),
    name: input.name.trim(),
    icon: input.icon,
    color: input.color ?? '#94a3b8',
    level: 1,
    xp: 0,
    isCustom: true,
  }
  setState((s) => ({ ...s, skills: [...s.skills, skill] }))
  return skill
}

// ------------------------------------------------------------------ results

export interface ResultInput {
  name: string
  why?: string
  skillId?: string
  targetDate?: string
}

export function createResult(input: ResultInput): Result {
  const state = getState()
  const result: Result = {
    id: newId('result'),
    name: input.name.trim(),
    why: input.why?.trim() || undefined,
    skillId: input.skillId || undefined,
    targetDate: input.targetDate || undefined,
    importance: state.results.length,
    status: 'active',
  }
  setState((s) => ({ ...s, results: [...s.results, result] }))
  return result
}

export function updateResult(id: string, patch: Partial<Omit<Result, 'id'>>): void {
  setState((s) => ({
    ...s,
    results: s.results.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  }))
}

export function setResultStatus(id: string, status: ResultStatus): void {
  updateResult(id, { status })
}

/**
 * Archiving only flips the result's status so it can be restored cleanly: its
 * objectives, tasks and journal stay intact. Archived results are hidden from the
 * active lists and their tasks drop off the agenda (see selectors).
 */
export function archiveResult(id: string): void {
  setResultStatus(id, 'archived')
}

/** Brings an archived result back into the active lists, untouched. */
export function restoreResult(id: string): void {
  setResultStatus(id, 'active')
}

export function reorderResults(orderedIds: string[]): void {
  setState((s) => ({
    ...s,
    results: s.results.map((r) => {
      const index = orderedIds.indexOf(r.id)
      return index >= 0 ? { ...r, importance: index } : r
    }),
  }))
}

// --------------------------------------------------------------- objectives

export interface ObjectiveInput {
  resultId: string
  name: string
  why?: string
  doneWhen?: string
  nonGoals?: string
  reviewEvery?: 'weekly' | 'every_n_tasks'
  reviewEveryN?: number
  skillId?: string
  importance?: number
}

export class ObjectiveLimitError extends Error {
  constructor() {
    super('MAX_OBJECTIVES_PER_RESULT')
  }
}

export function createObjective(input: ObjectiveInput): Objective {
  const state = getState()
  const siblings = activeObjectivesOfResult(state.objectives, input.resultId)
  if (siblings.length >= MAX_OBJECTIVES_PER_RESULT) throw new ObjectiveLimitError()

  const objective: Objective = {
    id: newId('objective'),
    resultId: input.resultId,
    name: input.name.trim(),
    why: input.why?.trim() || undefined,
    doneWhen: input.doneWhen?.trim() || undefined,
    nonGoals: input.nonGoals?.trim() || undefined,
    reviewEvery: input.reviewEvery,
    reviewEveryN: input.reviewEveryN,
    skillId: input.skillId || undefined,
    importance: input.importance ?? siblings.length + 1,
    currentStage: 'research',
    status: 'pending',
  }
  setState((s) => ({ ...s, objectives: [...s.objectives, objective] }))
  return objective
}

export function updateObjective(id: string, patch: Partial<Omit<Objective, 'id' | 'resultId'>>): void {
  setState((s) => ({
    ...s,
    objectives: s.objectives.map((o) => (o.id === id ? { ...o, ...patch } : o)),
  }))
}

export function updateObjectiveInventory(
  id: string,
  patch: Partial<ObjectiveInventory>,
): void {
  setState((s) => ({
    ...s,
    objectives: s.objectives.map((o) => {
      if (o.id !== id) return o
      const inventory = {
        costs: o.inventory?.costs ?? 0,
        contacts: o.inventory?.contacts ?? 0,
        docs: o.inventory?.docs ?? 0,
        links: o.inventory?.links ?? 0,
        ...patch,
      }
      return { ...o, inventory }
    }),
  }))
}


export function archiveObjective(id: string): void {
  const timestamp = now()
  setState((s) => ({
    ...s,
    objectives: s.objectives.map((o) => (o.id === id ? { ...o, archivedAt: timestamp } : o)),
    tasks: s.tasks.map((t) =>
      t.objectiveId === id && (t.status === 'pending' || t.status === 'in_progress')
        ? { ...t, status: 'cancelled' }
        : t,
    ),
  }))
}

export function reorderObjectives(resultId: string, orderedIds: string[]): void {
  setState((s) => ({
    ...s,
    objectives: s.objectives.map((o) => {
      if (o.resultId !== resultId) return o
      const index = orderedIds.indexOf(o.id)
      return index >= 0 ? { ...o, importance: index + 1 } : o
    }),
  }))
}

// -------------------------------------------------------------------- tasks

export interface TaskInput {
  title: string
  notes?: string
  resultId?: string
  objectiveId?: string
  skillId?: string
  estimatedHours?: number
  difficulty?: Difficulty
  dueAt?: string
  scheduledFor?: string
  scheduledStart?: string
  scheduledEnd?: string
  doneCheck?: string
  checklist?: TaskCheckItem[]
  referenceUrl?: string
  seriesId?: string
  seriesWeekdays?: number[]
  dayOrder?: number
}

/**
 * Every task is born in the `research` moment ("Análisis e investigación"). It only
 * moves to `execution` when the user presses "Ejecutar". `review` is never a column
 * for open tasks — finished tasks live in their done status.
 */
export function createTask(input: TaskInput): Task {
  const state = getState()
  const siblings = state.tasks.filter(
    (t) => t.objectiveId === input.objectiveId && t.stage === 'research',
  )
  const objective = input.objectiveId
    ? state.objectives.find((o) => o.id === input.objectiveId)
    : undefined
  const task: Task = {
    id: newId('task'),
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    resultId: input.resultId || objective?.resultId,
    objectiveId: input.objectiveId || undefined,
    stage: 'research',
    skillId: input.skillId || undefined,
    estimatedHours: Math.max(MIN_ESTIMATED_HOURS, input.estimatedHours ?? 1),
    difficulty: input.difficulty ?? 'medium',
    importance: siblings.length,
    dueAt: input.dueAt || undefined,
    scheduledFor: input.scheduledFor || undefined,
    scheduledStart: input.scheduledStart || undefined,
    scheduledEnd: input.scheduledEnd || undefined,
    doneCheck: input.doneCheck?.trim() || undefined,
    checklist: input.checklist,
    referenceUrl: input.referenceUrl?.trim() || undefined,
    seriesId: input.seriesId,
    seriesWeekdays: input.seriesWeekdays,
    dayOrder: input.dayOrder,
    status: 'pending',
    rewardApplied: false,
    createdAt: now(),
  }
  setState((s) => ({ ...s, tasks: [...s.tasks, task] }))
  return task
}

export type SeriesHorizon = 'week' | 'month'

export interface TaskSeriesInput extends TaskInput {
  weekdays: number[]
  hoursPerBlock: number
  horizon: SeriesHorizon
}

/**
 * Weekly blocks as Tasks. One Task per matching weekday from today through the
 * horizon. Skips past dates and existing seriesId+day rows. Caps at 20. Never
 * creates a Block entity.
 */
export function createTaskSeries(input: TaskSeriesInput, now: Date = new Date()): Task[] {
  const weekdays = [...new Set(input.weekdays.filter((day) => day >= 1 && day <= 7))].sort((a, b) => a - b)
  const title = input.title.trim()
  if (!title || weekdays.length === 0) return []

  const seriesId = input.seriesId || newId('series')
  const hoursPerBlock = Math.max(MIN_ESTIMATED_HOURS, input.hoursPerBlock)
  const days = seriesDayKeys(weekdays, input.horizon, now, MAX_SERIES_BLOCKS)
  const existing = getState().tasks
  const created: Task[] = []

  for (const day of days) {
    const taken = [...existing, ...created].some(
      (task) =>
        task.seriesId === seriesId &&
        task.status !== 'cancelled' &&
        taskDayKey(task) === day,
    )
    if (taken) continue
    created.push(
      createTask({
        ...input,
        title,
        estimatedHours: hoursPerBlock,
        dueAt: day,
        scheduledFor: day,
        seriesId,
        seriesWeekdays: weekdays,
      }),
    )
  }

  return created
}

/** "Ejecutar": move a research task into the execution moment. */
export function executeTask(id: string): void {
  const task = getState().tasks.find((t) => t.id === id)
  if (!task || task.stage !== 'research') return
  updateTask(id, { stage: 'execution', status: 'in_progress' })
}

/** Execute only with a required comment. Does not pay. */
export function executeTaskWithNote(id: string, comment: string): boolean {
  const trimmed = comment.trim()
  if (!trimmed) return false
  const task = getState().tasks.find((t) => t.id === id)
  if (!task || task.stage !== 'research') return false
  executeTask(id)
  return Boolean(addComment('task', id, trimmed))
}

/** "Volver a investigación": send an execution task back to research. */
export function returnToResearch(id: string): void {
  const task = getState().tasks.find((t) => t.id === id)
  if (!task || task.stage !== 'execution') return
  updateTask(id, { stage: 'research', status: 'pending' })
}

/** Assigns a loose task onto an objective; it lands in the research moment. */
export function assignTaskToObjective(id: string, resultId: string, objectiveId: string): void {
  updateTask(id, { resultId, objectiveId, stage: 'research' })
}

/**
 * Home composer: capture a loose research task (no result, no objective) with the
 * due date implied by the active agenda filter, so it lands where the user is looking.
 */
export function captureLooseTask(
  title: string,
  options?: {
    dueAt?: string
    scheduledFor?: string
    estimatedHours?: number
    difficulty?: Difficulty
    dayOrder?: number
  },
): Task | null {
  const trimmed = title.trim()
  if (!trimmed) return null
  const day = options?.scheduledFor || options?.dueAt || undefined
  const dayTasks = day
    ? getState().tasks.filter(
        (task) =>
          task.status !== 'cancelled' &&
          (task.scheduledFor === day || task.dueAt === day),
      )
    : []
  const nextOrder =
    options?.dayOrder ??
    (dayTasks.length
      ? Math.max(...dayTasks.map((task) => task.dayOrder ?? task.importance ?? 0)) + 1
      : 0)
  return createTask({
    title: trimmed,
    estimatedHours: options?.estimatedHours ?? 1,
    difficulty: options?.difficulty ?? 'medium',
    dueAt: day,
    scheduledFor: day,
    dayOrder: nextOrder,
  })
}

export function updateTask(id: string, patch: Partial<Omit<Task, 'id'>>): void {
  setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
}

export function cancelTask(id: string): void {
  updateTask(id, { status: 'cancelled' })
}

/** Hard-deletes a task and its journal comments. No XP is paid; not undoable. */
export function deleteTask(id: string): void {
  setState((s) => ({
    ...s,
    tasks: s.tasks.filter((t) => t.id !== id),
    comments: s.comments.filter((c) => !(c.parentType === 'task' && c.parentId === id)),
  }))
}

export function reorderTasks(orderedIds: string[], field: 'importance' | 'dayOrder' = 'importance'): void {
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) => {
      const index = orderedIds.indexOf(t.id)
      return index >= 0 ? { ...t, [field]: index } : t
    }),
  }))
}

export interface CompletionOutcome {
  task: Task
  reward: Reward
  skillId?: string
  skillLevelsGained: number
  characterLevelsGained: number
  newLevel: number
  unlockedCosmetics: Cosmetic[]
  paid: boolean
}

/**
 * Marks a task done. Pays XP/money/skill XP once (`rewardApplied`). Reopened
 * tasks can be completed again without a second payout.
 */
export function completeTask(
  id: string,
  options?: { actualHours?: number; skillId?: string },
): CompletionOutcome | null {
  const state = getState()
  const task = state.tasks.find((t) => t.id === id)
  if (!task || isTaskDone(task.status)) return null

  const completedAt = now()
  const objective = task.objectiveId
    ? state.objectives.find((o) => o.id === task.objectiveId)
    : undefined
  const resultId = task.resultId ?? objective?.resultId
  const result = resultId ? state.results.find((r) => r.id === resultId) : undefined
  const reward = computeReward({
    estimatedHours: task.estimatedHours,
    actualHours: options?.actualHours ?? task.actualHours,
    difficulty: task.difficulty,
    dueAt: task.dueAt,
    completedAt,
    activeResult: result?.status === 'active',
  })

  const pay = shouldPayReward(task)
  const explicitSkillId = options?.skillId
  const effectiveSkillId = explicitSkillId ?? task.skillId ?? objective?.skillId ?? result?.skillId
  const skill = pay && effectiveSkillId ? state.skills.find((s) => s.id === effectiveSkillId) : undefined
  const characterXp = pay ? addCharacterXp(state.character, reward.xp) : null
  const skillXp = pay && skill ? addSkillXp(skill, reward.xp) : null
  const unlockedCosmetics: Cosmetic[] = []

  const completedTask: Task = {
    ...task,
    skillId: explicitSkillId ?? task.skillId,
    actualHours: options?.actualHours ?? task.actualHours,
    completedAt,
    status: reward.status,
    xpGranted: pay ? reward.xp : task.xpGranted,
    moneyGranted: pay ? reward.money : task.moneyGranted,
    rewardApplied: true,
  }

  setState((s) => ({
    ...s,
    character: characterXp
      ? {
          ...s.character,
          level: characterXp.level,
          xp: characterXp.xp,
          xpToNext: characterXp.xpToNext,
          money: s.character.money + reward.money,
        }
      : s.character,
    skills: skillXp
      ? s.skills.map((sk) =>
          sk.id === skill!.id ? { ...sk, level: skillXp.level, xp: skillXp.xp } : sk,
        )
      : s.skills,
    tasks: s.tasks.map((t) => (t.id === id ? completedTask : t)),
  }))

  return {
    task: completedTask,
    reward: pay ? reward : { ...reward, xp: 0, money: 0 },
    skillId: effectiveSkillId,
    skillLevelsGained: skillXp?.levelsGained ?? 0,
    characterLevelsGained: characterXp?.levelsGained ?? 0,
    newLevel: characterXp?.level ?? state.character.level,
    unlockedCosmetics,
    paid: pay,
  }
}

/** Close only with required hours and one comment. Uses actualHours in the payout. */
export function closeTask(
  id: string,
  input: { actualHours: number; comment: string; skillId?: string },
): CompletionOutcome | null {
  const comment = input.comment.trim()
  const actualHours = Number(input.actualHours)
  if (!comment || !Number.isFinite(actualHours) || actualHours < MIN_ESTIMATED_HOURS) return null
  const outcome = completeTask(id, { actualHours, skillId: input.skillId })
  if (!outcome) return null
  addComment('task', id, comment)
  return outcome
}

/** Reopens a task as research. The reward already paid is kept: no clawback. */

/** Move open past-due scheduled tasks onto today, keeping relative order at the top. */
export function rollPendingTasksToToday(now: Date = new Date()): void {
  const today = toDayKey(now)
  setState((s) => {
    const pending = s.tasks
      .filter((task) => {
        if (isTaskDone(task.status) || task.status === 'cancelled') return false
        const day = task.scheduledFor || task.dueAt
        return Boolean(day && day < today)
      })
      .sort((a, b) => {
        const da = a.scheduledFor || a.dueAt || ''
        const db = b.scheduledFor || b.dueAt || ''
        if (da !== db) return da.localeCompare(db)
        return (a.dayOrder ?? a.importance) - (b.dayOrder ?? b.importance)
      })
    if (pending.length === 0) return s

    const todayExisting = s.tasks
      .filter(
        (task) =>
          !pending.some((p) => p.id === task.id) &&
          task.status !== 'cancelled' &&
          (task.scheduledFor === today || task.dueAt === today),
      )
      .sort((a, b) => (a.dayOrder ?? a.importance) - (b.dayOrder ?? b.importance))

    const orderIds = [...pending.map((t) => t.id), ...todayExisting.map((t) => t.id)]
    const orderIndex = new Map(orderIds.map((id, i) => [id, i]))

    return {
      ...s,
      tasks: s.tasks.map((task) => {
        if (pending.some((p) => p.id === task.id)) {
          return {
            ...task,
            scheduledFor: today,
            dueAt: today,
            dayOrder: orderIndex.get(task.id) ?? 0,
          }
        }
        if (orderIndex.has(task.id)) {
          return { ...task, dayOrder: orderIndex.get(task.id) }
        }
        return task
      }),
    }
  })
}

export function reopenTask(id: string): void {
  updateTask(id, { status: 'pending', stage: 'research', completedAt: undefined })
}

// ----------------------------------------------------------------- journal

export function addComment(parentType: ParentType, parentId: string, body: string): Comment | null {
  const trimmed = body.trim()
  if (!trimmed) return null
  const comment: Comment = {
    id: newId('comment'),
    parentType,
    parentId,
    body: trimmed,
    createdAt: now(),
  }
  setState((s) => ({ ...s, comments: [...s.comments, comment] }))
  return comment
}

/** Aliases kept for capture-UI call sites. */
export const markCharacterOnboarded = markOnboarded
export const setLocale = setCharacterLocale
