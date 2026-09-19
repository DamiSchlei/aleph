import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
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

type GroupFlag = { showGroupLabel: boolean; omitResult: boolean }

type ViewerValue = {
  activeDay: string
  todayKey: string
  localeTag: string
  open: boolean
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void
  adding: boolean
  setAdding: (value: boolean | ((prev: boolean) => boolean)) => void
  expanded: boolean
  setExpanded: (value: boolean) => void
  tasks: Task[]
  visible: Task[]
  hiddenCount: number
  empty: boolean
  isToday: boolean
  title: string
  hoursMeta: string | null
  flags: GroupFlag[]
  toggle: (task: Task) => void
  editing: Task | undefined
  setEditing: (task: Task | undefined) => void
}

const ViewerContext = createContext<ViewerValue | null>(null)

function useViewer(): ViewerValue {
  const value = useContext(ViewerContext)
  if (!value) throw new Error('Day viewer is missing its scope')
  return value
}

function groupFlags(tasks: Task[], state: ReturnType<typeof useAleph>): GroupFlag[] {
  const ids = tasks.map((task) => blockContext(state, task).result?.id)
  return tasks.map((_, index) => {
    const rid = ids[index]
    const prev = ids[index - 1]
    const next = ids[index + 1]
    const showGroupLabel = Boolean(rid && rid !== prev && rid === next)
    const omitResult = Boolean(rid && (rid === prev || showGroupLabel))
    return { showGroupLabel, omitResult }
  })
}

export function DayViewerScope({
  activeDay,
  todayKey,
  localeTag,
  children,
}: {
  activeDay: string
  todayKey: string
  localeTag: string
  children: ReactNode
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

  const hoursMeta = (() => {
    if (planned <= 0) return null
    const workload = t('home.workload', {
      planned: formatHours(planned, locale),
      cap: formatHours(cap, locale),
    })
    if (isToday && free > 0) {
      return `${workload} · ${t('home.freeInline', { n: formatHours(free, locale) })}`
    }
    return workload
  })()

  const visible = expanded ? tasks : tasks.slice(0, VISIBLE_CAP)
  const hiddenCount = tasks.length - visible.length
  const flags = useMemo(() => groupFlags(visible, state), [visible, state])

  const value: ViewerValue = {
    activeDay,
    todayKey,
    localeTag,
    open,
    setOpen,
    adding,
    setAdding,
    expanded,
    setExpanded,
    tasks,
    visible,
    hiddenCount,
    empty,
    isToday,
    title,
    hoursMeta,
    flags,
    toggle,
    editing,
    setEditing,
  }

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>
}

/** Sticky one-row header: chevron + title, planned/cap · free. */
export function DayTaskViewerHeader() {
  const { open, setOpen, title, hoursMeta } = useViewer()

  return (
    <div className="mt-2">
      <h2 className="sr-only" aria-live="polite">
        {title}
      </h2>
      <button
        type="button"
        aria-expanded={open}
        aria-label={title}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center gap-2 text-left"
      >
        <span aria-hidden className="w-4 text-[13px] text-ink-3">
          {open ? '▾' : '▸'}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">{title}</span>
        {hoursMeta ? (
          <span className="shrink-0 text-[13px] tabular-nums text-ink-3">{hoursMeta}</span>
        ) : null}
      </button>
    </div>
  )
}

/** Active-day TaskBlocks + add fold. Sits under the sticky chrome, not inside it. */
export function DayTaskViewer() {
  const { t } = useTranslation()
  const {
    activeDay,
    open,
    adding,
    setAdding,
    setExpanded,
    visible,
    hiddenCount,
    empty,
    flags,
    toggle,
    editing,
    setEditing,
    tasks,
  } = useViewer()

  useEffect(() => {
    if (!adding) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAdding(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [adding, setAdding])

  if (!open) return null

  return (
    <section className="flex flex-col gap-2 pt-1 pb-4">
      {empty ? (
        <p className="px-1 py-2 text-[15px] leading-relaxed text-ink-3">{t('home.viewerEmpty')}</p>
      ) : (
        <>
          <SortableList
            ids={visible.map((task) => task.id)}
            handleLabel={t('home.reorder')}
            onReorder={(ids) => {
              const rest = tasks.filter((task) => !ids.includes(task.id)).map((task) => task.id)
              reorderTasks([...ids, ...rest], 'dayOrder')
            }}
          >
            {(id, handle) => {
              const index = visible.findIndex((item) => item.id === id)
              const task = visible[index]
              if (!task) return null
              const flag = flags[index]
              return (
                <TaskBlock
                  task={task}
                  handle={handle}
                  onToggle={() => toggle(task)}
                  onOpen={() => setEditing(task)}
                  showGroupLabel={flag?.showGroupLabel}
                  omitResult={flag?.omitResult}
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
          <div className="pt-1 pb-2">
            <Composer dayKey={activeDay} />
          </div>
        ) : null}
      </div>

      <TaskFormSheet
        open={Boolean(editing)}
        task={editing}
        onClose={() => setEditing(undefined)}
      />
    </section>
  )
}
