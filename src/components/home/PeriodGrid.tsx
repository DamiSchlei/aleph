import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'
import { closedHoursForDay, dayTaskHoursBreakdown } from '@/data/dayLoad'
import { tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isoWeekday, monthDayKeys, parseLocal, weekDayKeys } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { formatHours } from '@/i18n/format'
import type { AlephState } from '@/domain/types'

function weekRangeLabel(weekStartKey: string, localeTag: string): { start: number; end: number; month: string } {
  const start = new Date(`${weekStartKey}T12:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const month = new Intl.DateTimeFormat(localeTag, { month: 'short' }).format(end)
  return { start: start.getDate(), end: end.getDate(), month }
}

function weekdayHeaders(localeTag: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2024, 0, 1 + i)
    return new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(date)
  })
}

function periodDayKeys(mode: 'week' | 'month', anchorDay: string): string[] {
  return mode === 'week' ? weekDayKeys(anchorDay) : monthDayKeys(anchorDay)
}

function periodStats(state: AlephState, dayKeys: string[]) {
  let closedBlocks = 0
  let onTime = 0
  let hours = 0
  for (const dayKey of dayKeys) {
    hours += closedHoursForDay(state, dayKey)
    for (const task of tasksForDay(state, dayKey)) {
      if (!isTaskDone(task.status)) continue
      closedBlocks += 1
      if (task.status === 'done_on_time') onTime += 1
    }
  }
  return { closedBlocks, onTime, hours }
}

export function PeriodGrid({
  mode,
  anchorDay,
  todayKey,
  localeTag,
  onOpenDay,
}: {
  mode: 'week' | 'month'
  anchorDay: string
  todayKey: string
  localeTag: string
  onOpenDay: (dayKey: string) => void
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const dayKeys = periodDayKeys(mode, anchorDay)
  const stats = periodStats(state, dayKeys)
  const showStats = stats.closedBlocks > 0 || stats.hours > 0
  const lead = mode === 'month' ? isoWeekday(dayKeys[0] ?? anchorDay) - 1 : 0
  const title =
    mode === 'week'
      ? (() => {
          const range = weekRangeLabel(dayKeys[0] ?? anchorDay, localeTag)
          return t('home.weekRange', { start: range.start, end: range.end, month: range.month })
        })()
      : new Intl.DateTimeFormat(localeTag, { month: 'long', year: 'numeric' }).format(parseLocal(anchorDay))

  return (
    <section className="flex flex-col gap-4 pb-6">
      <div>
        <h2 className="text-[20px] font-semibold capitalize text-ink">{title}</h2>
        {showStats ? (
          <p className="mt-2 text-[13px] text-ink-3">
            {[
              t('home.periodClosed', { count: stats.closedBlocks }),
              t('home.periodOnTime', { count: stats.onTime }),
              t('home.periodHours', { hours: formatHours(stats.hours, locale) }),
            ].join(' · ')}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdayHeaders(localeTag).map((label, index) => (
          <p
            key={`${label}-${index}`}
            className="py-1 text-center text-[11px] font-medium tracking-[0.08em] text-ink-3 uppercase"
          >
            {label}
          </p>
        ))}
        {Array.from({ length: lead }, (_, index) => (
          <div key={`lead-${index}`} aria-hidden />
        ))}
        {dayKeys.map((dayKey) => (
          <DayCell
            key={dayKey}
            dayKey={dayKey}
            today={dayKey === todayKey}
            onOpen={() => onOpenDay(dayKey)}
          />
        ))}
      </div>
    </section>
  )
}

function DayCell({
  dayKey,
  today,
  onOpen,
}: {
  dayKey: string
  today: boolean
  onOpen: () => void
}) {
  const state = useAleph()
  const locale = state.character.locale
  const tasks = tasksForDay(state, dayKey)
  const closed = tasks.filter((task) => isTaskDone(task.status)).length
  const open = tasks.length - closed
  const { committed, closed: closedHours } = dayTaskHoursBreakdown(state, dayKey)
  const hours = closedHours > 0 ? closedHours : committed
  const date = Number(dayKey.slice(8, 10))
  const empty = tasks.length === 0
  const hoursLabel = hours > 0 ? formatHours(hours, locale) : null

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={today ? 'date' : undefined}
      aria-label={
        empty
          ? dayKey
          : `${dayKey} ${closed}/${open}${hoursLabel ? ` ${hoursLabel}h` : ''}`
      }
      className={cx(
        'flex min-h-11 flex-col items-center justify-center rounded-xl px-0.5 py-1.5',
        today ? 'border border-accent/40 bg-accent-soft' : 'border border-transparent',
      )}
    >
      <span className={cx('text-[13px] font-medium tabular-nums', today ? 'text-accent' : 'text-ink')}>
        {date}
      </span>
      {!empty ? (
        <>
          <span className="text-[10px] tabular-nums text-ink-3">
            {closed}/{open}
          </span>
          {hoursLabel ? <span className="text-[10px] tabular-nums text-ink-3">{hoursLabel}h</span> : null}
        </>
      ) : null}
    </button>
  )
}
