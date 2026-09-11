import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState, SectionTitle } from '@/components/ui/primitives'
import { SortableList } from '@/components/ui/SortableList'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { AssignSheet } from '@/components/task/AssignSheet'
import { TaskRow } from '@/components/task/TaskRow'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { useTaskActions } from '@/components/task/useTaskActions'
import { reorderTasks } from '@/data/actions'
import { agendaTasks, isTaskOverdue, type AgendaFilter } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatLongDate } from '@/i18n/format'
import { isTaskDone } from '@/domain/economy'
import type { Task } from '@/domain/types'

export function Agenda({
  filter,
  pickDate,
  maxVisible,
  excludeTaskId,
}: {
  filter: AgendaFilter
  pickDate: string
  maxVisible?: number
  excludeTaskId?: string
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const [expanded, setExpanded] = useState(false)
  const allTasks = agendaTasks(state, filter, pickDate).filter(
    (task) => task.id !== excludeTaskId,
  )
  const tasks =
    maxVisible && !expanded && allTasks.length > maxVisible
      ? allTasks.slice(0, maxVisible)
      : allTasks
  const { toggle, dialog: completionDialog, literature } = useTaskCompletion()
  const actions = useTaskActions()
  const [editing, setEditing] = useState<Task | undefined>()
  const [assigning, setAssigning] = useState<Task | undefined>()
  const done = allTasks.filter((task) => isTaskDone(task.status)).length

  const title =
    filter === 'undated'
      ? t('home.undatedTitle')
      : filter === 'pick'
        ? pickDate
          ? formatLongDate(pickDate, locale)
          : t('home.filters.pick')
        : t(`home.filters.${filter}`)

  const momentProps = {
    onComplete: (tk: Task) => toggle(tk, { askLiterature: true }),
    onExecute: (tk: Task) => actions.execute(tk),
    onReturn: (tk: Task) => actions.back(tk),
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle
        action={
          allTasks.length > 0 ? (
            <span className="text-[12px] text-ink-400">
              {t('home.agendaCount', { done, total: allTasks.length })}
            </span>
          ) : null
        }
      >
        {title}
      </SectionTitle>

      {tasks.length === 0 ? (
        <EmptyState>{t('home.agendaEmpty')}</EmptyState>
      ) : (
        <SortableList
          ids={tasks.map((task) => task.id)}
          onReorder={(ids) => reorderTasks(ids, 'dayOrder')}
          handleLabel={t('common.reorderHint')}
        >
          {(id, handle) => {
            const task = tasks.find((item) => item.id === id)
            if (!task) return null
            return (
              <TaskRow
                task={task}
                density="home"
                onToggle={() => toggle(task, { askLiterature: true })}
                onOpen={() => setEditing(task)}
                onAssign={() => setAssigning(task)}
                onDelete={() => actions.requestDelete(task)}
                handle={handle}
              />
            )
          }}
        </SortableList>
      )}

      {maxVisible && !expanded && allTasks.length > maxVisible ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="min-h-11 w-full text-center text-[14px] text-ink-400 hover:text-ink-200"
        >
          {t('home.seeDay')}
        </button>
      ) : null}

      {completionDialog}
      {actions.dialog}
      {literature}
      <TaskFormSheet
        open={Boolean(editing)}
        task={editing}
        moments={momentProps}
        blockedPrompt={editing ? isTaskOverdue(editing) && !isTaskDone(editing.status) : false}
        onClose={() => setEditing(undefined)}
      />
      <AssignSheet
        open={Boolean(assigning)}
        task={assigning}
        onClose={() => setAssigning(undefined)}
      />
    </section>
  )
}
