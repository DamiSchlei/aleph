import { deadlineOf } from './dates'
import type { Character, Difficulty, Skill, Task, TaskStatus } from './types'

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  low: 1.0,
  medium: 1.4,
  high: 1.8,
}

export const XP_PER_HOUR = 10
export const MONEY_PER_HOUR = 5
export const ON_TIME_BONUS = 1.25
export const LATE_MONEY_PENALTY = 0.5
export const ACTIVE_RESULT_BONUS = 1.2

export interface RewardInput {
  estimatedHours: number
  actualHours?: number
  difficulty: Difficulty
  dueAt?: string
  /** Defaults to now. */
  completedAt?: string
  /** True when the task belongs to a Result whose status is 'active'. */
  activeResult?: boolean
}

export interface Reward {
  xp: number
  money: number
  hours: number
  onTime: boolean
  /** Whole days late, 0 when on time or undated. */
  daysLate: number
  status: Extract<TaskStatus, 'done_on_time' | 'done_late'>
}

/** A task with no due date counts as on time. */
export function isOnTime(dueAt: string | undefined, completedAt: Date | string): boolean {
  if (!dueAt) return true
  const done = typeof completedAt === 'string' ? new Date(completedAt) : completedAt
  return done.getTime() <= deadlineOf(dueAt).getTime()
}

/**
 * Base reward is rounded first (as specified), then the modifiers apply in order:
 * on-time bonus or late money penalty, then the active-result bonus.
 */
export function computeReward(input: RewardInput): Reward {
  const hours = input.actualHours ?? input.estimatedHours
  const mult = DIFFICULTY_MULTIPLIER[input.difficulty]
  const completedAt = input.completedAt ? new Date(input.completedAt) : new Date()

  let xp = Math.round(hours * XP_PER_HOUR * mult)
  let money = Math.round(hours * MONEY_PER_HOUR * mult)

  const onTime = isOnTime(input.dueAt, completedAt)

  if (input.dueAt) {
    if (onTime) {
      xp *= ON_TIME_BONUS
      money *= ON_TIME_BONUS
    } else {
      money *= LATE_MONEY_PENALTY
    }
  }

  if (input.activeResult) {
    xp *= ACTIVE_RESULT_BONUS
    money *= ACTIVE_RESULT_BONUS
  }

  const daysLate =
    !onTime && input.dueAt
      ? Math.max(
          1,
          Math.ceil((completedAt.getTime() - deadlineOf(input.dueAt).getTime()) / 86_400_000),
        )
      : 0

  return {
    xp: Math.round(xp),
    money: Math.round(money),
    hours,
    onTime,
    daysLate,
    status: onTime ? 'done_on_time' : 'done_late',
  }
}

/** What the task is worth if completed right now. Used for the projected XP/$ column. */
export function projectReward(task: Task, activeResult: boolean, at: Date = new Date()): Reward {
  return computeReward({
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
    difficulty: task.difficulty,
    dueAt: task.dueAt,
    completedAt: at.toISOString(),
    activeResult,
  })
}

export interface CharacterXpResult {
  level: number
  xp: number
  xpToNext: number
  levelsGained: number
}

export function xpToNextForLevel(level: number): number {
  return 100 * level
}

/** Adds XP and rolls levels over, carrying the overflow. */
export function addCharacterXp(
  character: Pick<Character, 'level' | 'xp' | 'xpToNext'>,
  amount: number,
): CharacterXpResult {
  let level = character.level
  let xp = character.xp + Math.max(0, amount)
  let xpToNext = character.xpToNext > 0 ? character.xpToNext : xpToNextForLevel(level)
  let levelsGained = 0

  while (xp >= xpToNext) {
    xp -= xpToNext
    level += 1
    levelsGained += 1
    xpToNext = xpToNextForLevel(level)
  }

  return { level, xp, xpToNext, levelsGained }
}

export const SKILL_XP_PER_LEVEL = 100

export interface SkillXpResult {
  level: number
  xp: number
  levelsGained: number
}

export function addSkillXp(skill: Pick<Skill, 'level' | 'xp'>, amount: number): SkillXpResult {
  let level = skill.level
  let xp = skill.xp + Math.max(0, amount)
  let levelsGained = 0

  while (xp >= SKILL_XP_PER_LEVEL) {
    xp -= SKILL_XP_PER_LEVEL
    level += 1
    levelsGained += 1
  }

  return { level, xp, levelsGained }
}

export function isTaskDone(status: TaskStatus): boolean {
  return status === 'done_on_time' || status === 'done_late'
}

/** Rewards are paid at most once per task. */
export function shouldPayReward(task: Pick<Task, 'rewardApplied'>): boolean {
  return !task.rewardApplied
}
