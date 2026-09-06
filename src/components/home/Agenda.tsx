import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip, EmptyState, Input, SectionTitle } from '@/components/ui/primitives'
import { SortableList } from '@/components/ui/SortableList'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { AssignSheet } from '@/components/task/AssignSheet'
import { TaskRow } from '@/components/task/TaskRow'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { useTaskActions } from '@/components/task/useTaskActions'
import { reorderTasks } from '@/data/actions'
import { agendaTasks, type AgendaFilter } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatLongDate } from '@/i18n/format'
import { isTaskDone } from '@/domain/economy'
import type { Task } from '@/domain/types'

const FILTERS: AgendaFilter[] = ['today', 'tomorrow', 'week', 'overdue', 'pick']

export function Agenda({
  filter,
  pickDate,
  onFilterChange,
  onPickDateChange,
}: {
  filter: AgendaFilter
  pickDate: string
  onFilterChange: (filter: AgendaFilter) => void
  onPickDateChange: (date: string) => void
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const tasks = agendaTasks(state, filter, pickDate)
  const { toggle, dialog: completionDialog } = useTaskCompletion()
  const actions = useTaskActions()
  const [editing, setEditing] = useState<Task | undefined>()
  const [assigning, setAssigning] = useState<Task | undefined>()
  const done = tasks.filter((task) => isTaskDone(task.status)).length

  const title =
    filter === 'pick'
      ? pickDate
        ? formatLongDate(pickDate, locale)
        : t('home.filters.pick')
      : t(`home.filters.${filter}`)

  const momentProps = {
    onComplete: (tk: Task) => toggle(tk),
    onExecute: (tk: Task) => actions.execute(tk),
    onReturn: (tk: Task) => actions.back(tk),
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((key) => (
          <Chip key={key} active={filter === key} onClick={() => onFilterChange(key)}>
            {t(`home.filters.${key}`)}
          </Chip>
        ))}
      </div>
      {filter === 'pick' ? (
        <Input
          type="date"
          value={pickDate}
          onChange={(e) => onPickDateChange(e.target.value)}
          aria-label={t('home.filters.pick')}
        />
      ) : null}

      <SectionTitle
        action={
          tasks.length > 0 ? (
            <span className="text-[12px] text-ink-400">
              {t('home.agendaCount', { done, total: tasks.length })}
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
                onToggle={() => toggle(task)}
                onOpen={() => setEditing(task)}
                onAssign={() => setAssigning(task)}
                onDelete={() => actions.requestDelete(task)}
                handle={handle}
              />
            )
          }}
        </SortableList>
      )}

      {completionDialog}
      {actions.dialog}
      <TaskFormSheet
        open={Boolean(editing)}
        task={editing}
        moments={momentProps}
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
