import { useTranslation } from 'react-i18next'
import { Select } from '@/components/ui/primitives'
import { useAleph } from '@/data/store'
import { skillName } from '@/i18n/labels'

export function SkillSelect({
  value,
  onChange,
  allowEmpty = true,
  id,
}: {
  value?: string
  onChange: (skillId: string | undefined) => void
  allowEmpty?: boolean
  id?: string
}) {
  const { t } = useTranslation()
  const skills = useAleph().skills

  return (
    <Select
      id={id}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      {allowEmpty ? <option value="">{t('common.noSkill')}</option> : null}
      {skills.map((skill) => (
        <option key={skill.id} value={skill.id}>
          {skillName(t, skill)}
        </option>
      ))}
    </Select>
  )
}
