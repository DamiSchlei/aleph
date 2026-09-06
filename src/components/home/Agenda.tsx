import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState, SectionTitle } from '@/components/ui/primitives'
import { SortableList } from '@/components/ui/SortableList'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { AssignSheet } from '@/components/task/AssignSheet'
import { TaskRow } from '@/components/task/TaskRow'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { reorderTasks } from '@/data/actions'
import { tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { toDayKey } from '@/domain/dates'
import { formatLongDate } from '@/i18n/format'
import { isTaskDone } from '@/domain/economy'
import type { Task } from '@/domain/types'

export function Agenda() {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const today = toDayKey(new Date())
  const tasks = tasksForDay(state, today)
  const { toggle, dialog } = useTaskCompletion()
  const [editing, setEditing] = useState<Task | undefined>()
  const [assigning, setAssigning] = useState<Task | undefined>()
  const done = tasks.filter((task) => isTaskDone(task.status)).length

  return (
    <section>
      <SectionTitle
        action={
          tasks.length > 0 ? (
            <span className="text-[12px] text-ink-400">
              {t('home.agendaCount', { done, total: tasks.length })}
            </span>
          ) : null
        }
      >
        {t('home.agendaTitle')} · {formatLongDate(new Date(), locale)}
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
                onToggle={() => toggle(task)}
                onOpen={() => setEditing(task)}
                onAssign={() => setAssigning(task)}
                handle={handle}
              />
            )
          }}
        </SortableList>
      )}
      {dialog}
      <TaskFormSheet open={Boolean(editing)} task={editing} onClose={() => setEditing(undefined)} />
      <AssignSheet
        open={Boolean(assigning)}
        task={assigning}
        onClose={() => setAssigning(undefined)}
      />
    </section>
  )
}
