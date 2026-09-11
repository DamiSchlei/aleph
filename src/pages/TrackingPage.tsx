import { useTranslation } from 'react-i18next'
import { SkillIcon } from '@/components/character/SkillIcon'
import { KpiCards } from '@/components/tracking/KpiCards'
import { ResultProgress } from '@/components/tracking/ResultProgress'
import { SkillConstellation } from '@/components/tracking/SkillConstellation'
import { WeekChart } from '@/components/tracking/WeekChart'
import { Card, ProgressBar, SectionTitle } from '@/components/ui/primitives'
import { skillActivity, trackingStats, weekSentenceParts } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { skillName } from '@/i18n/labels'

export function TrackingPage() {
  const { t } = useTranslation()
  const state = useAleph()
  const stats = trackingStats(state)
  const activity = skillActivity(state)
  const week = weekSentenceParts(state)
  const dash = t('common.dash')

  const movedNames = week.movedSkills.map((skill) => skillName(t, skill)).join(', ')
  const quietNames = week.quietSkills.map((skill) => skillName(t, skill)).join(', ')

  const weekSentence =
    week.movedSkills.length === 0
      ? t('tracking.weekSentenceNone')
      : week.quietSkills.length === 0
        ? t('tracking.weekSentenceMovedOnly', { moved: movedNames })
        : t('tracking.weekSentenceMoved', { moved: movedNames, quiet: quietNames })

  return (
    <div className="flex flex-col gap-6 pt-4">
      <header>
        <h1 className="text-2xl font-semibold text-white">{t('tracking.title')}</h1>
        <p className="mt-1 text-[15px] leading-relaxed text-ink-400">{t('tracking.subtitle')}</p>
      </header>

      <p className="font-display text-[18px] leading-relaxed text-ink-200">{weekSentence}</p>

      <KpiCards stats={stats} locale={state.character.locale} />
      <WeekChart stats={stats} />
      <ResultProgress />

      <section>
        <SectionTitle>{t('tracking.skills.title')}</SectionTitle>
        <SkillConstellation />
        <p className="mb-3 mt-4 text-[14px] text-ink-400">
          {activity.mostActive
            ? t('tracking.skillsAlive', { name: skillName(t, activity.mostActive) })
            : dash}
          {activity.quietest && activity.mostActive?.id !== activity.quietest.id
            ? ` · ${t('tracking.skillsQuiet', { name: skillName(t, activity.quietest) })}`
            : ''}
        </p>
        <ul className="flex flex-col gap-2">
          {state.skills.map((skill) => {
            const ratio = skill.level > 1 || skill.xp > 0 ? skill.xp / 100 : null
            return (
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
                      <p className="text-[12px] text-ink-400">{t('common.levelShort', { level: skill.level })}</p>
                    </div>
                    <ProgressBar className="mt-1.5" ratio={ratio} color={skill.color} />
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
