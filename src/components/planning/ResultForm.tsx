import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Field, Input, Textarea } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { createResult, updateResult } from '@/data/actions'
import type { Result } from '@/domain/types'

export function ResultForm({
  open,
  onClose,
  result,
  initialName,
}: {
  open: boolean
  onClose: () => void
  result?: Result
  initialName?: string
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(result?.name ?? initialName ?? '')
  const [why, setWhy] = useState(result?.why ?? '')
  const [law, setLaw] = useState(result?.law ?? '')
  const [targetDate, setTargetDate] = useState(result?.targetDate ?? '')

  const reset = (next?: Result, seed?: string) => {
    setName(next?.name ?? seed ?? '')
    setWhy(next?.why ?? '')
    setLaw(next?.law ?? '')
    setTargetDate(next?.targetDate ?? '')
  }

  const visible = open
  if (visible && name === '' && (result?.name || initialName)) {
    reset(result, initialName)
  }

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (result) {
      updateResult(result.id, {
        name: trimmed,
        why: why.trim() || undefined,
        law: law.trim() || undefined,
        targetDate: targetDate || undefined,
      })
    } else {
      createResult({
        name: trimmed,
        why: why.trim() || undefined,
        law: law.trim() || undefined,
        targetDate: targetDate || undefined,
      })
    }
    reset()
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={result ? t('planning.results.editTitle') : t('planning.results.createTitle')}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button className="flex-1" disabled={!name.trim()} onClick={save}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t('common.name')}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('planning.results.namePlaceholder')}
            autoFocus
          />
        </Field>
        <Field label={`${t('common.why')} (${t('common.optional')})`}>
          <Textarea
            rows={3}
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder={t('planning.results.whyPlaceholder')}
          />
        </Field>
        <Field
          label={`${t('planning.results.law')} (${t('common.optional')})`}
          hint={t('planning.results.lawHelper')}
        >
          <Textarea
            rows={2}
            value={law}
            onChange={(e) => setLaw(e.target.value)}
          />
        </Field>
        <Field label={`${t('planning.results.targetDate')} (${t('common.optional')})`}>
          <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  )
}

/** Controlled create/edit sheet that remounts when the seed name or result changes. */
export function ResultFormSheet(props: {
  open: boolean
  onClose: () => void
  result?: Result
  initialName?: string
}) {
  const key = `${props.result?.id ?? 'new'}:${props.initialName ?? ''}:${props.open ? '1' : '0'}`
  return <ResultForm key={key} {...props} />
}
