import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { deleteTask, returnToResearch } from '@/data/actions'
import type { Task } from '@/domain/types'

/**
 * Delete and return-to-research. Execute and close live in useTaskCompletion
 * so Home and Planning share the same mandatory sheets.
 */
export function useTaskActions(): {
  back: (task: Task) => void
  requestDelete: (task: Task) => void
  dialog: ReactNode
} {
  const { t } = useTranslation()
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null)

  const back = (task: Task) => returnToResearch(task.id)
  const requestDelete = (task: Task) => setConfirmDelete(task)

  const dialog = (
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
  )

  return { back, requestDelete, dialog }
}
