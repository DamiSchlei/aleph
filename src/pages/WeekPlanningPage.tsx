import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/nav/AppHeader'
import { Button, Card, cx } from '@/components/ui/primitives'
import { updateTask } from '@/data/actions'
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
    <div className="flex flex-col gap-5 pt-2 pb-8">
      <AppHeader
        title={
          <div>
            <h1 className="font-display text-[24px] leading-tight text-ink">{t('week.title')}</h1>
            <p className="mt-1 text-[13px] text-ink-3">{t('week.subtitle')}</p>
          </div>
        }
      />

      <Card className="space-y-4 rounded-[20px]">
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
            <h2 className="text-[16px] font-semibold text-ink">{t('week.boardTitle')}</h2>
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
            <li className="rounded-2xl border border-dashed border-line px-3 py-4 text-center text-[13px] text-text-3">
              {t('week.dayEmpty')}
            </li>
          ) : (
            dayTasks.map((task) => {
              const fallback = blockWindow(task.estimatedHours)
              const start = task.scheduledStart ?? fallback.start
              const end = task.scheduledEnd ?? fallback.end
              return (
                <li
                  key={task.id}
                  className={cx('rounded-2xl border bg-subtle px-3 py-3', 'border-line')}
                >
                  <p className="text-[15px] font-medium text-ink">{task.title}</p>
                  <p className="mt-1 text-[12px] text-text-3">
                    {start} – {end} · {formatHours(task.estimatedHours, locale)}h
                  </p>
                </li>
              )
            })
          )}
        </ul>
      </Card>

      <section className="space-y-3">
        <h2 className="text-[16px] font-semibold text-ink">{t('week.unassigned')}</h2>
        <ul className="space-y-2">
          {unassigned.map((task) => (
            <li key={task.id}>
              <Card className="flex items-center gap-3 rounded-2xl bg-surface-2 py-3">
                <span className="w-10 text-[12px] text-text-3">
                  {formatHours(task.estimatedHours, locale)}h
                </span>
                <span className="size-6 rounded-full border border-line-strong" aria-hidden />
                <p className="min-w-0 flex-1 truncate text-[15px] text-ink">{task.title}</p>
                <Button
                  variant="secondary"
                  className="min-h-9 rounded-full px-3 text-[12px]"
                  onClick={() => assignToDay(task.id)}
                >
                  {t('week.addToBlock')}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Link to="/planning" className="text-[14px] text-accent">
        {t('week.back')}
      </Link>
    </div>
  )
}
