import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DayFeed } from '@/components/home/DayFeed'
import { DayTaskViewer, DayViewerScope } from '@/components/home/DayTaskViewer'
import { HomeStickyChrome, type HomeGranularity } from '@/components/home/HomeStickyChrome'
import { PeriodGrid } from '@/components/home/PeriodGrid'
import { weekStartKeyOf } from '@/data/dayLoad'
import { useAleph } from '@/data/store'
import { addDays, addMonths, startOfMonth, toDayKey } from '@/domain/dates'

const DAY_WINDOW_STEP = 14
const DAY_WINDOW_MAX = 90

function sameMonth(a: string, b: string): boolean {
  return toDayKey(startOfMonth(a)) === toDayKey(startOfMonth(b))
}

function buildDays(anchorKey: string, radius: number): string[] {
  return Array.from({ length: radius * 2 + 1 }, (_, i) =>
    toDayKey(addDays(anchorKey, i - radius)),
  )
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function HomePage() {
  const { i18n } = useTranslation()
  const { character } = useAleph()
  const todayKey = toDayKey(new Date())
  const localeTag = i18n.language?.startsWith('en') ? 'en-US' : 'es-AR'
  const locale = character.locale

  const [granularity, setGranularity] = useState<HomeGranularity>('day')
  const [activeDay, setActiveDay] = useState(todayKey)
  const [jumpDay, setJumpDay] = useState(todayKey)
  const [jumpNonce, setJumpNonce] = useState(0)
  const [dayRadius, setDayRadius] = useState(DAY_WINDOW_STEP)
  const [chromeHeight, setChromeHeight] = useState(0)

  const days = useMemo(
    () => buildDays(todayKey, dayRadius),
    [todayKey, dayRadius],
  )

  const showHoy =
    granularity === 'day'
      ? activeDay !== todayKey
      : granularity === 'week'
        ? weekStartKeyOf(activeDay) !== weekStartKeyOf(todayKey)
        : !sameMonth(activeDay, todayKey)

  const jumpTo = useCallback((dayKey: string) => {
    setActiveDay(dayKey)
    setJumpDay(dayKey)
    setJumpNonce((value) => value + 1)
  }, [])

  useEffect(() => {
    if (granularity !== 'day' || jumpNonce === 0) return
    const node = document.getElementById('home-day-viewer')
    node?.scrollIntoView({
      block: 'start',
      behavior: reducedMotion() ? 'auto' : 'smooth',
    })
  }, [jumpDay, jumpNonce, granularity])

  const setMode = (mode: HomeGranularity) => {
    if (mode === granularity) return
    if (mode === 'day') {
      setJumpDay(activeDay)
      setJumpNonce((value) => value + 1)
    }
    setGranularity(mode)
  }

  const shiftPeriod = (direction: -1 | 1) => {
    let next = activeDay
    if (granularity === 'day') next = toDayKey(addDays(activeDay, direction))
    else if (granularity === 'week') next = toDayKey(addDays(activeDay, direction * 7))
    else next = toDayKey(addMonths(activeDay, direction))
    if (granularity === 'day') jumpTo(next)
    else setActiveDay(next)
  }

  const onApproachEdge = useCallback(
    (edge: 'start' | 'end', dayKey: string) => {
      setDayRadius((radius) => {
        if (radius >= DAY_WINDOW_MAX) return radius
        const index = buildDays(todayKey, radius).indexOf(dayKey)
        if (edge === 'start' && index <= 2) return Math.min(DAY_WINDOW_MAX, radius + DAY_WINDOW_STEP)
        if (edge === 'end' && index >= radius * 2 - 2) {
          return Math.min(DAY_WINDOW_MAX, radius + DAY_WINDOW_STEP)
        }
        return radius
      })
    },
    [todayKey],
  )

  return (
    <DayViewerScope activeDay={activeDay} todayKey={todayKey} localeTag={localeTag}>
      <div className="flex flex-col">
        <HomeStickyChrome
          activeDay={activeDay}
          todayKey={todayKey}
          granularity={granularity}
          locale={locale}
          localeTag={localeTag}
          showHoy={showHoy}
          onGranularity={setMode}
          onHoy={() => {
            setGranularity('day')
            jumpTo(todayKey)
          }}
          onPrev={() => shiftPeriod(-1)}
          onNext={() => shiftPeriod(1)}
          onSelectDay={(dayKey) => {
            setGranularity('day')
            jumpTo(dayKey)
          }}
          onHeightChange={setChromeHeight}
        />

        {granularity === 'day' && chromeHeight > 0 ? (
          <>
            <div
              id="home-day-viewer"
              style={{ scrollMarginTop: `${chromeHeight + 8}px` }}
            >
              <DayTaskViewer />
            </div>
            <DayFeed
              days={days}
              localeTag={localeTag}
              omitDay={activeDay}
              scrollMarginTop={chromeHeight}
              onSelectDay={jumpTo}
              onApproachEdge={onApproachEdge}
            />
          </>
        ) : granularity !== 'day' ? (
          <PeriodGrid
            mode={granularity}
            anchorDay={activeDay}
            todayKey={todayKey}
            localeTag={localeTag}
            onOpenDay={(dayKey) => {
              setGranularity('day')
              jumpTo(dayKey)
            }}
          />
        ) : null}
      </div>
    </DayViewerScope>
  )
}
