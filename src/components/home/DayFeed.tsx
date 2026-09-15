import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TodayStep } from '@/components/home/TodayStep'
import { SortableList } from '@/components/ui/SortableList'
import { cx } from '@/components/ui/primitives'
import { captureLooseTask, completeTask, reopenTask, reorderTasks } from '@/data/actions'
import {
  closedHoursForDay,
  freeHoursForDay,
  lostHoursForDay,
  plannedHoursForDay,
} from '@/data/dayLoad'
import { resultById, tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { parseComposerInput } from '@/domain/composerParse'
import { toDayKey } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { dayMoment } from '@/i18n/dayMoment'
import { formatHours } from '@/i18n/format'
import type { Locale, Task } from '@/domain/types'

const DEFAULT_CAP = 5

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
  onActiveDayChange,
}: {
  days: string[]
  jumpDay: string
  jumpNonce: number
  localeTag: string
  onActiveDayChange: (dayKey: string) => void
}) {
  const jumping = useRef(false)

  useEffect(() => {
    jumping.current = true
    const node = document.getElementById(`day-feed-${jumpDay}`)
    node?.scrollIntoView({ block: 'start', behavior: jumpNonce === 0 ? 'auto' : 'smooth' })
    const timer = window.setTimeout(() => {
      jumping.current = false
    }, 400)
    return () => window.clearTimeout(timer)
  }, [jumpDay, jumpNonce])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-day-key]'))
    if (nodes.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (jumping.current) return
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const key = visible[0]?.target.getAttribute('data-day-key')
        if (key) onActiveDayChange(key)
      },
      { root: null, rootMargin: '-18% 0px -55% 0px', threshold: [0.15, 0.35, 0.6] },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [days, onActiveDayChange])

  return (
    <div className="flex flex-col gap-10 pb-6">
      {days.map((dayKey) => (
        <DayItem key={dayKey} dayKey={dayKey} localeTag={localeTag} />
      ))}
    </div>
  )
}

function DayItem({ dayKey, localeTag }: { dayKey: string; localeTag: string }) {
  const { t } = useTranslation()
  const state = useAleph()
  const { celebrate } = useFeedback()
  const tasks = tasksForDay(state, dayKey)
  const cap = state.character.dailyHourCap ?? DEFAULT_CAP
  const locale = state.character.locale
  const planned = plannedHoursForDay(state, dayKey)
  const closed = closedHoursForDay(state, dayKey)
  const todayKey = toDayKey(new Date())
  const isToday = dayKey === todayKey
  const isPast = dayKey < todayKey
  const free = freeHoursForDay(cap, planned)
  const lost = lostHoursForDay(cap, closed)
  const over = planned > cap
  const empty = tasks.length === 0
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

  const showWorkload = planned > 0

  return (
    <section id={`day-feed-${dayKey}`} data-day-key={dayKey} className="flex scroll-mt-3 flex-col gap-3">
      {isToday ? (
        <p className="text-[13px] text-ink-3">{t(`home.greeting.${dayMoment()}`)}</p>
      ) : null}

      <div>
        <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
          <h2 className="min-w-0 flex-1 truncate text-[26px] leading-tight font-semibold capitalize text-ink">
            {dayHeading(dayKey, localeTag)}
          </h2>
          {showWorkload ? (
            <p
              className={cx(
                'shrink-0 text-[13px] font-medium tabular-nums',
                over ? 'text-amber' : 'text-ink-3',
              )}
            >
              {t('home.workload', {
                planned: formatHours(planned, locale),
                cap: formatHours(cap, locale),
              })}
            </p>
          ) : null}
        </div>
        {empty ? null : (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-subtle">
            <div
              className={cx('h-full rounded-full transition-[width]', over ? 'bg-amber' : 'bg-accent')}
              style={{ width: `${Math.min(100, (planned / Math.max(cap, 0.1)) * 100)}%` }}
            />
          </div>
        )}
        {over ? (
          <p className="mt-1.5 text-[12px] text-amber">
            {t('home.overCap', {
              planned: formatHours(planned, locale),
              cap: formatHours(cap, locale),
            })}
          </p>
        ) : null}
        {isToday && free > 0 && !over ? (
          <p className="mt-1.5 text-[12px] text-ink-3">
            {t('home.freeToday', { n: formatHours(free, locale) })}
          </p>
        ) : null}
        {isPast && lost > 0 ? (
          <p className="mt-1.5 text-[12px] text-ink-3">
            {t('home.lostPast', { n: formatHours(lost, locale) })}
          </p>
        ) : null}
      </div>

      {isToday ? <TodayStep /> : null}

      {isToday ? (
        <form
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-line-strong bg-bg px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <input
            id="home-composer-input"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('home.composerPlaceholder')}
            className="min-h-11 min-w-0 flex-1 basis-[10rem] bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-4"
          />
          <div className="flex shrink-0 items-center text-[13px] text-ink-3">
            <button
              type="button"
              aria-label={t('home.hoursDown')}
              className="flex size-9 items-center justify-center rounded-xl hover:bg-subtle"
              onClick={() => setHours((value) => Math.max(0.5, Math.round((value - 0.5) * 10) / 10))}
            >
              −
            </button>
            <span className="min-w-7 text-center tabular-nums text-ink">{hours}h</span>
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
              'min-h-11 shrink-0 rounded-2xl px-3 text-[14px] font-semibold',
              draft.trim() ? 'bg-accent text-white' : 'bg-subtle text-ink-4',
            )}
          >
            {t('home.composerCta')}
          </button>
        </form>
      ) : null}

      {empty ? (
        isToday ? null : (
          <p className="px-1 py-4 text-[15px] leading-relaxed text-ink-3">{t('home.agendaEmpty')}</p>
        )
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
                locale={locale}
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
        'flex items-start gap-1 rounded-2xl border border-line bg-surface px-1 py-1.5',
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
      {(() => {
        const href = task.objectiveId
          ? `/planning/objectives/${task.objectiveId}`
          : task.resultId
            ? `/planning/results/${task.resultId}`
            : undefined
        const body = (
          <>
            <p
              className={cx(
                'line-clamp-2 break-words text-[15px] leading-snug text-ink',
                done && 'line-through',
              )}
            >
              {task.title}
            </p>
            {resultName ? (
              <p className="mt-0.5 line-clamp-1 break-words text-[12px] leading-snug text-ink-3">
                {resultName}
              </p>
            ) : null}
          </>
        )
        return href ? (
          <Link to={href} className="min-w-0 flex-1 overflow-hidden py-2 pr-2">
            {body}
          </Link>
        ) : (
          <div className="min-w-0 flex-1 overflow-hidden py-2 pr-2">{body}</div>
        )
      })()}
      <span className="shrink-0 self-center pr-2 text-[12px] tabular-nums text-ink-3">{hoursLabel}</span>
    </div>
  )
}
