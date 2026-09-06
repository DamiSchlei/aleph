import type { Objective } from './types'

export const MAX_OBJECTIVES_PER_RESULT = 4

export const MIN_ESTIMATED_HOURS = 0.25

export function activeObjectivesOfResult(objectives: Objective[], resultId: string): Objective[] {
  return objectives.filter((o) => o.resultId === resultId && !o.archivedAt)
}

export function canAddObjective(objectives: Objective[], resultId: string): boolean {
  return activeObjectivesOfResult(objectives, resultId).length < MAX_OBJECTIVES_PER_RESULT
}
