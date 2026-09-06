import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Field, Input, Textarea } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { SkillSelect } from './SkillSelect'
import { createObjective, updateObjective } from '@/data/actions'
import type { Objective } from '@/domain/types'

export function ObjectiveFormSheet({
  open,
  onClose,
  resultId,
  objective,
}: {
  open: boolean
  onClose: () => void
  resultId: string
  objective?: Objective
}) {
  const { t } = useTranslation()
  const key = `${objective?.id ?? 'new'}:${resultId}:${open ? '1' : '0'}`

  return (
    <Sheet
      key={key}
      open={open}
      onClose={onClose}
      title={objective ? t('planning.objectives.editTitle') : t('planning.objectives.createTitle')}
      footer={null}
    >
      <FormBody resultId={resultId} objective={objective} onClose={onClose} />
    </Sheet>
  )
}

function FormBody({
  resultId,
  objective,
  onClose,
}: {
  resultId: string
  objective?: Objective
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(objective?.name ?? '')
  const [why, setWhy] = useState(objective?.why ?? '')
  const [skillId, setSkillId] = useState(objective?.skillId)

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (objective) {
      updateObjective(objective.id, { name: trimmed, why: why.trim() || undefined, skillId })
    } else {
      createObjective({
        resultId,
        name: trimmed,
        why: why.trim() || undefined,
        skillId,
      })
    }
    onClose()
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label={t('common.name')}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('planning.objectives.namePlaceholder')}
          autoFocus
        />
      </Field>
      <Field label={`${t('common.why')} (${t('common.optional')})`}>
        <Textarea rows={3} value={why} onChange={(e) => setWhy(e.target.value)} />
      </Field>
      <Field label={t('common.skill')}>
        <SkillSelect value={skillId} onChange={setSkillId} />
      </Field>
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button className="flex-1" disabled={!name.trim()} onClick={save}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
