import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SkillIcon, SKILL_ICON_OPTIONS } from '@/components/character/SkillIcon'
import { Button, Card, Chip, Field, Input, ProgressBar } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { createSkill } from '@/data/actions'
import { useAleph } from '@/data/store'
import { PILLAR_COLOR, PILLAR_ORDER, skillIdToPillar } from '@/domain/pillars'
import type { Pillar, Skill } from '@/domain/types'
import { skillName } from '@/i18n/labels'

function SkillRow({ skill }: { skill: Skill }) {
  const { t } = useTranslation()
  return (
    <Card className="flex items-center gap-3 py-3">
      <span
        className="flex size-11 items-center justify-center rounded-2xl"
        style={{ background: `${skill.color}22`, color: skill.color }}
      >
        <SkillIcon icon={skill.icon} color={skill.color} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[15px] font-medium text-ink">{skillName(t, skill)}</p>
          <p className="text-[12px] text-ink-400">{t('common.levelShort', { level: skill.level })}</p>
        </div>
        <ProgressBar className="mt-1.5" ratio={skill.xp / 100} color={skill.color} />
      </div>
    </Card>
  )
}

/** The single place skills live: the six defaults plus any the user adds. */
export function SkillsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const skills = useAleph().skills
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(SKILL_ICON_OPTIONS[0])

  const byPillar = useMemo(() => {
    const groups: Record<Pillar, Skill[]> = { mind: [], body: [], soul: [] }
    for (const skill of skills) {
      const pillar = skill.isCustom ? 'mind' : skillIdToPillar(skill.id)
      groups[pillar].push(skill)
    }
    return groups
  }, [skills])

  const add = () => {
    if (!name.trim()) return
    createSkill({ name: name.trim(), icon })
    setName('')
    setIcon(SKILL_ICON_OPTIONS[0])
    setAdding(false)
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('home.skillsTitle')}>
      <div className="flex flex-col gap-5">
        {PILLAR_ORDER.map((pillar) => {
          const list = byPillar[pillar]
          return (
            <section key={pillar}>
              <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold tracking-[0.14em] text-ink-3 uppercase">
                <span
                  aria-hidden
                  className="inline-block size-2 rounded-full"
                  style={{ background: PILLAR_COLOR[pillar] }}
                />
                {t(`pillars.${pillar}`)}
              </p>
              <ul className="flex flex-col gap-2">
                {list.map((skill) => (
                  <li key={skill.id}>
                    <SkillRow skill={skill} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {adding ? (
        <div className="mt-4 flex flex-col gap-4">
          <Field label={t('home.newSkillName')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label={t('home.newSkillIcon')}>
            <div className="flex flex-wrap gap-2">
              {SKILL_ICON_OPTIONS.map((option) => (
                <Chip key={option} active={icon === option} onClick={() => setIcon(option)}>
                  <SkillIcon icon={option} />
                </Chip>
              ))}
            </div>
          </Field>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAdding(false)}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" disabled={!name.trim()} onClick={add}>
              {t('common.create')}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" className="mt-4 w-full" onClick={() => setAdding(true)}>
          {t('home.newSkill')}
        </Button>
      )}
    </Sheet>
  )
}
