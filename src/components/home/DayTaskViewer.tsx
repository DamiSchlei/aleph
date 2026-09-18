import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Composer } from '@/components/home/Composer'
import { TaskBlock } from '@/components/home/TaskBlock'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { SortableList } from '@/components/ui/SortableList'
import { completeTask, reopenTask, reorderTasks } from '@/data/actions'
import { freeHoursForDay, plannedHoursForDay } from '@/data/dayLoad'
import { blockContext, tasksForDay } from '@/data/selectors'
import { getState, useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { parseLocal } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { formatHours } from '@/i18n/format'
import type { Task } from '@/domain/types'

const DEFAULT_CAP = 5
const VISIBLE_CAP = 4

function weekdayDateLabel(dayKey: string, localeTag: string): string {
  const date = parseLocal(dayKey)
  const weekday = new Intl.DateTimeFormat(localeTag, { weekday: 'long' }).format(date)
  return `${weekday} ${date.getDate()}`
}

/**
 * Collapsible list of the strip-selected day’s tasks, docked under the week strip.
 * Binds to `activeDay`, not hardcoded today.
 */
export function DayTaskViewer({
  activeDay,
  todayKey,
  localeTag,
}: {
  activeDay: string
  todayKey: string
  localeTag: string
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const { celebrate } = useFeedback()
  const locale = state.character.locale
  const cap = state.character.dailyHourCap ?? DEFAULT_CAP
  const tasks = tasksForDay(state, activeDay)
  const planned = plannedHoursForDay(state, activeDay)
  const free = freeHoursForDay(cap, planned)
  const isToday = activeDay === todayKey
  const empty = tasks.length === 0

  const [open, setOpen] = useState(() => isToday || tasks.length > 0)
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>()

  useEffect(() => {
    const hasTasks = tasksForDay(getState(), activeDay).length > 0
    setOpen(activeDay === todayKey || hasTasks)
    setExpanded(false)
    setAdding(false)
  }, [activeDay, todayKey])

  const toggle = (task: Task) => {
    if (isTaskDone(task.status)) {
      reopenTask(task.id)
      return
    }
    const outcome = completeTask(task.id)
    if (outcome?.paid) celebrate(outcome)
  }

  const title = isToday
    ? t('home.viewerTitleToday')
    : t('home.viewerTitle', { day: weekdayDateLabel(activeDay, localeTag) })
  const collapsedTitle = t('home.viewerTitle', { day: String(tasks.length) })
  const hoursLabel =
    planned > 0
      ? t('home.workload', {
          planned: formatHours(planned, locale),
          cap: formatHours(cap, locale),
        })
      : null
  const visible = expanded ? tasks : tasks.slice(0, VISIBLE_CAP)
  const hiddenCount = tasks.length - visible.length

  const groupHeads = new Set<string>()
  {
    let last: string | undefined
    for (const task of visible) {
      const id = blockContext(state, task).result?.id
      if (id && id !== last) {
        groupHeads.add(task.id)
        last = id
      }
    }
  }

  return (
    <section className="mt-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center gap-2 text-left"
      >
        <span aria-hidden className="w-4 text-[13px] text-ink-3">
          {open ? '▾' : '▸'}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium capitalize text-ink">
          {open ? title : collapsedTitle}
        </span>
        {hoursLabel ? (
          <span className="shrink-0 text-[13px] tabular-nums text-ink-3">{hoursLabel}</span>
        ) : null}
      </button>

      {open ? (
        <div className="flex flex-col gap-2 pt-1">
          {empty ? (
            <p className="px-1 py-2 text-[15px] leading-relaxed text-ink-3">{t('home.viewerEmpty')}</p>
          ) : (
            <>
              {isToday && free > 0 ? (
                <p className="px-1 text-[12px] text-ink-3">
                  {t('home.freeToday', { n: formatHours(free, locale) })}
                </p>
              ) : null}
              <SortableList
                ids={visible.map((task) => task.id)}
                handleLabel={t('home.reorder')}
                onReorder={(ids) => {
                  const rest = tasks.filter((task) => !ids.includes(task.id)).map((task) => task.id)
                  reorderTasks([...ids, ...rest], 'dayOrder')
                }}
              >
                {(id, handle) => {
                  const task = visible.find((item) => item.id === id)
                  if (!task) return null
                  return (
                    <TaskBlock
                      task={task}
                      handle={handle}
                      onToggle={() => toggle(task)}
                      onOpen={() => setEditing(task)}
                      showGroupLabel={groupHeads.has(task.id)}
                    />
                  )
                }}
              </SortableList>
              {hiddenCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="min-h-11 self-start px-1 text-[14px] font-medium text-accent"
                >
                  {t('home.viewerSeeAll', { n: tasks.length })}
                </button>
              ) : null}
            </>
          )}

          <div>
            <button
              type="button"
              aria-expanded={adding}
              onClick={() => setAdding((value) => !value)}
              className="flex min-h-11 w-full items-center gap-2 text-left"
            >
              <span aria-hidden className="w-4 text-[13px] text-ink-3">
                {adding ? '▾' : '▸'}
              </span>
              <span className="text-[14px] font-medium text-ink">{t('home.addTask')}</span>
            </button>
            {adding ? (
              <div className="pt-1">
                <Composer dayKey={activeDay} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <TaskFormSheet
        open={Boolean(editing)}
        task={editing}
        onClose={() => setEditing(undefined)}
      />
    </section>
  )
}
