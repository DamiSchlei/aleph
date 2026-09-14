import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/nav/AppHeader'
import { Button, Card, cx } from '@/components/ui/primitives'
import { updateTask } from '@/data/actions'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { addDays, startOfWeek, toDayKey, weekDayKeys } from '@/domain/dates'
import { formatDate, formatHours } from '@/i18n/format'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

function blockWindow(hours: number): { start: string; end: string } {
  const startHour = 9
  const start = `${String(startHour).padStart(2, '0')}:00`
  const total = startHour * 60 + Math.round(hours * 60)
  const end = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  return { start, end }
}

export function WeekPlanningPage() {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const today = toDayKey(new Date())
  const weekStart = startOfWeek(new Date())
  const days = weekDayKeys(weekStart)
  const [activeDay, setActiveDay] = useState(
    days.includes(today) ? today : days[0] ?? today,
  )

  const rangeLabel = useMemo(() => {
    const end = addDays(weekStart, 6)
    return `${formatDate(weekStart, locale)} – ${formatDate(end, locale)}`
  }, [weekStart, locale])

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
        showHome
        title={
          <div>
            <h1 className="font-display text-[24px] leading-tight text-ink">{t('week.title')}</h1>
            <p className="mt-1 text-[13px] text-ink-3">{t('week.subtitle')}</p>
          </div>
        }
      />

      <Card className="space-y-4 rounded-[20px]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-ink">{t('week.boardTitle')}</h2>
          <p className="text-[12px] text-text-3">{rangeLabel}</p>
        </div>

        <div className="flex gap-1">
          {days.map((day, index) => {
            const active = day === activeDay
            return (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className={cx(
                  'flex h-10 flex-1 items-center justify-center rounded-xl text-[13px] font-medium transition-colors',
                  active ? 'bg-subtle text-ink' : 'text-text-3',
                )}
              >
                {DAY_LABELS[index]}
              </button>
            )
          })}
        </div>

        <ul className="space-y-2">
          {dayTasks.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-line-strong px-3 py-4 text-center text-[13px] text-text-3">
              {t('week.unassigned')}
            </li>
          ) : (
            dayTasks.map((task) => {
              const fallback = blockWindow(task.estimatedHours)
              const start = task.scheduledStart ?? fallback.start
              const end = task.scheduledEnd ?? fallback.end
              return (
                <li
                  key={task.id}
                  className={cx(
                    'rounded-2xl border bg-subtle px-3 py-3',
                    'border-line',
                  )}
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
