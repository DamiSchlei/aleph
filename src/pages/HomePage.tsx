import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/nav/AppHeader'
import { SortableList } from '@/components/ui/SortableList'
import { cx } from '@/components/ui/primitives'
import {
  captureLooseTask,
  completeTask,
  reopenTask,
  reorderTasks,
} from '@/data/actions'
import { resultById, tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { addDays, toDayKey } from '@/domain/dates'
import { parseComposerInput } from '@/domain/composerParse'
import { isTaskDone } from '@/domain/economy'
import { formatHours } from '@/i18n/format'
import type { Locale, Task } from '@/domain/types'

const WINDOW = 14
const DEFAULT_CAP = 5

function buildDays(anchor: Date): string[] {
  return Array.from({ length: WINDOW * 2 + 1 }, (_, i) => toDayKey(addDays(anchor, i - WINDOW)))
}

function dayHeading(dayKey: string, localeTag: string): string {
  const date = new Date(`${dayKey}T12:00:00`)
  const weekday = new Intl.DateTimeFormat(localeTag, { weekday: 'long' }).format(date)
  return `${weekday} ${date.getDate()}`
}

export function HomePage() {
  const { t, i18n } = useTranslation()
  const todayKey = toDayKey(new Date())
  const days = useMemo(() => buildDays(new Date()), [todayKey])
  const [activeDay, setActiveDay] = useState(todayKey)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const todayIndex = WINDOW
  const localeTag = i18n.language?.startsWith('en') ? 'en-US' : 'es-AR'

  useEffect(() => {
    const node = scrollerRef.current
    const child = node?.children[todayIndex] as HTMLElement | undefined
    if (node && child) node.scrollTo({ left: child.offsetLeft, behavior: 'auto' })
  }, [todayIndex])

  const scrollToToday = () => {
    const node = scrollerRef.current
    const child = node?.children[todayIndex] as HTMLElement | undefined
    if (node && child) node.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
    setActiveDay(todayKey)
  }

  const onScroll = () => {
    const node = scrollerRef.current
    if (!node) return
    const mid = node.scrollLeft + node.clientWidth / 2
    let best = todayIndex
    let bestDist = Number.POSITIVE_INFINITY
    Array.from(node.children).forEach((child, index) => {
      const el = child as HTMLElement
      const center = el.offsetLeft + el.offsetWidth / 2
      const dist = Math.abs(center - mid)
      if (dist < bestDist) {
        bestDist = dist
        best = index
      }
    })
    const next = days[best]
    if (next && next !== activeDay) setActiveDay(next)
  }

  return (
    <div className="flex flex-col">
      <AppHeader
        title={
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-[20px] font-semibold text-ink">{t('home.title')}</h1>
            {activeDay !== todayKey ? (
              <button
                type="button"
                onClick={scrollToToday}
                className="min-h-11 rounded-full px-3 text-[14px] font-medium text-accent"
              >
                {t('home.todayJump')}
              </button>
            ) : null}
          </div>
        }
      />

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto px-2.5 pb-6"
      >
        {days.map((dayKey) => (
          <DayColumn
            key={dayKey}
            dayKey={dayKey}
            localeTag={localeTag}
            className="w-[calc(100%-1.25rem)] shrink-0 snap-center px-1.5"
          />
        ))}
      </div>
    </div>
  )
}

function DayColumn({
  dayKey,
  localeTag,
  className,
}: {
  dayKey: string
  localeTag: string
  className?: string
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const { celebrate } = useFeedback()
  const tasks = tasksForDay(state, dayKey)
  const cap = state.character.dailyHourCap ?? DEFAULT_CAP
  const planned = tasks
    .filter((task) => !isTaskDone(task.status))
    .reduce((sum, task) => sum + task.estimatedHours, 0)
  const over = planned > cap
  const [draft, setDraft] = useState('')
  const [hours, setHours] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = useCallback(() => {
    const raw = draft.trim()
    if (!raw) return
    const parsed = parseComposerInput(raw, dayKey)
    const hasHourToken = /\d+(?:[.,]\d+)?\s*h\b/i.test(raw)
    captureLooseTask(parsed.title, {
      scheduledFor: parsed.scheduledFor,
      dueAt: parsed.scheduledFor,
      estimatedHours: hasHourToken ? parsed.estimatedHours : hours,
      difficulty: parsed.difficulty,
    })
    setDraft('')
    setHours(1)
    inputRef.current?.focus()
  }, [dayKey, draft, hours])

  const toggle = (task: Task) => {
    if (isTaskDone(task.status)) {
      reopenTask(task.id)
      return
    }
    const outcome = completeTask(task.id)
    if (outcome?.paid) celebrate(outcome)
  }

  return (
    <section className={cx('flex flex-col gap-3', className)}>
      <div className="sticky top-0 z-10 -mx-1.5 bg-bg/95 px-1.5 py-2 backdrop-blur">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-[28px] leading-none font-semibold capitalize text-ink">
            {dayHeading(dayKey, localeTag)}
          </h2>
          <p className={cx('text-[13px] font-medium tabular-nums', over ? 'text-amber' : 'text-ink-3')}>
            {t('home.workload', {
              planned: formatHours(planned, state.character.locale),
              cap: formatHours(cap, state.character.locale),
            })}
          </p>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-subtle">
          <div
            className={cx('h-full rounded-full transition-[width]', over ? 'bg-amber' : 'bg-accent')}
            style={{ width: `${Math.min(100, (planned / Math.max(cap, 0.1)) * 100)}%` }}
          />
        </div>
        {over ? (
          <p className="mt-1.5 text-[12px] text-amber">
            {t('home.overCap', {
              planned: formatHours(planned, state.character.locale),
              cap: formatHours(cap, state.character.locale),
            })}
          </p>
        ) : null}
      </div>

      <form
        className="flex items-center gap-2 rounded-2xl border border-line-strong bg-bg px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('home.composerPlaceholder')}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-4"
        />
        <div className="flex items-center text-[13px] text-ink-3">
          <button
            type="button"
            aria-label={t('home.hoursDown')}
            className="flex size-9 items-center justify-center rounded-xl hover:bg-subtle"
            onClick={() => setHours((value) => Math.max(0.5, Math.round((value - 0.5) * 10) / 10))}
          >
            −
          </button>
          <span className="min-w-8 text-center tabular-nums text-ink">{hours}h</span>
          <button
            type="button"
            aria-label={t('home.hoursUp')}
            className="flex size-9 items-center justify-center rounded-xl hover:bg-subtle"
            onClick={() => setHours((value) => Math.min(8, Math.round((value + 0.5) * 10) / 10))}
          >
            +
          </button>
        </div>
        <button
          type="submit"
          disabled={!draft.trim()}
          className={cx(
            'min-h-11 rounded-2xl px-3 text-[14px] font-semibold',
            draft.trim() ? 'bg-accent text-white' : 'bg-subtle text-ink-4',
          )}
        >
          {t('home.composerCta')}
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="px-1 py-6 text-[15px] text-ink-3">{t('home.dayOpen')}</p>
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
              <BlockRow
                task={task}
                handle={handle}
                onToggle={() => toggle(task)}
                resultName={resultById(state, task.resultId)?.name}
                locale={state.character.locale}
              />
            )
          }}
        </SortableList>
      )}
    </section>
  )
}

