import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SkillIcon, SKILL_ICON_OPTIONS } from '@/components/character/SkillIcon'
import { Button, Card, Chip, Field, Input, ProgressBar } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { createSkill } from '@/data/actions'
import { useAleph } from '@/data/store'
import { skillName } from '@/i18n/labels'

/** The single place skills live: the six defaults plus any the user adds. */
export function SkillsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const skills = useAleph().skills
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(SKILL_ICON_OPTIONS[0])

  const add = () => {
    if (!name.trim()) return
    createSkill({ name: name.trim(), icon })
    setName('')
    setIcon(SKILL_ICON_OPTIONS[0])
    setAdding(false)
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('home.skillsTitle')}>
      <ul className="flex flex-col gap-2">
        {skills.map((skill) => (
          <li key={skill.id}>
            <Card className="flex items-center gap-3 py-3">
              <span
                className="flex size-11 items-center justify-center rounded-2xl"
                style={{ background: `${skill.color}22`, color: skill.color }}
              >
                <SkillIcon icon={skill.icon} color={skill.color} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[15px] font-medium text-white">{skillName(t, skill)}</p>
                  <p className="text-[12px] text-ink-400">{t('common.levelShort', { level: skill.level })}</p>
                </div>
                <ProgressBar className="mt-1.5" ratio={skill.xp / 100} color={skill.color} />
              </div>
            </Card>
          </li>
        ))}
      </ul>

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
