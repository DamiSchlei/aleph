import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@/components/ui/primitives'
import { captureLooseTask } from '@/data/actions'
import { addDays, toDayKey } from '@/domain/dates'
import type { AgendaFilter } from '@/data/selectors'

/** The due date a freshly captured task gets, following the active agenda filter. */
function dueForFilter(filter: AgendaFilter, pickDate: string): string {
  if (filter === 'tomorrow') return toDayKey(addDays(new Date(), 1))
  if (filter === 'pick') return pickDate || toDayKey(new Date())
  return toDayKey(new Date())
}

export function Composer({ filter, pickDate }: { filter: AgendaFilter; pickDate: string }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')

  const submit = () => {
    if (!captureLooseTask(title, { dueAt: dueForFilter(filter, pickDate) })) return
    setTitle('')
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('home.proposePlaceholder')}
        className="flex-1"
      />
      <Button type="submit" disabled={!title.trim()}>
        {t('home.proposeCta')}
      </Button>
    </form>
  )
}
