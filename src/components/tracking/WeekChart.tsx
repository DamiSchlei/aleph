import { useTranslation } from 'react-i18next'
import { Card, SectionTitle } from '@/components/ui/primitives'
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
    return { key, dayKey, count }
  })
  const max = Math.max(1, ...week.map((d) => d.count))

  return (
    <section>
      <SectionTitle>{t('tracking.chart.title')}</SectionTitle>
      <Card className="relative py-4">
        <div className="flex h-36 items-end justify-between gap-1.5">
          {week.map((day) => (
            <div key={day.dayKey} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[11px] text-text-3">{day.count || ''}</span>
              {day.count > 0 ? (
                <div
                  className="w-full max-w-8 rounded-t-lg bg-accent-strong/80"
                  style={{ height: `${(day.count / max) * 100}%`, minHeight: 6 }}
                />
              ) : (
                <span className="mb-1 h-1.5 w-1.5 rounded-full bg-white/25" aria-hidden="true" />
              )}
              <span className="text-[11px] font-medium text-text-3">{t(`weekdays.${day.key}`)}</span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
