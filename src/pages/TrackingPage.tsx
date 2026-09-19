import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SkillsSheet } from '@/components/home/SkillsSheet'
import { ResultProgress } from '@/components/tracking/ResultProgress'
import { WeekChart } from '@/components/tracking/WeekChart'
import { Button } from '@/components/ui/primitives'
import { trackingStats, weekPairGaps, type PairGapKind } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { addDays, formatWeekHeading, startOfWeek, toDayKey } from '@/domain/dates'
import { formatHours } from '@/i18n/format'
import type { TFunction } from 'i18next'

const PAIR_COPY: Record<PairGapKind, string> = {
  artWithoutLiterature: 'tracking.pairArtWithoutLit',
  literatureWithoutArt: 'tracking.pairLitWithoutArt',
  enterpriseOnly: 'tracking.pairEnterpriseOnly',
}

function pairNames(names: string[], t: TFunction): string {
  if (names.length === 2) return t('tracking.pairNamesTwo', { a: names[0], b: names[1] })
  if (names.length > 2) {
    return t('tracking.pairNamesMore', { a: names[0], b: names[1], n: names.length - 2 })
  }
  return names[0] ?? ''
}

export function TrackingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = useAleph()
  const locale = state.character.locale
  const todayKey = toDayKey(new Date())
  const [weekAnchor, setWeekAnchor] = useState(todayKey)
  const [skillsOpen, setSkillsOpen] = useState(false)

  const stats = trackingStats(state, weekAnchor)
  const pairGaps = weekPairGaps(state, weekAnchor)
  const lifetimeEmpty = stats.completed === 0
  const showHoy = toDayKey(startOfWeek(weekAnchor)) !== toDayKey(startOfWeek(todayKey))

  const weekSentence =
    stats.completed === 0
      ? t('tracking.weekSentenceNone')
      : stats.weekCompleted === 0
        ? t('tracking.weekSentenceMovedOnly')
        : t('tracking.weekSentenceMoved', {
            hours: stats.weekHours,
            onTime: stats.weekOnTime,
            total: stats.weekCompleted,
          })

  const shiftWeek = (direction: -1 | 1) => {
    setWeekAnchor(toDayKey(addDays(weekAnchor, direction * 7)))
  }

  const kpis = [
    { label: t('tracking.kpiDone'), value: String(stats.weekCompleted) },
    {
      label: t('tracking.kpiOnTime'),
      value: stats.weekCompleted === 0 ? t('common.dash') : String(stats.weekOnTime),
    },
    {
      label: t('tracking.kpiHours'),
      value: formatHours(stats.weekHours, locale),
    },
  ]

  return (
    <div className="flex flex-col gap-5 pt-2 pb-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('home.prevPeriod')}
            onClick={() => shiftWeek(-1)}
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[18px] text-ink-2 hover:bg-subtle"
          >
            ‹
          </button>
          <h1 className="min-w-0 flex-1 text-center text-[16px] font-semibold text-ink">
            {formatWeekHeading(weekAnchor, locale)}
          </h1>
          <button
            type="button"
            aria-label={t('home.nextPeriod')}
            onClick={() => shiftWeek(1)}
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[18px] text-ink-2 hover:bg-subtle"
          >
            ›
          </button>
        </div>
        {showHoy ? (
          <button
            type="button"
            onClick={() => setWeekAnchor(todayKey)}
            className="min-h-11 self-center px-3 text-[14px] font-medium text-accent"
          >
            {t('tracking.hoy')}
          </button>
        ) : null}
        <p className="font-display text-[22px] leading-snug text-ink">{weekSentence}</p>
        {pairGaps.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {pairGaps.map((gap) => (
              <p key={gap.kind} className="text-[15px] leading-relaxed text-ink-3">
                {t(PAIR_COPY[gap.kind], { names: pairNames(gap.names, t) })}
              </p>
            ))}
          </div>
        ) : null}
      </header>

      {lifetimeEmpty ? (
        <Button variant="secondary" onClick={() => navigate('/')}>
          {t('tracking.emptyCta')}
        </Button>
      ) : null}

      <div className="flex items-start justify-between gap-2 px-1">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="min-w-0 flex-1 text-center">
            <p className="text-[11px] font-medium tracking-wide text-text-3 uppercase">{kpi.label}</p>
            <p className="mt-1 text-[20px] font-semibold tabular-nums text-ink">{kpi.value}</p>
          </div>
        ))}
      </div>

      <WeekChart stats={stats} />

      <section>
        <p className="mb-2 text-[13px] font-semibold tracking-[0.14em] text-text-3 uppercase">
          {t('tracking.resultsTitle')}
        </p>
        <ResultProgress weekAnchor={weekAnchor} hideEmptyCta={lifetimeEmpty} />
      </section>

      <button
        type="button"
        onClick={() => setSkillsOpen(true)}
        className="min-h-11 self-start px-1 text-[14px] font-medium text-accent"
      >
        {t('tracking.seeRoster')}
      </button>
      <SkillsSheet open={skillsOpen} onClose={() => setSkillsOpen(false)} />
    </div>
  )
}
