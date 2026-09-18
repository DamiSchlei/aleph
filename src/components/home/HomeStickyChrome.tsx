import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DayTaskViewer } from '@/components/home/DayTaskViewer'
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
 * Floating date chrome for Home only.
 * Hero scrolls away above; this stays sticky with the week strip and period controls.
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
          <h2 className="truncate text-[18px] font-semibold capitalize text-ink">{line1}</h2>
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
        <div className="flex min-w-0 flex-1 rounded-2xl border border-line-strong bg-subtle p-0.5">
          {modes.map((mode) => (
            <button
              key={mode}
              type="button"
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
          <DayTaskViewer
            activeDay={activeDay}
            todayKey={todayKey}
            localeTag={localeTag}
          />
        </div>
      ) : null}
    </div>
  )
}

/** Scroll-away Home hero: greeting, name, XP. Avatar opens AccountMenu via parent. */
export function HomeHero({
  greeting,
  name,
  levelLabel,
  moneyLabel,
  xpLabel,
  xpRatio,
  avatar,
}: {
  greeting: string
  name: string
  levelLabel: string
  moneyLabel: string
  xpLabel: string
  xpRatio: number | null
  avatar: ReactNode
}) {
  return (
    <section className="flex items-start gap-4 pt-2 pb-4">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-text-3">{greeting}</p>
        <h1 className="mt-1 font-display text-[32px] leading-none text-ink">{name}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex h-7 items-center rounded-full bg-subtle px-3 text-[12px] text-ink">
            {levelLabel}
          </span>
          <span className="inline-flex h-7 items-center rounded-full bg-subtle px-3 text-[12px] text-ink">
            {moneyLabel}
          </span>
        </div>
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-subtle">
            {xpRatio !== null ? (
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${Math.min(100, Math.max(0, xpRatio * 100))}%` }}
              />
            ) : null}
          </div>
          <p className="mt-1 text-[12px] text-text-3">{xpLabel}</p>
        </div>
      </div>
      <div className="shrink-0">{avatar}</div>
    </section>
  )
}
