import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { TaskCheckbox } from '@/components/task/TaskRow'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { agendaTasks, isTaskOverdue, type AgendaFilter } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatHours, formatLongDate } from '@/i18n/format'
import { isTaskDone } from '@/domain/economy'
import { Button, cx } from '@/components/ui/primitives'
import type { Task } from '@/domain/types'

const AGENDA_MAX = 4

export const AGENDA_ROW_CLASS =
  'rounded-2xl bg-ink-900/80 px-3 py-2.5 min-h-11 flex items-center gap-3'

export function Agenda({
  filter,
  pickDate,
}: {
  filter: AgendaFilter
  pickDate: string
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const tasks = agendaTasks(state, filter, pickDate)
  const { toggle, dialog: completionDialog } = useTaskCompletion()
  const [editing, setEditing] = useState<Task | undefined>()
  const [expanded, setExpanded] = useState(false)
  const overflow = tasks.length > AGENDA_MAX
  const visible = overflow && !expanded ? tasks.slice(0, AGENDA_MAX) : tasks

  const title =
    filter === 'undated'
      ? t('home.undatedTitle')
      : filter === 'pick'
        ? pickDate
          ? formatLongDate(pickDate, locale)
          : t('home.filters.pick')
        : t(`home.filters.${filter}`)

  return (
    <section className="flex flex-col gap-2">
      <p className="text-[11px] font-medium tracking-[0.16em] text-text-3 uppercase">{title}</p>

      {tasks.length === 0 ? (
        <>
          <p className="text-[14px] leading-relaxed text-text-3">{t('home.agendaEmpty')}</p>
          <Button
            variant="ghost"
            className="self-start"
            onClick={() => {
              document.getElementById('home-composer-input')?.focus()
              document.getElementById('home-composer-input')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
            }}
          >
            {t('home.agendaEmptyCta')}
          </Button>
        </>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((task) => {
            const done = isTaskDone(task.status)
            const overdue = isTaskOverdue(task)
            const hours = t('common.hours', {
              count: Number(formatHours(task.actualHours ?? task.estimatedHours, locale)),
            })
            return (
              <li key={task.id}>
                <div className={AGENDA_ROW_CLASS}>
                  <TaskCheckbox
                    done={done}
                    onToggle={() => toggle(task)}
                    label={t('home.completeTask')}
                  />
                  <button
                    type="button"
                    onClick={() => setEditing(task)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p
                      className={cx(
                        'truncate text-[14px]',
                        done ? 'text-text-3 line-through' : 'text-white',
                      )}
                    >
                      {task.title}
                    </p>
                  </button>
                  <span className={cx('shrink-0 text-[12px]', overdue ? 'text-amber' : 'text-text-3')}>
                    {hours}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {overflow && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="self-start text-[13px] text-accent"
        >
          {t('home.seeDay')}
        </button>
      ) : null}

      {completionDialog}
      <TaskFormSheet
        open={Boolean(editing)}
        task={editing}
        blockedPrompt={editing ? isTaskOverdue(editing) && !isTaskDone(editing.status) : false}
        onClose={() => setEditing(undefined)}
      />
    </section>
  )
}
