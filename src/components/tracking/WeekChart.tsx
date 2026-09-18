import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/primitives'
import type { TrackingStats } from '@/data/selectors'

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

/** Ticks for empty days, bars for activity. Bound to trackingStats of the selected week. */
export function WeekChart({ stats }: { stats: TrackingStats }) {
  const { t } = useTranslation()
  const week = WEEKDAY_KEYS.map((key, index) => {
    const row = stats.perDay[index]
    const count = row?.count ?? 0
    return {
      key,
      dayKey: row?.dayKey ?? key,
      count,
      color: row?.color,
      isSunday: key === 'sun',
    }
  })
  const max = Math.max(1, ...week.map((d) => d.count))

  return (
    <Card className="relative rounded-[20px] py-4">
      <div className="flex h-36 items-end justify-between gap-1.5">
        {week.map((day) => (
          <div key={day.dayKey} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[11px] tabular-nums text-text-3">{day.count || ''}</span>
            {day.count > 0 ? (
              <div
                className="w-full max-w-8 rounded-t-lg"
                style={{
                  height: `${(day.count / max) * 100}%`,
                  minHeight: 6,
                  background: day.color ?? 'var(--color-accent)',
                  opacity: day.color ? 1 : 0.8,
                }}
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
