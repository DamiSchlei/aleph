import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@/components/ui/primitives'
import { captureLooseTask } from '@/data/actions'
import { dueAtForFilter, type AgendaFilter } from '@/data/selectors'

export function Composer({ filter, pickDate }: { filter: AgendaFilter; pickDate: string }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')

  const submit = () => {
    if (!captureLooseTask(title, { dueAt: dueAtForFilter(filter, pickDate) })) return
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
