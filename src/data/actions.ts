import { getState, newId, setState } from './store'
import { addCharacterXp, addSkillXp, computeReward, isTaskDone, shouldPayReward, type Reward } from '@/domain/economy'
import { toDayKey } from '@/domain/dates'
import { MAX_OBJECTIVES_PER_RESULT, activeObjectivesOfResult, MIN_ESTIMATED_HOURS } from '@/domain/limits'
import type {
  Comment,
  Cosmetic,
  CosmeticCategory,
  Difficulty,
  Objective,
  ParentType,
  Result,
  ResultStatus,
  Skill,
  Task,
  TaskCheckItem,
  WalkerEntry,
  WalkerMood,
} from '@/domain/types'

const now = () => new Date().toISOString()

// ---------------------------------------------------------------- character

export function renameCharacter(name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  setState((s) => ({ ...s, character: { ...s.character, name: trimmed } }))
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
  law?: string
  skillId?: string
  targetDate?: string
}

export function createResult(input: ResultInput): Result {
  const state = getState()
  const result: Result = {
    id: newId('result'),
    name: input.name.trim(),
    why: input.why?.trim() || undefined,
    law: input.law?.trim() || undefined,
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
  ser?: string
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
    ser: input.ser?.trim() || undefined,
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
  doneCheck?: string
  checklist?: TaskCheckItem[]
  referenceUrl?: string
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
    doneCheck: input.doneCheck?.trim() || undefined,
    checklist: input.checklist,
    referenceUrl: input.referenceUrl?.trim() || undefined,
    status: 'pending',
    rewardApplied: false,
    createdAt: now(),
  }
  setState((s) => ({ ...s, tasks: [...s.tasks, task] }))
  return task
}

/** "Ejecutar": move a research task into the execution moment. */
export function executeTask(id: string): void {
  const task = getState().tasks.find((t) => t.id === id)
  if (!task || task.stage !== 'research') return
  updateTask(id, { stage: 'execution', status: 'in_progress' })
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
export function captureLooseTask(title: string, options?: { dueAt?: string }): Task | null {
  const trimmed = title.trim()
  if (!trimmed) return null
  const day = options?.dueAt || undefined
  return createTask({
    title: trimmed,
    estimatedHours: 1,
    difficulty: 'medium',
    dueAt: day,
    scheduledFor: day,
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

/** Reopens a task as research. The reward already paid is kept: no clawback. */
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

export function addWalkerEntry(input: { body: string; mood?: WalkerMood }): WalkerEntry | null {
  const body = input.body.trim()
  if (!body) return null
  const entry: WalkerEntry = {
    id: newId('walker'),
    body,
    mood: input.mood,
    createdAt: now(),
  }
  setState((s) => ({ ...s, walkerEntries: [...s.walkerEntries, entry] }))
  return entry
}

/** Updates today's latest walker entry mood. No-ops when there is no entry today. */
export function setWalkerMood(mood: WalkerMood): void {
  const today = toDayKey(new Date())
  setState((s) => {
    let latestToday = -1
    for (let i = s.walkerEntries.length - 1; i >= 0; i -= 1) {
      if (toDayKey(s.walkerEntries[i].createdAt) === today) {
        latestToday = i
        break
      }
    }
    if (latestToday < 0) return s
    const walkerEntries = s.walkerEntries.map((entry, index) =>
      index === latestToday ? { ...entry, mood } : entry,
    )
    return { ...s, walkerEntries }
  })
}