function BlockRow({
  task,
  handle,
  onToggle,
  resultName,
  locale,
}: {
  task: Task
  handle: ReactNode
  onToggle: () => void
  resultName?: string
  locale: Locale
}) {
  const { t } = useTranslation()
  const done = isTaskDone(task.status)
  const hoursLabel =
    task.actualHours !== undefined
      ? t('home.hoursActual', {
          actual: formatHours(task.actualHours, locale),
          estimated: formatHours(task.estimatedHours, locale),
        })
      : t('home.hoursOnly', { estimated: formatHours(task.estimatedHours, locale) })

  return (
    <div
      className={cx(
        'flex items-center gap-1 rounded-2xl border border-line bg-surface px-1 py-1',
        done && 'opacity-60',
      )}
    >
      {handle}
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={t('home.completeBlock')}
        onClick={onToggle}
        className="flex size-11 shrink-0 items-center justify-center"
      >
        <span
          className={cx(
            'flex size-[22px] items-center justify-center rounded-md border-2',
            done ? 'border-mint bg-mint text-white' : 'border-line-strong',
          )}
        >
          {done ? (
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
      </button>
      <div className="min-w-0 flex-1 py-2 pr-2">
        <p className={cx('truncate text-[15px] text-ink', done && 'line-through')}>{task.title}</p>
        {resultName ? <p className="truncate text-[12px] text-ink-3">{resultName}</p> : null}
      </div>
      <span className="shrink-0 pr-2 text-[12px] tabular-nums text-ink-3">{hoursLabel}</span>
    </div>
  )
}
