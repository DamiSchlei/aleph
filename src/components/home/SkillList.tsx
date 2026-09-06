import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SkillIcon, SKILL_ICON_OPTIONS } from '@/components/character/SkillIcon'
import { Button, Card, Chip, Field, Input, ProgressBar, SectionTitle } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { createSkill } from '@/data/actions'
import { useAleph } from '@/data/store'
import { skillName } from '@/i18n/labels'

export function SkillList() {
  const { t } = useTranslation()
  const skills = useAleph().skills
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(SKILL_ICON_OPTIONS[0])

  const add = () => {
    if (!name.trim()) return
    createSkill({ name: name.trim(), icon })
    setName('')
    setOpen(false)
  }

  return (
    <section>
      <SectionTitle
        action={
          <Button variant="ghost" className="min-h-11 px-3" aria-label={t('home.newSkill')} onClick={() => setOpen(true)}>
            +
          </Button>
        }
      >
        {t('home.skillsTitle')}
      </SectionTitle>
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
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t('home.newSkill')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" disabled={!name.trim()} onClick={add}>
              {t('common.create')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
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
        </div>
      </Sheet>
    </section>
  )
}
