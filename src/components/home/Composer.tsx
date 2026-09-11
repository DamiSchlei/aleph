import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
      className="surface-raised rounded-2xl px-3 py-2"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <input
        id="home-composer"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('home.proposePlaceholder')}
        className="w-full min-h-10 bg-transparent text-[15px] text-ink-200 outline-none placeholder:text-ink-400/70"
      />
    </form>
  )
}
