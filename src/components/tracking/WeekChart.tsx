import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/primitives'
import { startOfWeek, toDayKey, addDays } from '@/domain/dates'
import type { TrackingStats } from '@/data/selectors'

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export function WeekChart({ stats, today = new Date() }: { stats: TrackingStats; today?: Date }) {
  const { t } = useTranslation()
  const monday = startOfWeek(today)
  const week = WEEKDAY_KEYS.map((key, index) => {
    const dayKey = toDayKey(addDays(monday, index))
    const fromRolling = stats.perDay.find((d) => d.dayKey === dayKey)
    const count = fromRolling?.count ?? 0
    return { key, dayKey, count, isSunday: key === 'sun' }
  })
  const max = Math.max(1, ...week.map((d) => d.count))

  return (
    <Card className="relative rounded-[20px] py-4">
      <div className="flex h-36 items-end justify-between gap-1.5">
        {week.map((day) => (
          <div key={day.dayKey} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[11px] text-text-3">{day.count || ''}</span>
            {day.count > 0 ? (
              <div
                className="w-full max-w-8 rounded-t-lg bg-accent/80"
                style={{ height: `${(day.count / max) * 100}%`, minHeight: 6 }}
              />
            ) : day.isSunday ? (
              <div
                className="w-full max-w-8 rounded-t-lg bg-subtle"
                style={{ height: '22%', minHeight: 4 }}
                aria-hidden
              />
            ) : (
              <span className="mb-1 h-1.5 w-1.5 rounded-full bg-line-strong" aria-hidden="true" />
            )}
            <span className="text-[11px] font-medium text-text-3">{t(`weekdays.${day.key}`)}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
