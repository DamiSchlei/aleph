import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { CustomizeSheet } from '@/components/character/CustomizeSheet'
import { Agenda } from '@/components/home/Agenda'
import { Composer } from '@/components/home/Composer'
import { DateChips } from '@/components/home/DateChips'
import { DayBar } from '@/components/home/DayBar'
import { SkillsSheet } from '@/components/home/SkillsSheet'
import { TodayStep } from '@/components/home/TodayStep'
import { WritingFold } from '@/components/home/WritingFold'
import { ProgressBar } from '@/components/ui/primitives'
import { useFeedback } from '@/app/FeedbackProvider'
import { useAleph } from '@/data/store'
import { agendaCalendarDay, attendingResults, weekSeriesPulse, type AgendaFilter } from '@/data/selectors'
import { startOfWeek } from '@/domain/dates'
import { dayMoment } from '@/i18n/dayMoment'
import { formatMoney } from '@/i18n/format'

const HERO_CLASS = 'flex items-start gap-4'

export function HomePage() {
  const { t } = useTranslation()
  const state = useAleph()
  const { character } = state
  const { pulseKey } = useFeedback()
  const [customize, setCustomize] = useState(false)
  const [skills, setSkills] = useState(false)
  const [filter, setFilter] = useState<AgendaFilter>('today')
  const [pickDate, setPickDate] = useState('')
  const xpRatio = character.xpToNext > 0 ? character.xp / character.xpToNext : null
  const dayKey = agendaCalendarDay(filter, pickDate)
  const enterprises = attendingResults(state)
  const enterpriseLine =
    enterprises.length > 0
      ? t('home.activeEnterprises', { names: enterprises.map((result) => result.name).join(' · ') })
      : null

  return (
    <div className="flex flex-col pt-4 pb-10">
      <header className={HERO_CLASS}>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-[13px] text-text-3">{t(`home.greeting.${dayMoment()}`)}</p>
          <h1 className="font-display text-[38px] leading-none text-white">{character.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full bg-ink-800 px-2.5 text-[12px] text-white">
              {t('common.levelShort', { level: character.level })}
            </span>
            <span className="inline-flex h-7 items-center rounded-full bg-ink-800 px-2.5 text-[12px] text-white">
              {t('common.money')} {formatMoney(character.money, character.locale)}
            </span>
          </div>
          <ProgressBar className="h-2" ratio={xpRatio} />
          {enterpriseLine ? (
            <p className="truncate text-[13px] text-text-3">{enterpriseLine}</p>
          ) : null}
          <button
            type="button"
            onClick={() => setSkills(true)}
            className="self-start min-h-11 text-[13px] text-text-3 transition-colors hover:text-text-2"
          >
            {t('home.skillsTitle')}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setCustomize(true)}
          className="shrink-0 rounded-full ring-1 ring-accent/40 shadow-[0_0_44px_rgba(46,200,255,0.28)]"
        >
          <span className="block size-[136px] overflow-hidden rounded-full">
            <Avatar avatar={character.avatar} size={136} pulseKey={pulseKey} className="rounded-full" />
          </span>
        </button>
      </header>

      <div className="mt-8">
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

      <div className="mt-2">
        <Composer filter={filter} pickDate={pickDate} />
      </div>

      {dayKey ? (
        <div className="mt-4">
          <DayBar dayKey={dayKey} />
        </div>
      ) : null}

      <div className="mt-4">
        <Agenda filter={filter} pickDate={pickDate} />
      </div>

      <SeriesPulseLine />

      <div className="mt-8">
        <WritingFold />
      </div>

      <CustomizeSheet open={customize} onClose={() => setCustomize(false)} pulseKey={pulseKey} />
      <SkillsSheet open={skills} onClose={() => setSkills(false)} />
    </div>
  )
}

/** One line for the week. Hidden when nothing was missed or held. */
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
