import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Chip, Input } from '@/components/ui/primitives'
import { captureLooseTask } from '@/data/actions'

export function Composer() {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [today, setToday] = useState(false)

  const submit = () => {
    if (!captureLooseTask(title, { today })) return
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
      <div className="flex">
        <Chip active={today} onClick={() => setToday((v) => !v)}>
          {t('common.today')}
        </Chip>
      </div>
    </form>
  )
}
