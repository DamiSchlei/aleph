import { getState, newId, setState } from './store'
import { cosmeticById, cosmeticsUnlockedAtLevel } from './cosmetics'
import { addCharacterXp, addSkillXp, computeReward, type Reward } from '@/domain/economy'
import { MAX_OBJECTIVES_PER_RESULT, activeObjectivesOfResult, MIN_ESTIMATED_HOURS } from '@/domain/limits'
import { canMoveTo } from '@/domain/stage'
import { toDayKey } from '@/domain/dates'
import type {
  Comment,
  Cosmetic,
  CosmeticCategory,
  Difficulty,
  Locale,
  Objective,
  ParentType,
  Relation,
  RelationKind,
  Result,
  ResultStatus,
  Skill,
  StageId,
  Task,
} from '@/domain/types'

const now = () => new Date().toISOString()

// ---------------------------------------------------------------- character

export function setLocale(locale: Locale): void {
  setState((s) => ({ ...s, character: { ...s.character, locale } }))
}

export function renameCharacter(name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  setState((s) => ({ ...s, character: { ...s.character, name: trimmed } }))
}

export function equipCosmetic(category: CosmeticCategory, cosmeticId: string): void {
  setState((s) => ({
    ...s,
    character: {
      ...s.character,
      avatar: { ...s.character.avatar, [`${category}Id`]: cosmeticId },
      seenNewCosmeticIds: Array.from(
        new Set([...(s.character.seenNewCosmeticIds ?? []), cosmeticId]),
      ),
    },
  }))
}

/** Returns false when the character cannot afford it or it is not for sale. */
export function buyCosmetic(cosmeticId: string): boolean {
  const cosmetic = cosmeticById(cosmeticId)
  const { character } = getState()
  if (!cosmetic || cosmetic.price === undefined) return false
  if (character.ownedCosmeticIds.includes(cosmeticId)) return false
  if (character.money < cosmetic.price) return false

  setState((s) => ({
    ...s,
    character: {
      ...s.character,
      money: s.character.money - cosmetic.price!,
      ownedCosmeticIds: [...s.character.ownedCosmeticIds, cosmeticId],
    },
  }))
  return true
}

