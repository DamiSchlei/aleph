import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, cx } from '@/components/ui/primitives'
import { updateTask } from '@/data/actions'
import { blockContext } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import {
  addDays,
  formatWeekHeading,
  startOfWeek,
  toDayKey,
  weekDayKeys,
} from '@/domain/dates'
import { formatHours } from '@/i18n/format'

function blockWindow(hours: number): { start: string; end: string } {
  const startHour = 9
  const start = `${String(startHour).padStart(2, '0')}:00`
  const total = startHour * 60 + Math.round(hours * 60)
  const end = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  return { start, end }
}

function weekdayShort(dayKey: string, localeTag: string): string {
  const date = new Date(`${dayKey}T12:00:00`)
  return new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(date)
}

export function WeekPlanningPage() {
  const { t, i18n } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const localeTag = i18n.language?.startsWith('en') ? 'en-US' : 'es-AR'
  const today = toDayKey(new Date())
  const [anchorDay, setAnchorDay] = useState(today)
  const weekStart = startOfWeek(anchorDay)
  const weekStartKey = toDayKey(weekStart)
  const days = weekDayKeys(weekStart)
  const [activeDay, setActiveDay] = useState(
    days.includes(today) ? today : (days[0] ?? today),
  )

  const heading = useMemo(
    () => formatWeekHeading(weekStartKey, locale),
    [weekStartKey, locale],
  )

  const shiftWeek = (direction: -1 | 1) => {
    const next = toDayKey(addDays(anchorDay, direction * 7))
    setAnchorDay(next)
    const nextDays = weekDayKeys(next)
    setActiveDay((prev) => {
      const weekday = days.indexOf(prev)
      return nextDays[weekday >= 0 ? weekday : 0] ?? nextDays[0] ?? next
    })
  }

  const openTasks = state.tasks.filter(
    (task) => !isTaskDone(task.status) && task.status !== 'cancelled',
  )

  const dayTasks = openTasks
    .filter((task) => {
      const key = task.scheduledFor || task.dueAt
      return key ? toDayKey(key) === activeDay : false
    })
    .sort((a, b) => (a.scheduledStart ?? '').localeCompare(b.scheduledStart ?? ''))

  const unassigned = openTasks.filter((task) => !task.dueAt && !task.scheduledFor)

  const assignToDay = (taskId: string) => {
    const task = state.tasks.find((item) => item.id === taskId)
    if (!task) return
    const { start, end } = blockWindow(task.estimatedHours)
    updateTask(taskId, {
      dueAt: activeDay,
      scheduledFor: activeDay,
      scheduledStart: start,
      scheduledEnd: end,
    })
  }

  return (
    <div className="flex flex-col gap-4 pt-2 pb-8">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={t('home.prevPeriod')}
          onClick={() => shiftWeek(-1)}
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[18px] text-ink-2 hover:bg-subtle"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="text-[17px] font-semibold text-ink">{t('week.boardTitle')}</h1>
          <p className="mt-0.5 text-[12px] text-text-3">{heading}</p>
        </div>
        <button
          type="button"
          aria-label={t('home.nextPeriod')}
          onClick={() => shiftWeek(1)}
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[18px] text-ink-2 hover:bg-subtle"
        >
          ›
        </button>
      </div>

      <div className="flex gap-1">
        {days.map((day) => {
          const active = day === activeDay
          const isToday = day === today
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              className={cx(
                'flex min-h-11 flex-1 flex-col items-center justify-center rounded-xl text-[12px] font-medium transition-colors',
                active ? 'bg-subtle text-ink' : 'text-text-3',
              )}
            >
              <span className="uppercase">{weekdayShort(day, localeTag)}</span>
              <span className={cx('tabular-nums', isToday && 'text-accent')}>
                {Number(day.slice(8, 10))}
              </span>
            </button>
          )
        })}
      </div>

      <ul className="space-y-2">
        {dayTasks.length === 0 ? (
          <li className="px-1 py-3 text-center text-[13px] text-text-3">{t('week.dayEmpty')}</li>
        ) : (
          dayTasks.map((task) => {
            const fallback = blockWindow(task.estimatedHours)
            const start = task.scheduledStart ?? fallback.start
            const end = task.scheduledEnd ?? fallback.end
            const ctx = blockContext(state, task)
            return (
              <li
                key={task.id}
                className="relative overflow-hidden rounded-2xl border border-line bg-surface-2"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{ background: ctx.color }}
                />
                <div className="py-2.5 pr-3 pl-3">
                  <p className="line-clamp-1 text-[15px] font-medium text-ink">{task.title}</p>
                  <p className="mt-0.5 truncate text-[12px] text-text-3">
                    {start} – {end} · {formatHours(task.estimatedHours, locale)} h
                  </p>
                </div>
              </li>
            )
          })
        )}
      </ul>

      {unassigned.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-[13px] font-semibold tracking-[0.14em] text-text-3 uppercase">
            {t('week.unassigned')}
          </h2>
          <ul className="space-y-2">
            {unassigned.map((task) => (
              <li
                key={task.id}
                className="flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-surface-2 py-2 pr-2 pl-3"
              >
                <span className="w-10 shrink-0 text-[12px] text-text-3">
                  {formatHours(task.estimatedHours, locale)}h
                </span>
                <p className="min-w-0 flex-1 truncate text-[15px] text-ink">{task.title}</p>
                <Button
                  variant="secondary"
                  className="min-h-11 rounded-full px-3 text-[12px]"
                  onClick={() => assignToDay(task.id)}
                >
                  {t('week.addToBlock')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link to="/planning" className="text-[14px] text-accent">
        {t('week.back')}
      </Link>
    </div>
  )
}
