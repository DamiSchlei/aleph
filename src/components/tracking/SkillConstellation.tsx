import { useTranslation } from 'react-i18next'
import { SkillIcon } from '@/components/character/SkillIcon'
import { cx } from '@/components/ui/primitives'
import { weekSentenceParts } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { skillName } from '@/i18n/labels'

export function SkillConstellation() {
  const { t } = useTranslation()
  const state = useAleph()
  const { movedSkills } = weekSentenceParts(state)
  const movedIds = new Set(movedSkills.map((skill) => skill.id))

  if (state.skills.length === 0) return null

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {state.skills.map((skill) => {
        const moved = movedIds.has(skill.id)
        const hasXp = skill.level > 1 || skill.xp > 0
        const size = moved ? 56 : hasXp ? 48 : 40
        return (
          <div key={skill.id} className="flex flex-col items-center gap-1" title={skillName(t, skill)}>
            <span
              className={cx(
                'flex items-center justify-center rounded-full border transition-transform',
                moved ? 'border-accent/50 bg-accent/10' : 'border-white/10 bg-white/4',
              )}
              style={{ width: size, height: size }}
            >
              <SkillIcon icon={skill.icon} color={skill.color} />
            </span>
          </div>
        )
      })}
    </div>
  )
}