export function markCosmeticsSeen(ids: string[]): void {
  if (ids.length === 0) return
  setState((s) => ({
    ...s,
    character: {
      ...s.character,
      seenNewCosmeticIds: Array.from(new Set([...(s.character.seenNewCosmeticIds ?? []), ...ids])),
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

/** Archiving cascades to objectives and open tasks. Journal entries stay. */
export function archiveResult(id: string): void {
  const timestamp = now()
  setState((s) => {
    const objectiveIds = s.objectives.filter((o) => o.resultId === id).map((o) => o.id)
    return {
      ...s,
      results: s.results.map((r) => (r.id === id ? { ...r, status: 'archived' } : r)),
      objectives: s.objectives.map((o) =>
        o.resultId === id ? { ...o, archivedAt: o.archivedAt ?? timestamp } : o,
      ),
      tasks: s.tasks.map((t) => {
        const belongs = t.resultId === id || (t.objectiveId && objectiveIds.includes(t.objectiveId))
        const open = t.status === 'pending' || t.status === 'in_progress'
        return belongs && open ? { ...t, status: 'cancelled' } : t
      }),
    }
  })
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

/** Only adjacent stage moves are allowed; the caller confirms open tasks first. */
export function moveObjectiveStage(id: string, stage: StageId): boolean {
  const objective = getState().objectives.find((o) => o.id === id)
  if (!objective || !canMoveTo(objective.currentStage, stage)) return false
  const status: Objective['status'] =
    objective.status === 'pending' ? 'in_progress' : objective.status
  updateObjective(id, { currentStage: stage, status })
  return true
}

// -------------------------------------------------------------------- tasks

export interface TaskInput {
  title: string
  notes?: string
  resultId?: string
  objectiveId?: string
  stage?: StageId
  skillId?: string
  estimatedHours?: number
  difficulty?: Difficulty
  dueAt?: string
  scheduledFor?: string
}

export function createTask(input: TaskInput): Task {
  const state = getState()
  const stage = input.stage ?? 'research'
  const siblings = state.tasks.filter(
    (t) => t.objectiveId === input.objectiveId && t.stage === stage,
  )
  const task: Task = {
    id: newId('task'),
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    resultId: input.resultId || undefined,
    objectiveId: input.objectiveId || undefined,
    stage,
    skillId: input.skillId || undefined,
    estimatedHours: Math.max(MIN_ESTIMATED_HOURS, input.estimatedHours ?? 1),
    difficulty: input.difficulty ?? 'medium',
    importance: siblings.length,
    dueAt: input.dueAt || undefined,
    scheduledFor: input.scheduledFor || undefined,
    status: 'pending',
    rewardApplied: false,
    createdAt: now(),
  }
  setState((s) => ({ ...s, tasks: [...s.tasks, task] }))
  return task
}

/** Home composer: a block for today. */
export function proposeBlock(title: string, extra?: Partial<TaskInput>): Task | null {
  const trimmed = title.trim()
  if (!trimmed) return null
  const today = toDayKey(new Date())
  return createTask({
    title: trimmed,
    estimatedHours: 1,
    difficulty: 'medium',
    dueAt: today,
    scheduledFor: today,
    stage: 'research',
    ...extra,
  })
}

export function updateTask(id: string, patch: Partial<Omit<Task, 'id'>>): void {
  setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
}

export function cancelTask(id: string): void {
  updateTask(id, { status: 'cancelled' })
}

export function deleteTask(id: string): void {
  setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }))
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
}

/**
 * Runs the economy once and only once. Returns null when the task is missing or
 * its reward was already paid.
 */
export function completeTask(id: string, options?: { actualHours?: number }): CompletionOutcome | null {
  const state = getState()
  const task = state.tasks.find((t) => t.id === id)
  if (!task || task.rewardApplied) return null

  const completedAt = now()
  const result = task.resultId ? state.results.find((r) => r.id === task.resultId) : undefined
  const reward = computeReward({
    estimatedHours: task.estimatedHours,
    actualHours: options?.actualHours ?? task.actualHours,
    difficulty: task.difficulty,
    dueAt: task.dueAt,
    completedAt,
    activeResult: result?.status === 'active',
  })

  const characterXp = addCharacterXp(state.character, reward.xp)
  const unlockedCosmetics: Cosmetic[] = []
  for (let level = state.character.level + 1; level <= characterXp.level; level += 1) {
    unlockedCosmetics.push(...cosmeticsUnlockedAtLevel(level))
  }

  const skill = task.skillId ? state.skills.find((s) => s.id === task.skillId) : undefined
  const skillXp = skill ? addSkillXp(skill, reward.xp) : null

  const completedTask: Task = {
    ...task,
    actualHours: options?.actualHours ?? task.actualHours,
    completedAt,
    status: reward.status,
    xpGranted: reward.xp,
    moneyGranted: reward.money,
    rewardApplied: true,
  }

  setState((s) => ({
    ...s,
    character: {
      ...s.character,
      level: characterXp.level,
      xp: characterXp.xp,
      xpToNext: characterXp.xpToNext,
      money: s.character.money + reward.money,
      ownedCosmeticIds: Array.from(
        new Set([...s.character.ownedCosmeticIds, ...unlockedCosmetics.map((c) => c.id)]),
      ),
    },
    skills: skillXp
      ? s.skills.map((sk) =>
          sk.id === skill!.id ? { ...sk, level: skillXp.level, xp: skillXp.xp } : sk,
        )
      : s.skills,
    tasks: s.tasks.map((t) => (t.id === id ? completedTask : t)),
  }))

  return {
    task: completedTask,
    reward,
    skillId: task.skillId,
    skillLevelsGained: skillXp?.levelsGained ?? 0,
    characterLevelsGained: characterXp.levelsGained,
    newLevel: characterXp.level,
    unlockedCosmetics,
  }
}

/** Reopens a task. The reward already paid is kept: rewards never get clawed back. */
export function reopenTask(id: string): void {
  updateTask(id, { status: 'pending', completedAt: undefined })
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

// ---------------------------------------------------------------- relations

export function addRelation(input: {
  fromType: ParentType
  fromId: string
  toType: ParentType
  toId: string
  kind: RelationKind
}): Relation | null {
  if (input.fromId === input.toId) return null
  const exists = getState().relations.some(
    (r) =>
      r.fromId === input.fromId &&
      r.toId === input.toId &&
      r.kind === input.kind &&
      r.fromType === input.fromType,
  )
  if (exists) return null
  const relation: Relation = { id: newId('relation'), ...input }
  setState((s) => ({ ...s, relations: [...s.relations, relation] }))
  return relation
}

export function removeRelation(id: string): void {
  setState((s) => ({ ...s, relations: s.relations.filter((r) => r.id !== id) }))
}
