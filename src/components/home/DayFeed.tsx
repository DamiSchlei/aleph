import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TaskBlock } from '@/components/home/TaskBlock'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { SortableList } from '@/components/ui/SortableList'
import { completeTask, reopenTask, reorderTasks } from '@/data/actions'
import { closedHoursForDay, lostHoursForDay } from '@/data/dayLoad'
import { blockContext, tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { toDayKey } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { formatHours } from '@/i18n/format'
import type { Task } from '@/domain/types'

function dayHeading(dayKey: string, localeTag: string): string {
  const date = new Date(`${dayKey}T12:00:00`)
  const weekday = new Intl.DateTimeFormat(localeTag, { weekday: 'long' }).format(date)
  return `${weekday} ${date.getDate()}`
}

export function DayFeed({
  days,
  jumpDay,
  jumpNonce,
  localeTag,
  omitDay,
  scrollMarginTop = 12,
  onActiveDayChange,
  onApproachEdge,
}: {
  days: string[]
  jumpDay: string
  jumpNonce: number
  localeTag: string
  /** Day already listed in DayTaskViewer — keep a jump sentinel only. */
  omitDay?: string
  /** Sticky chrome height in px — used for scroll-mt and observer rootMargin. */
  scrollMarginTop?: number
  onActiveDayChange: (dayKey: string) => void
  /** Fired when the visible day is near the first/last loaded day. */
  onApproachEdge?: (edge: 'start' | 'end', dayKey: string) => void
}) {
  const jumping = useRef(false)

  useEffect(() => {
    if (scrollMarginTop <= 0) return
    jumping.current = true
    const node = document.getElementById(`day-feed-${jumpDay}`)
    node?.scrollIntoView({ block: 'start', behavior: jumpNonce === 0 ? 'auto' : 'smooth' })
    const timer = window.setTimeout(() => {
      jumping.current = false
    }, 450)
    return () => window.clearTimeout(timer)
  }, [jumpDay, jumpNonce, scrollMarginTop])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-day-key]'))
    if (nodes.length === 0) return
    const topGap = Math.max(8, Math.round(scrollMarginTop))
    const observer = new IntersectionObserver(
      (entries) => {
        if (jumping.current) return
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const key = visible[0]?.target.getAttribute('data-day-key')
        if (!key) return
        onActiveDayChange(key)
        const index = days.indexOf(key)
        if (index >= 0 && index <= 2) onApproachEdge?.('start', key)
        if (index >= days.length - 3) onApproachEdge?.('end', key)
      },
      {
        root: null,
        rootMargin: `-${topGap}px 0px -55% 0px`,
        threshold: [0.15, 0.35, 0.6],
      },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [days, onActiveDayChange, onApproachEdge, scrollMarginTop])

  return (
    <div className="flex flex-col gap-10 pb-6">
      {days.map((dayKey) => (
        <DayItem
          key={dayKey}
          dayKey={dayKey}
          localeTag={localeTag}
          omitted={dayKey === omitDay}
          scrollMarginTop={scrollMarginTop}
        />
      ))}
    </div>
  )
}

function DayItem({
  dayKey,
  localeTag,
  omitted,
  scrollMarginTop,
}: {
  dayKey: string
  localeTag: string
  omitted: boolean
  scrollMarginTop: number
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const { celebrate } = useFeedback()
  const tasks = tasksForDay(state, dayKey)
  const locale = state.character.locale
  const todayKey = toDayKey(new Date())
  const isPast = dayKey < todayKey
  const lost = lostHoursForDay(state.character.dailyHourCap ?? 5, closedHoursForDay(state, dayKey))
  const empty = tasks.length === 0
  const [editing, setEditing] = useState<Task | undefined>()

  const toggle = (task: Task) => {
    if (isTaskDone(task.status)) {
      reopenTask(task.id)
      return
    }
    const outcome = completeTask(task.id)
    if (outcome?.paid) celebrate(outcome)
  }

  const groupHeads = new Set<string>()
  {
    let last: string | undefined
    for (const task of tasks) {
      const id = blockContext(state, task).result?.id
      if (id && id !== last) {
        groupHeads.add(task.id)
        last = id
      }
    }
  }

  if (omitted) {
    return (
      <section
        id={`day-feed-${dayKey}`}
        data-day-key={dayKey}
        aria-hidden
        className="h-2 scroll-mt-3"
        style={{ scrollMarginTop: `${scrollMarginTop + 8}px` }}
      />
    )
  }

  return (
    <section
      id={`day-feed-${dayKey}`}
      data-day-key={dayKey}
      className="flex flex-col gap-3"
      style={{ scrollMarginTop: `${scrollMarginTop + 8}px` }}
    >
      <h2 className="truncate text-[18px] leading-tight font-semibold capitalize text-ink">
        {dayHeading(dayKey, localeTag)}
      </h2>
      {isPast && lost > 0 ? (
        <p className="text-[12px] text-ink-3">
          {t('home.lostPast', { n: formatHours(lost, locale) })}
        </p>
      ) : null}

      {empty ? (
        <p className="px-1 py-4 text-[15px] leading-relaxed text-ink-3">{t('home.agendaEmpty')}</p>
      ) : (
        <SortableList
          ids={tasks.map((task) => task.id)}
          handleLabel={t('home.reorder')}
          onReorder={(ids) => reorderTasks(ids, 'dayOrder')}
        >
          {(id, handle) => {
            const task = tasks.find((item) => item.id === id)
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
      )}

      <TaskFormSheet
        open={Boolean(editing)}
        task={editing}
        onClose={() => setEditing(undefined)}
      />
    </section>
  )
}
