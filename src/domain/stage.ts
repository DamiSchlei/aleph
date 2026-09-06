import type { StageId, Task } from './types'

export const STAGE_ORDER: StageId[] = ['research', 'execution', 'review']

export function stageIndex(stage: StageId): number {
  return STAGE_ORDER.indexOf(stage)
}

export function nextStage(stage: StageId): StageId | null {
  const i = stageIndex(stage)
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null
}

export function previousStage(stage: StageId): StageId | null {
  const i = stageIndex(stage)
  return i > 0 ? STAGE_ORDER[i - 1] : null
}

/** Stages cannot be skipped: only a move to an adjacent stage is legal. */
export function canAdvance(from: StageId, to: StageId): boolean {
  const diff = stageIndex(to) - stageIndex(from)
  return diff === 1
}

export function canMoveTo(from: StageId, to: StageId): boolean {
  return Math.abs(stageIndex(to) - stageIndex(from)) === 1
}

/** Stages already reached by an objective, which stay open for new tasks. */
export function openedStages(currentStage: StageId): StageId[] {
  return STAGE_ORDER.slice(0, stageIndex(currentStage) + 1)
}

export function openTasksInStage(tasks: Task[], objectiveId: string, stage: StageId): Task[] {
  return tasks.filter(
    (t) =>
      t.objectiveId === objectiveId &&
      t.stage === stage &&
      t.status !== 'done_on_time' &&
      t.status !== 'done_late' &&
      t.status !== 'cancelled',
  )
}
