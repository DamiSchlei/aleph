import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { DayFeed } from '@/components/home/DayFeed'
import { HomeHero, HomeStickyChrome, type HomeGranularity } from '@/components/home/HomeStickyChrome'
import { PeriodGrid } from '@/components/home/PeriodGrid'
import { AccountMenu } from '@/components/nav/AccountMenu'
import { useFeedback } from '@/app/FeedbackProvider'
import { weekStartKeyOf } from '@/data/dayLoad'
import { useAleph } from '@/data/store'
import { addDays, addMonths, startOfMonth, toDayKey } from '@/domain/dates'
import { dayMoment } from '@/i18n/dayMoment'
import { formatMoney } from '@/i18n/format'

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

export function HomePage() {
  const { t, i18n } = useTranslation()
  const { character } = useAleph()
  const { pulseKey } = useFeedback()
  const todayKey = toDayKey(new Date())
  const localeTag = i18n.language?.startsWith('en') ? 'en-US' : 'es-AR'
  const locale = character.locale

  const [granularity, setGranularity] = useState<HomeGranularity>('day')
  const [activeDay, setActiveDay] = useState(todayKey)
  const [jumpDay, setJumpDay] = useState(todayKey)
  const [jumpNonce, setJumpNonce] = useState(0)
  const [dayRadius, setDayRadius] = useState(DAY_WINDOW_STEP)
  const [chromeHeight, setChromeHeight] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

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

  const xpRatio = character.xpToNext > 0 ? character.xp / character.xpToNext : null

  return (
    <div className="flex flex-col">
      <HomeHero
        greeting={t(`home.greeting.${dayMoment()}`)}
        name={character.name}
        levelLabel={t('home.levelChip', { level: character.level })}
        moneyLabel={`${t('common.money')}${formatMoney(character.money, locale)}`}
        xpLabel={t('home.xpLabel', { xp: character.xp, next: character.xpToNext })}
        xpRatio={xpRatio}
        avatar={
          <button
            type="button"
            aria-label={t('account.openMenu')}
            onClick={() => setMenuOpen(true)}
            className="rounded-full ring-1 ring-accent/40"
          >
            <span className="block overflow-hidden rounded-full border border-line">
              <Avatar avatar={character.avatar} size={96} pulseKey={pulseKey} className="rounded-full" />
            </span>
          </button>
        }
      />

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
        <DayFeed
          days={days}
          jumpDay={jumpDay}
          jumpNonce={jumpNonce}
          localeTag={localeTag}
          omitDay={activeDay}
          scrollMarginTop={chromeHeight}
          onActiveDayChange={setActiveDay}
          onApproachEdge={onApproachEdge}
        />
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

      <AccountMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
