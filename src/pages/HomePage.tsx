import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
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
import {
  buildWeekStarts,
  closedHoursForDay,
  closedHoursForWeek,
  dayTaskHoursBreakdown,
  freeHoursForDay,
  lostHoursForDay,
  openHoursForWeek,
  plannedHoursForDay,
  plannedHoursForWeek,
  weekCapHours,
  weekStartKeyOf,
} from '@/data/dayLoad'
import { resultById, tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { addDays, toDayKey, weekDayKeys } from '@/domain/dates'
import { parseComposerInput } from '@/domain/composerParse'
import { isTaskDone } from '@/domain/economy'
import { dayMoment } from '@/i18n/dayMoment'
import { formatHours } from '@/i18n/format'
import type { Locale, Task } from '@/domain/types'

const DAY_WINDOW = 14
const WEEK_WINDOW = 6
const DEFAULT_CAP = 5
const SNAP_CLASS = 'box-border w-full shrink-0 snap-center px-4'

type Granularity = 'day' | 'week'

function buildDays(anchor: Date): string[] {
  return Array.from({ length: DAY_WINDOW * 2 + 1 }, (_, i) =>
    toDayKey(addDays(anchor, i - DAY_WINDOW)),
  )
}

function dayHeading(dayKey: string, localeTag: string): string {
  const date = new Date(`${dayKey}T12:00:00`)
  const weekday = new Intl.DateTimeFormat(localeTag, { weekday: 'long' }).format(date)
  return `${weekday} ${date.getDate()}`
}

function weekRangeLabel(weekStartKey: string, localeTag: string): { start: number; end: number; month: string } {
  const start = new Date(`${weekStartKey}T12:00:00`)
  const end = addDays(start, 6)
  const month = new Intl.DateTimeFormat(localeTag, { month: 'short' }).format(end)
  return { start: start.getDate(), end: end.getDate(), month }
}

function weekdayShort(dayKey: string, localeTag: string): string {
  const date = new Date(`${dayKey}T12:00:00`)
  return new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(date)
}

export function HomePage() {
  const { t, i18n } = useTranslation()
  const todayKey = toDayKey(new Date())
  const todayWeek = weekStartKeyOf(todayKey)
  const days = useMemo(() => buildDays(new Date()), [todayKey])
  const weeks = useMemo(() => buildWeekStarts(new Date(), WEEK_WINDOW), [todayKey])
  const [granularity, setGranularity] = useState<Granularity>('day')
  const [activeDay, setActiveDay] = useState(todayKey)
  const [activeWeek, setActiveWeek] = useState(todayWeek)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const localeTag = i18n.language?.startsWith('en') ? 'en-US' : 'es-AR'

  const dayIndex = days.indexOf(activeDay)
  const weekIndex = weeks.indexOf(activeWeek)
  const centerIndex = granularity === 'day' ? (dayIndex >= 0 ? dayIndex : DAY_WINDOW) : weekIndex >= 0 ? weekIndex : WEEK_WINDOW
  const showHoy =
    granularity === 'day' ? activeDay !== todayKey : activeWeek !== todayWeek

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const node = scrollerRef.current
    const child = node?.children[index] as HTMLElement | undefined
    if (node && child) node.scrollTo({ left: child.offsetLeft, behavior })
  }, [])

  useEffect(() => {
    scrollToIndex(centerIndex, 'auto')
  }, [granularity, centerIndex, scrollToIndex])

  const scrollToToday = () => {
    if (granularity === 'day') {
      setActiveDay(todayKey)
      scrollToIndex(DAY_WINDOW)
    } else {
      setActiveWeek(todayWeek)
      scrollToIndex(WEEK_WINDOW)
    }
  }

  const onScroll = () => {
    const node = scrollerRef.current
    if (!node) return
    const mid = node.scrollLeft + node.clientWidth / 2
    let best = 0
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
    if (granularity === 'day') {
      const next = days[best]
      if (next && next !== activeDay) setActiveDay(next)
    } else {
      const next = weeks[best]
      if (next && next !== activeWeek) setActiveWeek(next)
    }
  }

  const setMode = (mode: Granularity) => {
    if (mode === granularity) return
    if (mode === 'week') {
      setActiveWeek(weekStartKeyOf(activeDay))
    } else {
      // keep activeDay; if coming from week, prefer today when active week is current
      if (activeWeek === todayWeek) setActiveDay(todayKey)
      else setActiveDay(activeWeek)
    }
    setGranularity(mode)
  }

  const openDay = (dayKey: string) => {
    setActiveDay(dayKey)
    setGranularity('day')
  }

  return (
    <div className="flex flex-col">
      <AppHeader
        title={
          <div className="flex w-full flex-col gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] text-ink-3">{t(`home.greeting.${dayMoment()}`)}</p>
              <h1 className="truncate text-[20px] font-semibold text-ink">{t('home.title')}</h1>
            </div>
            <div className="flex w-full flex-wrap items-center gap-1">
              {showHoy ? (
                <button
                  type="button"
                  onClick={scrollToToday}
                  className="min-h-11 shrink-0 rounded-full px-3 text-[14px] font-medium text-accent"
                >
                  {t('home.todayJump')}
                </button>
              ) : null}
              <div className="flex min-w-0 flex-1 rounded-2xl border border-line-strong bg-subtle p-0.5">
                {(['day', 'week'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setMode(mode)}
                    className={cx(
                      'min-h-11 min-w-0 flex-1 rounded-xl px-2 text-[14px] font-medium',
                      granularity === mode ? 'bg-bg text-ink shadow-sm' : 'text-ink-3',
                    )}
                  >
                    {mode === 'day' ? t('home.granularityDay') : t('home.granularityWeek')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        }
      />

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto pb-6"
      >
        {granularity === 'day'
          ? days.map((dayKey) => (
              <DayColumn key={dayKey} dayKey={dayKey} localeTag={localeTag} className={SNAP_CLASS} />
            ))
          : weeks.map((weekKey) => (
              <WeekColumn
                key={weekKey}
                weekStartKey={weekKey}
                localeTag={localeTag}
                todayKey={todayKey}
                onOpenDay={openDay}
                className={SNAP_CLASS}
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
  const locale = state.character.locale
  const planned = plannedHoursForDay(state, dayKey)
  const closed = closedHoursForDay(state, dayKey)
  const todayKey = toDayKey(new Date())
  const isToday = dayKey === todayKey
  const isPast = dayKey < todayKey
  const isFuture = dayKey > todayKey
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

  const showWorkload = !isFuture || planned > 0

  return (
    <section className={cx('flex flex-col gap-3', className)}>
      <div className="sticky top-0 z-10 -mx-1.5 bg-bg/95 px-1.5 py-2 backdrop-blur">
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
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-subtle">
          {!empty ? (
            <div
              className={cx('h-full rounded-full transition-[width]', over ? 'bg-amber' : 'bg-accent')}
              style={{ width: `${Math.min(100, (planned / Math.max(cap, 0.1)) * 100)}%` }}
            />
          ) : null}
        </div>
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

      {empty ? (
        <div className="flex flex-col items-start gap-3 px-1 py-6">
          <p className="text-[15px] leading-relaxed text-ink-3">{t('home.agendaEmpty')}</p>
          <button
            type="button"
            className="min-h-11 rounded-2xl border border-line bg-surface px-4 text-[14px] font-medium text-ink"
            onClick={() => {
              const el = document.getElementById('home-composer-input') as HTMLInputElement | null
              el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
              el?.focus()
            }}
          >
            {t('home.agendaEmptyCta')}
          </button>
        </div>
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

function WeekColumn({
  weekStartKey,
  localeTag,
  todayKey,
  onOpenDay,
  className,
}: {
  weekStartKey: string
  localeTag: string
  todayKey: string
  onOpenDay: (dayKey: string) => void
  className?: string
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const cap = state.character.dailyHourCap ?? DEFAULT_CAP
  const weekCap = weekCapHours(cap)
  const planned = plannedHoursForWeek(state, weekStartKey)
  const closed = closedHoursForWeek(state, weekStartKey)
  const openLeft = openHoursForWeek(state, weekStartKey)
  const range = weekRangeLabel(weekStartKey, localeTag)
  const days = weekDayKeys(weekStartKey)
  const over = planned > weekCap
  const weekEnd = days[6] ?? weekStartKey
  const isCurrentOrPast = weekEnd <= todayKey || days.includes(todayKey)

  return (
    <section className={cx('flex flex-col gap-3', className)}>
      <div className="sticky top-0 z-10 -mx-1.5 bg-bg/95 px-1.5 py-2 backdrop-blur">
        <div className="flex items-end justify-between gap-2">
          <h2 className="min-w-0 flex-1 truncate text-[24px] leading-tight font-semibold text-ink">
            {t('home.weekRange', { start: range.start, end: range.end, month: range.month })}
          </h2>
          <p className={cx('shrink-0 text-[13px] font-medium tabular-nums', over ? 'text-amber' : 'text-ink-3')}>
            {t('home.workload', {
              planned: formatHours(planned, locale),
              cap: formatHours(weekCap, locale),
            })}
          </p>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-subtle">
          <div
            className={cx('h-full rounded-full', over ? 'bg-amber' : 'bg-accent')}
            style={{ width: `${Math.min(100, (planned / Math.max(weekCap, 0.1)) * 100)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[12px] text-ink-3">
          {t('home.weekUsed', {
            closed: formatHours(closed, locale),
            cap: formatHours(weekCap, locale),
          })}
          {isCurrentOrPast && openLeft > 0
            ? t('home.weekOpenLeft', { n: formatHours(openLeft, locale) })
            : null}
        </p>
      </div>

      <ul className="flex flex-col gap-1.5">
        {days.map((dayKey) => {
          const { committed, closed: dayClosed } = dayTaskHoursBreakdown(state, dayKey)
          const ratio = Math.min(100, (committed / Math.max(cap, 0.1)) * 100)
          return (
            <li key={dayKey}>
              <button
                type="button"
                onClick={() => onOpenDay(dayKey)}
                className={cx(
                  'flex min-h-11 w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2 text-left',
                  dayKey === todayKey && 'border-accent/40',
                )}
              >
                <span className="w-10 shrink-0 capitalize text-[13px] text-ink-3">
                  {weekdayShort(dayKey, localeTag)}
                </span>
                <span className="w-7 shrink-0 text-[15px] font-medium tabular-nums text-ink">
                  {new Date(`${dayKey}T12:00:00`).getDate()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="h-1 overflow-hidden rounded-full bg-subtle">
                    {committed > 0 || dayClosed > 0 ? (
                      <div className="h-full rounded-full bg-accent" style={{ width: `${ratio}%` }} />
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 text-[12px] tabular-nums text-ink-3">
                  {dayClosed > 0
                    ? `${formatHours(committed, locale)}/${formatHours(dayClosed, locale)} h`
                    : `${formatHours(committed, locale)} h`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
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
