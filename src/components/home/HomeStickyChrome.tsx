import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { DayTaskViewerHeader } from '@/components/home/DayTaskViewer'
import { WeekStrip } from '@/components/home/WeekStrip'
import { cx } from '@/components/ui/primitives'
import { formatWeekHeading, isoWeekNumber, parseLocal } from '@/domain/dates'
import type { Locale } from '@/domain/types'

export type HomeGranularity = 'day' | 'week' | 'month'

function weekdayDate(dayKey: string, localeTag: string): string {
  const date = parseLocal(dayKey)
  const weekday = new Intl.DateTimeFormat(localeTag, { weekday: 'long' }).format(date)
  return `${weekday} ${date.getDate()}`
}

function longDateLine(
  dayKey: string,
  localeTag: string,
  weekLabel: string,
): string {
  const date = parseLocal(dayKey)
  const formatted = new Intl.DateTimeFormat(localeTag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
  return `${formatted} · ${weekLabel}`
}

/**
 * Sticky Home chrome: date, period tabs, week strip, and the viewer header.
 * The active-day list sits below this, not inside it.
 */
export function HomeStickyChrome({
  activeDay,
  todayKey,
  granularity,
  locale,
  localeTag,
  showHoy,
  onGranularity,
  onHoy,
  onPrev,
  onNext,
  onSelectDay,
  onHeightChange,
}: {
  activeDay: string
  todayKey: string
  granularity: HomeGranularity
  locale: Locale
  localeTag: string
  showHoy: boolean
  onGranularity: (mode: HomeGranularity) => void
  onHoy: () => void
  onPrev: () => void
  onNext: () => void
  onSelectDay: (dayKey: string) => void
  onHeightChange?: (height: number) => void
}) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const modes: HomeGranularity[] = ['day', 'week', 'month']

  useLayoutEffect(() => {
    const node = ref.current
    if (!node || !onHeightChange) return
    const publish = () => onHeightChange(node.getBoundingClientRect().height)
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(node)
    return () => ro.disconnect()
  }, [onHeightChange])

  const line1 =
    granularity === 'month'
      ? new Intl.DateTimeFormat(localeTag, { month: 'long', year: 'numeric' }).format(
          parseLocal(activeDay),
        )
      : granularity === 'week'
        ? t('home.weekNumber', { n: isoWeekNumber(activeDay) })
        : weekdayDate(activeDay, localeTag)

  const line2 =
    granularity === 'day'
      ? longDateLine(activeDay, localeTag, t('home.weekNumber', { n: isoWeekNumber(activeDay) }))
      : granularity === 'week'
        ? formatWeekHeading(activeDay, locale).replace(/^[^·]+·\s*/, '')
        : null

  return (
    <div
      ref={ref}
      className="isolate sticky z-20 -mx-4 border-b border-line bg-bg px-4 pt-1 pb-3"
      style={{ top: 'env(safe-area-inset-top, 0px)', backgroundColor: 'var(--color-bg)' }}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={t('home.prevPeriod')}
          onClick={onPrev}
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[18px] text-ink-2 hover:bg-subtle"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="truncate text-[18px] font-semibold capitalize text-ink">{line1}</h1>
          {line2 ? <p className="mt-0.5 truncate text-[12px] text-text-3">{line2}</p> : null}
        </div>
        <button
          type="button"
          aria-label={t('home.nextPeriod')}
          onClick={onNext}
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[18px] text-ink-2 hover:bg-subtle"
        >
          ›
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {showHoy ? (
          <button
            type="button"
            onClick={onHoy}
            className="min-h-11 shrink-0 rounded-full px-3 text-[14px] font-medium text-accent"
          >
            {t('home.todayJump')}
          </button>
        ) : null}
        <div
          role="tablist"
          aria-label={t('home.title')}
          className="flex min-w-0 flex-1 rounded-2xl border border-line-strong bg-subtle p-0.5"
        >
          {modes.map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={granularity === mode}
              onClick={() => onGranularity(mode)}
              className={cx(
                'min-h-11 min-w-0 flex-1 rounded-xl px-2 text-[14px] font-medium',
                granularity === mode ? 'bg-bg text-ink shadow-sm' : 'text-ink-3',
              )}
            >
              {mode === 'day'
                ? t('home.granularityDay')
                : mode === 'week'
                  ? t('home.granularityWeek')
                  : t('home.granularityMonth')}
            </button>
          ))}
        </div>
      </div>

      {granularity === 'day' ? (
        <div className="mt-2">
          <WeekStrip
            activeDay={activeDay}
            todayKey={todayKey}
            localeTag={localeTag}
            onSelectDay={onSelectDay}
          />
          <DayTaskViewerHeader />
        </div>
      ) : null}
    </div>
  )
}
