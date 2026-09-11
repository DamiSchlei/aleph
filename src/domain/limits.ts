import type { Objective } from './types'

export const MAX_OBJECTIVES_PER_RESULT = 4

export const MIN_ESTIMATED_HOURS = 0.25

/** Design for 3 attending results. Soft-warn when creating would make 4. */
export const PLAN_TOTAL_FEATURED = 3
export const SOFT_WARN_ACTIVE_RESULTS = 4

export const MAX_CHECKLIST_ITEMS = 7

/** Weekly series cap: one Task per matching day, never a Block entity. */
export const MAX_SERIES_BLOCKS = 20

export function activeObjectivesOfResult(objectives: Objective[], resultId: string): Objective[] {
  return objectives.filter((o) => o.resultId === resultId && !o.archivedAt)
}

export function canAddObjective(objectives: Objective[], resultId: string): boolean {
  return activeObjectivesOfResult(objectives, resultId).length < MAX_OBJECTIVES_PER_RESULT
}

/** True when adding another attending result should offer the journal instead. */
export function shouldSoftWarnActiveResults(activeCount: number): boolean {
  return activeCount >= SOFT_WARN_ACTIVE_RESULTS - 1
}
