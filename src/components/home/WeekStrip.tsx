import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'
import { weekDayKeys } from '@/domain/dates'

function weekdayShort(dayKey: string, localeTag: string): string {
  const date = new Date(`${dayKey}T12:00:00`)
  return new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(date)
}

/** Mon–Sun strip synced to the active day on Home. */
export function WeekStrip({
  activeDay,
  todayKey,
  localeTag,
  onSelectDay,
}: {
  activeDay: string
  todayKey: string
  localeTag: string
  onSelectDay: (dayKey: string) => void
}) {
  const { t } = useTranslation()
  const days = weekDayKeys(activeDay)

  return (
    <div className="flex gap-1" role="list" aria-label={t('home.granularityWeek')}>
      {days.map((dayKey) => {
        const active = dayKey === activeDay
        const isToday = dayKey === todayKey
        const date = Number(dayKey.slice(8, 10))
        return (
          <button
            key={dayKey}
            type="button"
            role="listitem"
            onClick={() => onSelectDay(dayKey)}
            aria-current={active ? 'date' : undefined}
            className={cx(
              'flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-0.5 py-1',
              active ? 'bg-accent-soft text-accent' : 'text-ink-3',
            )}
          >
            <span className="text-[10px] font-medium tracking-[0.06em] uppercase">
              {weekdayShort(dayKey, localeTag)}
            </span>
            <span
              className={cx(
                'mt-0.5 text-[14px] font-semibold tabular-nums',
                active ? 'text-accent' : 'text-ink',
              )}
            >
              {date}
            </span>
            {isToday ? (
              <span aria-hidden className="mt-0.5 size-1 rounded-full bg-accent" />
            ) : (
              <span aria-hidden className="mt-0.5 size-1" />
            )}
          </button>
        )
      })}
    </div>
  )
}
