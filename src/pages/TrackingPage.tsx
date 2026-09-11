import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SkillIcon } from '@/components/character/SkillIcon'
import { KpiCards } from '@/components/tracking/KpiCards'
import { ResultProgress } from '@/components/tracking/ResultProgress'
import { WeekChart } from '@/components/tracking/WeekChart'
import { Button, Card, ProgressBar, SectionTitle } from '@/components/ui/primitives'
import { skillActivity, trackingStats, weekSeriesPulse } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { startOfWeek } from '@/domain/dates'
import { skillName } from '@/i18n/labels'

export function TrackingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = useAleph()
  const stats = trackingStats(state)
  const activity = skillActivity(state)
  const pulses = weekSeriesPulse(state, startOfWeek(new Date())).filter((pulse) => pulse.planned > 0)
  const dash = t('common.dash')
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

  return (
    <div className="flex flex-col gap-4 pt-4 pb-10">
      <header>
        <h1 className="text-[30px] font-semibold text-white">{t('tracking.title')}</h1>
        <p className="mt-1 text-[15px] leading-relaxed text-text-3">{t('tracking.subtitle')}</p>
      </header>

      <p className="font-display text-[22px] leading-snug text-white">{weekSentence}</p>
      {stats.completed === 0 ? (
        <Button variant="secondary" onClick={() => navigate('/')}>
          {t('tracking.emptyCta')}
        </Button>
      ) : null}

      {pulses.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {pulses.map((pulse) => (
            <li key={pulse.seriesId} className="text-[14px] text-white">
              {t('tracking.seriesPulse', {
                title: pulse.title,
                done: pulse.done,
                planned: pulse.planned,
                missed: pulse.missed,
              })}
            </li>
          ))}
        </ul>
      ) : null}

      <KpiCards stats={stats} locale={state.character.locale} />
      <WeekChart stats={stats} />
      <ResultProgress />

      <section>
        <SectionTitle>{t('tracking.skills.title')}</SectionTitle>
        <p className="mb-3 text-[14px] text-text-3">
          {t('tracking.skills.line', {
            most: activity.mostActive ? skillName(t, activity.mostActive) : dash,
            quietest: activity.quietest ? skillName(t, activity.quietest) : dash,
          })}
        </p>
        <ul className="flex flex-col gap-2">
          {state.skills.map((skill) => (
            <li key={skill.id}>
              <Card className="flex items-center gap-3 py-3">
                <span
                  className="flex size-11 items-center justify-center rounded-2xl"
                  style={{ background: `${skill.color}22`, color: skill.color }}
                >
                  <SkillIcon icon={skill.icon} color={skill.color} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="truncate text-[15px] font-medium text-white">{skillName(t, skill)}</p>
                    <p className="text-[12px] text-text-3">{t('common.levelShort', { level: skill.level })}</p>
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
    </div>
  )
}
