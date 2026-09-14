import { AppHeader } from '@/components/nav/AppHeader'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SkillIcon } from '@/components/character/SkillIcon'
import { SkillsSheet } from '@/components/home/SkillsSheet'
import { ResultProgress } from '@/components/tracking/ResultProgress'
import { WeekChart } from '@/components/tracking/WeekChart'
import { Button, Card, ProgressBar } from '@/components/ui/primitives'
import { skillActivity, trackingStats } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatHours } from '@/i18n/format'
import { skillName } from '@/i18n/labels'
import { useMemo, useState } from 'react'

export function TrackingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = useAleph()
  const locale = state.character.locale
  const stats = trackingStats(state)
  const activity = skillActivity(state)
  const [skillsOpen, setSkillsOpen] = useState(false)

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

  const topSkills = useMemo(() => {
    return [...state.skills]
      .sort((a, b) => b.level - a.level || b.xp - a.xp)
      .slice(0, 3)
  }, [state.skills])

  const kpis = [
    { label: t('tracking.kpiDone'), value: String(stats.completed) },
    {
      label: t('tracking.kpiOnTime'),
      value: stats.completed === 0 ? t('common.dash') : String(stats.onTime),
    },
    {
      label: t('tracking.kpiHours'),
      value: formatHours(stats.hoursLast7, locale),
    },
  ]

  return (
    <div className="flex flex-col gap-4 pt-2 pb-10">
      <AppHeader
        showHome
        title={
          <div>
            <h1 className="text-[28px] font-semibold text-ink">{t('tracking.title')}</h1>
            <p className="mt-1 text-[14px] text-ink-3">{t('tracking.subtitle')}</p>
          </div>
        }
      />

      <Card className="rounded-[20px]">
        <p className="font-display text-[22px] leading-snug text-ink">{weekSentence}</p>
        {activity.mostActive ? (
          <p className="mt-2 text-[13px] text-text-3">
            {t('tracking.weekSkillLine', { skill: skillName(t, activity.mostActive) })}
          </p>
        ) : null}
      </Card>

      {stats.completed === 0 ? (
        <Button variant="secondary" onClick={() => navigate('/')}>
          {t('tracking.emptyCta')}
        </Button>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="rounded-[20px] py-3 text-center">
            <p className="text-[11px] font-medium tracking-wide text-text-3 uppercase">{kpi.label}</p>
            <p className="mt-1 text-[20px] font-semibold text-ink">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <section>
        <p className="mb-2 text-[13px] font-semibold tracking-[0.14em] text-text-3 uppercase">
          {t('tracking.activityTitle')}
        </p>
        <WeekChart stats={stats} />
      </section>

      <section>
        <p className="mb-2 text-[13px] font-semibold tracking-[0.14em] text-text-3 uppercase">
          {t('tracking.resultsTitle')}
        </p>
        <ResultProgress showPercent />
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold tracking-[0.14em] text-text-3 uppercase">
            {t('tracking.skillsTitle')}
          </p>
          <button
            type="button"
            onClick={() => setSkillsOpen(true)}
            className="text-[13px] text-accent"
          >
            {t('tracking.seeRoster')}
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {topSkills.map((skill, index) => (
            <li key={skill.id}>
              <Card className="flex items-center gap-3 rounded-[20px] py-3">
                <span
                  className="flex size-11 items-center justify-center rounded-2xl"
                  style={{ background: `${skill.color}22`, color: skill.color }}
                >
                  <SkillIcon icon={skill.icon} color={skill.color} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="truncate text-[15px] font-medium text-ink">{skillName(t, skill)}</p>
                    <p className="text-[12px] text-text-3">
                      {index === 0
                        ? t('tracking.skillMostActive')
                        : index === 1
                          ? t('tracking.skillStable')
                          : t('tracking.skillStreak')}
                    </p>
                  </div>
                  {skill.xp > 0 ? (
                    <ProgressBar className="mt-1.5" ratio={skill.xp / 100} color={skill.color} />
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <SkillsSheet open={skillsOpen} onClose={() => setSkillsOpen(false)} />
    </div>
  )
}
