import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { completeTask, reopenTask } from '@/data/actions'
import { blockingDependencies } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { isTaskDone } from '@/domain/economy'
import type { Task } from '@/domain/types'

/**
 * Single entry point for checking a task off. Warns about unmet `depends_on`
 * relations, pays the reward once, and hands the outcome to the feedback layer.
 */
export function useTaskCompletion(): {
  toggle: (task: Task) => void
  dialog: ReactNode
} {
  const state = useAleph()
  const { celebrate } = useFeedback()
  const { t } = useTranslation()
  const [pending, setPending] = useState<{ task: Task; blockers: Task[] } | null>(null)

  const run = (taskId: string) => {
    const outcome = completeTask(taskId)
    if (outcome) celebrate(outcome)
  }

  const toggle = (task: Task) => {
    if (isTaskDone(task.status)) {
      reopenTask(task.id)
      return
    }
    const blockers = blockingDependencies(state, task.id)
    if (blockers.length > 0) {
      setPending({ task, blockers })
      return
    }
    run(task.id)
  }

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      title={t('common.task')}
      message={t('planning.tasks.dependencyWarning', {
        tasks: pending?.blockers.map((b) => b.title).join(', ') ?? '',
      })}
      onCancel={() => setPending(null)}
      onConfirm={() => {
        if (pending) run(pending.task.id)
        setPending(null)
      }}
    />
  )

  return { toggle, dialog }
}
