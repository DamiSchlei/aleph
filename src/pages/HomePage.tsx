import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/nav/AppHeader'
import { DayFeed } from '@/components/home/DayFeed'
import { PeriodGrid } from '@/components/home/PeriodGrid'
import { cx } from '@/components/ui/primitives'
import { weekStartKeyOf } from '@/data/dayLoad'
import { addDays, startOfMonth, toDayKey } from '@/domain/dates'

const DAY_WINDOW = 14

type Granularity = 'day' | 'week' | 'month'

function buildDays(anchorKey: string): string[] {
  return Array.from({ length: DAY_WINDOW * 2 + 1 }, (_, i) =>
    toDayKey(addDays(anchorKey, i - DAY_WINDOW)),
  )
}

function sameMonth(a: string, b: string): boolean {
  return toDayKey(startOfMonth(a)) === toDayKey(startOfMonth(b))
}

export function HomePage() {
  const { t, i18n } = useTranslation()
  const todayKey = toDayKey(new Date())
  const days = useMemo(() => buildDays(todayKey), [todayKey])
  const [granularity, setGranularity] = useState<Granularity>('day')
  const [activeDay, setActiveDay] = useState(todayKey)
  const [jumpDay, setJumpDay] = useState(todayKey)
  const [jumpNonce, setJumpNonce] = useState(0)
  const localeTag = i18n.language?.startsWith('en') ? 'en-US' : 'es-AR'

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

  const setMode = (mode: Granularity) => {
    if (mode === granularity) return
    if (mode === 'day') {
      setJumpDay(activeDay)
      setJumpNonce((value) => value + 1)
    }
    setGranularity(mode)
  }

  const modes: Granularity[] = ['day', 'week', 'month']

  return (
    <div className="flex flex-col">
      <AppHeader
        title={
          <div className="flex w-full flex-col gap-2">
            <div className="min-w-0">
              <h1 className="truncate text-[20px] font-semibold text-ink">{t('home.title')}</h1>
            </div>
            <div className="flex w-full flex-wrap items-center gap-1">
              {showHoy ? (
                <button
                  type="button"
                  onClick={() => jumpTo(todayKey)}
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
                    onClick={() => setMode(mode)}
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
          </div>
        }
      />

      {granularity === 'day' ? (
        <DayFeed
          days={days}
          jumpDay={jumpDay}
          jumpNonce={jumpNonce}
          localeTag={localeTag}
          onActiveDayChange={setActiveDay}
        />
      ) : (
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
      )}
    </div>
  )
}
