import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { CustomizeSheet } from '@/components/character/CustomizeSheet'
import { Agenda } from '@/components/home/Agenda'
import { Composer } from '@/components/home/Composer'
import { DateChips } from '@/components/home/DateChips'
import { TodayStep } from '@/components/home/TodayStep'
import { WritingFold } from '@/components/home/WritingFold'
import { cx, ProgressBar } from '@/components/ui/primitives'
import { useFeedback } from '@/app/FeedbackProvider'
import { useAleph } from '@/data/store'
import { weekSeriesPulse, type AgendaFilter } from '@/data/selectors'
import { startOfWeek } from '@/domain/dates'
import { formatMoney } from '@/i18n/format'

export function HomePage() {
  const { t } = useTranslation()
  const state = useAleph()
  const { character } = state
  const { pulseKey } = useFeedback()
  const [customize, setCustomize] = useState(false)
  const [filter, setFilter] = useState<AgendaFilter>('today')
  const [pickDate, setPickDate] = useState('')
  const [glowing, setGlowing] = useState(false)
  const [xpFlashing, setXpFlashing] = useState(false)

  useEffect(() => {
    if (pulseKey === undefined || pulseKey === 0) return
    setGlowing(true)
    const timer = window.setTimeout(() => setGlowing(false), 700)
    return () => window.clearTimeout(timer)
  }, [pulseKey])

  useEffect(() => {
    if (pulseKey === undefined || pulseKey === 0) return
    setXpFlashing(true)
    const timer = window.setTimeout(() => setXpFlashing(false), 500)
    return () => window.clearTimeout(timer)
  }, [pulseKey])

  const xpRatio = character.xpToNext > 0 ? character.xp / character.xpToNext : null

  return (
    <div className="flex flex-col pt-4 pb-4">
      <header className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div
            className={cx(
              'overflow-hidden rounded-[16px] ring-1 ring-accent/30',
              glowing && 'animate-glow',
            )}
          >
            <Avatar avatar={character.avatar} size={72} pulseKey={pulseKey} className="rounded-[16px]" />
          </div>
          <button
            type="button"
            aria-label={t('character.settings')}
            onClick={() => setCustomize(true)}
            className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border border-white/14 bg-surface text-text-2 shadow-lg"
          >
            <GearIcon />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[28px] leading-none text-white">{character.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full bg-ink-800 px-2.5 text-[12px] text-white">
              {t('home.levelChip', { level: character.level })}
            </span>
            <span className="text-[14px] font-medium text-mint">
              {t('common.money')}
              {formatMoney(character.money, character.locale)}
            </span>
          </div>
          <div className={cx('mt-2', xpFlashing && 'animate-xp')}>
            <ProgressBar className="h-2" ratio={xpRatio} />
            <p className="mt-1 text-[12px] text-text-3">
              {t('home.xpLabel', { xp: character.xp, next: character.xpToNext })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCustomize(true)}
            className="mt-1 min-h-9 self-start text-[13px] text-accent"
          >
            {t('home.customizeLink')}
          </button>
        </div>
      </header>

      <div className="mt-6">
        <TodayStep />
      </div>

      <div className="mt-4">
        <DateChips
          filter={filter}
          pickDate={pickDate}
          onFilterChange={setFilter}
          onPickDateChange={setPickDate}
        />
      </div>

      <div className="mt-4">
        <Agenda filter={filter} pickDate={pickDate} />
      </div>

      <SeriesPulseLine />

      <div className="mt-8">
        <WritingFold />
      </div>

      <Composer filter={filter} pickDate={pickDate} />

      <CustomizeSheet open={customize} onClose={() => setCustomize(false)} pulseKey={pulseKey} />
    </div>
  )
}

function SeriesPulseLine() {
  const { t } = useTranslation()
  const state = useAleph()
  const pulses = weekSeriesPulse(state, startOfWeek(new Date()))
  if (pulses.length === 0) return null
  const missed = pulses.reduce((sum, pulse) => sum + pulse.missed, 0)
  const done = pulses.reduce((sum, pulse) => sum + pulse.done, 0)
  if (missed > 0) {
    return (
      <p className="mt-2 text-[13px] text-amber">{t('home.seriesMissed', { count: missed })}</p>
    )
  }
  if (done > 0) {
    return <p className="mt-2 text-[13px] text-mint">{t('home.seriesHeld')}</p>
  }
  return null
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
