import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Chip, Field, Input, Textarea } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
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
  const [ser, setSer] = useState(objective?.ser ?? '')
  const [why, setWhy] = useState(objective?.why ?? '')
  const [doneWhen, setDoneWhen] = useState(objective?.doneWhen ?? '')
  const [nonGoals, setNonGoals] = useState(objective?.nonGoals ?? '')
  const [reviewEvery, setReviewEvery] = useState<Objective['reviewEvery'] | ''>(
    objective?.reviewEvery ?? '',
  )
  const [reviewEveryN, setReviewEveryN] = useState(String(objective?.reviewEveryN ?? 3))

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const review = reviewEvery || undefined
    const n = review === 'every_n_tasks' ? Math.max(1, Number(reviewEveryN) || 3) : undefined
    const extra = objective
      ? {
          nonGoals: nonGoals.trim() || undefined,
          reviewEvery: review,
          reviewEveryN: n,
        }
      : {}
    if (objective) {
      updateObjective(objective.id, {
        name: trimmed,
        ser: ser.trim() || undefined,
        why: why.trim() || undefined,
        doneWhen: doneWhen.trim() || undefined,
        ...extra,
      })
    } else {
      createObjective({
        resultId,
        name: trimmed,
        ser: ser.trim() || undefined,
        why: why.trim() || undefined,
        doneWhen: doneWhen.trim() || undefined,
      })
    }
    onClose()
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label={t('planning.objectives.action')}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('planning.objectives.namePlaceholder')}
          autoFocus
        />
      </Field>
      <Field label={`${t('planning.objectives.ser')} (${t('common.optional')})`}>
        <Textarea
          rows={2}
          value={ser}
          onChange={(e) => setSer(e.target.value)}
          placeholder={t('planning.objectives.serPlaceholder')}
        />
      </Field>
      <Field label={`${t('common.why')} (${t('common.optional')})`}>
        <Textarea rows={3} value={why} onChange={(e) => setWhy(e.target.value)} />
      </Field>
      <Field label={`${t('planning.objectives.doneWhen')} (${t('common.optional')})`}>
        <Input
          value={doneWhen}
          onChange={(e) => setDoneWhen(e.target.value)}
          placeholder={t('planning.objectives.doneWhenPlaceholder')}
        />
      </Field>
      {objective ? (
        <>
          <Field label={`${t('planning.objectives.nonGoals')} (${t('common.optional')})`}>
            <Input
              value={nonGoals}
              onChange={(e) => setNonGoals(e.target.value)}
              placeholder={t('planning.objectives.nonGoalsPlaceholder')}
            />
          </Field>
          <Field label={`${t('planning.objectives.reviewEvery')} (${t('common.optional')})`}>
            <div className="flex flex-wrap gap-2">
              <Chip active={reviewEvery === ''} onClick={() => setReviewEvery('')}>
                {t('common.none')}
              </Chip>
              <Chip active={reviewEvery === 'weekly'} onClick={() => setReviewEvery('weekly')}>
                {t('planning.objectives.reviewWeekly')}
              </Chip>
              <Chip
                active={reviewEvery === 'every_n_tasks'}
                onClick={() => setReviewEvery('every_n_tasks')}
              >
                {t('planning.objectives.reviewEveryN')}
              </Chip>
            </div>
            {reviewEvery === 'every_n_tasks' ? (
              <Input
                type="number"
                min={1}
                className="mt-2"
                value={reviewEveryN}
                onChange={(e) => setReviewEveryN(e.target.value)}
              />
            ) : null}
          </Field>
        </>
      ) : null}
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
