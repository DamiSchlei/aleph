import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { deleteTask, executeTask, returnToResearch } from '@/data/actions'
import { useAleph } from '@/data/store'
import type { Task } from '@/domain/types'

/**
 * Moment + delete actions shared by every task list. "Ejecutar" moves a research
 * task into execution, warning first when there is no note or journal for the step.
 * Delete is always confirmed and pays nothing.
 */
export function useTaskActions(): {
  execute: (task: Task) => void
  back: (task: Task) => void
  requestDelete: (task: Task) => void
  dialog: ReactNode
} {
  const state = useAleph()
  const { t } = useTranslation()
  const [confirmExec, setConfirmExec] = useState<Task | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null)

  const execute = (task: Task) => {
    if (task.stage !== 'research') return
    const hasNote = Boolean(task.notes?.trim())
    const hasJournal = state.comments.some(
      (c) => c.parentType === 'task' && c.parentId === task.id,
    )
    if (!hasNote && !hasJournal) {
      setConfirmExec(task)
      return
    }
    executeTask(task.id)
  }

  const back = (task: Task) => returnToResearch(task.id)
  const requestDelete = (task: Task) => setConfirmDelete(task)

  const dialog = (
    <>
      <ConfirmDialog
        open={confirmExec !== null}
        title={t('planning.tasks.execute')}
        message={t('planning.tasks.executeNoNote')}
        confirmLabel={t('planning.tasks.execute')}
        onCancel={() => setConfirmExec(null)}
        onConfirm={() => {
          if (confirmExec) executeTask(confirmExec.id)
          setConfirmExec(null)
        }}
      />
      <ConfirmDialog
        open={confirmDelete !== null}
        title={t('common.delete')}
        tone="danger"
        message={t('planning.tasks.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteTask(confirmDelete.id)
          setConfirmDelete(null)
        }}
      />
    </>
  )

  return { execute, back, requestDelete, dialog }
}
