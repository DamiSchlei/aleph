import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@/components/ui/primitives'
import { proposeBlock } from '@/data/actions'
import { SkillSelect } from '@/components/planning/SkillSelect'

export function Composer() {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [skillId, setSkillId] = useState<string | undefined>()

  const submit = () => {
    if (!proposeBlock(title, { skillId })) return
    setTitle('')
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('home.proposePlaceholder')}
          className="flex-1"
        />
        <Button type="submit" disabled={!title.trim()}>
          {t('home.proposeCta')}
        </Button>
      </div>
      <SkillSelect value={skillId} onChange={setSkillId} />
    </form>
  )
}
