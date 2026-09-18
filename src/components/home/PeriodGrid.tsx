import { useTranslation } from 'react-i18next'
import { TaskBlockChip } from '@/components/home/TaskBlock'
import { cx } from '@/components/ui/primitives'
import { closedHoursForDay } from '@/data/dayLoad'
import { tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import {
  formatWeekHeading,
  isoWeekday,
  monthDayKeys,
  parseLocal,
  toDayKey,
  weekDayKeys,
} from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { formatHours } from '@/i18n/format'
import type { AlephState } from '@/domain/types'

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
  const monthKey = toDayKey(parseLocal(anchorDay)).slice(0, 7)
  const title =
    mode === 'week'
      ? formatWeekHeading(anchorDay, locale)
      : new Intl.DateTimeFormat(localeTag, { month: 'long', year: 'numeric' }).format(
          parseLocal(anchorDay),
        )

  return (
    <section className="flex flex-col gap-4 pb-6 pt-3">
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

      <div className="grid grid-cols-7 gap-1.5">
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
            muted={mode === 'month' && !dayKey.startsWith(monthKey)}
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
  muted,
  onOpen,
}: {
  dayKey: string
  today: boolean
  muted?: boolean
  onOpen: () => void
}) {
  const state = useAleph()
  const tasks = tasksForDay(state, dayKey)
  const date = Number(dayKey.slice(8, 10))
  const visible = tasks.slice(0, 3)
  const overflow = tasks.length - visible.length

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={today ? 'date' : undefined}
      aria-label={dayKey}
      className={cx(
        'flex min-h-[4.5rem] flex-col items-stretch gap-0.5 rounded-xl px-1 py-1.5 text-left',
        today ? 'ring-1 ring-accent/50 bg-accent-soft' : 'border border-transparent',
        muted && 'opacity-40',
      )}
    >
      <span
        className={cx(
          'text-[13px] font-semibold tabular-nums',
          today ? 'text-accent' : 'text-ink',
        )}
      >
        {date}
      </span>
      {visible.map((task) => (
        <TaskBlockChip key={task.id} task={task} />
      ))}
      {overflow > 0 ? (
        <span className="text-[10px] text-text-3">+{overflow}</span>
      ) : null}
    </button>
  )
}
