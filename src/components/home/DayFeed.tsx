import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { parseLocal, toDayKey } from '@/domain/dates'

function dayHeading(dayKey: string, localeTag: string): string {
  const date = parseLocal(dayKey)
  const weekday = new Intl.DateTimeFormat(localeTag, { weekday: 'long' }).format(date)
  return `${weekday} ${date.getDate()}`
}

function fullDateLabel(dayKey: string, localeTag: string): string {
  return new Intl.DateTimeFormat(localeTag, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseLocal(dayKey))
}

function countLabel(n: number, t: (key: string, opts?: Record<string, number>) => string): string {
  if (n === 0) return t('home.indexNone')
  if (n === 1) return t('home.indexOne')
  return t('home.indexMany', { n })
}

export function DayFeed({
  days,
  localeTag,
  omitDay,
  scrollMarginTop = 12,
  onSelectDay,
  onApproachEdge,
}: {
  days: string[]
  localeTag: string
  omitDay?: string
  scrollMarginTop?: number
  onSelectDay: (dayKey: string) => void
  onApproachEdge?: (edge: 'start' | 'end', dayKey: string) => void
}) {
  const rows = days.filter((dayKey) => dayKey !== omitDay)

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-day-key]'))
    if (nodes.length === 0) return
    const topGap = Math.max(8, Math.round(scrollMarginTop))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const key = entry.target.getAttribute('data-day-key')
          if (!key) continue
          const index = days.indexOf(key)
          if (index >= 0 && index <= 2) onApproachEdge?.('start', key)
          if (index >= days.length - 3) onApproachEdge?.('end', key)
        }
      },
      {
        root: null,
        rootMargin: `-${topGap}px 0px -55% 0px`,
        threshold: [0.15, 0.35, 0.6],
      },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [days, onApproachEdge, scrollMarginTop, rows.length])

  return (
    <div className="flex flex-col gap-1 pb-6">
      {rows.map((dayKey) => (
        <IndexRow
          key={dayKey}
          dayKey={dayKey}
          localeTag={localeTag}
          scrollMarginTop={scrollMarginTop}
          onSelectDay={onSelectDay}
        />
      ))}
    </div>
  )
}

function IndexRow({
  dayKey,
  localeTag,
  scrollMarginTop,
  onSelectDay,
}: {
  dayKey: string
  localeTag: string
  scrollMarginTop: number
  onSelectDay: (dayKey: string) => void
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const tasks = tasksForDay(state, dayKey)
  const todayKey = toDayKey(new Date())
  const isToday = dayKey === todayKey
  const count = countLabel(tasks.length, t)
  const heading = dayHeading(dayKey, localeTag)

  return (
    <button
      type="button"
      id={`day-feed-${dayKey}`}
      data-day-key={dayKey}
      aria-label={`${fullDateLabel(dayKey, localeTag)}, ${count}`}
      onClick={() => onSelectDay(dayKey)}
      className="flex min-h-11 w-full items-center justify-between gap-3 px-1 text-left"
      style={{ scrollMarginTop: `${scrollMarginTop + 8}px` }}
    >
      <span
        className={`min-w-0 truncate text-[15px] capitalize ${isToday ? 'font-medium text-ink' : 'text-text-3'}`}
      >
        {heading}
      </span>
      <span className="shrink-0 text-[13px] text-text-3">{count}</span>
    </button>
  )
}
