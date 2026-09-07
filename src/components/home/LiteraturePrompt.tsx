import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Textarea } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { addComment } from '@/data/actions'

export function LiteraturePrompt({
  open,
  taskId,
  kind,
  onClose,
}: {
  open: boolean
  taskId?: string
  kind: 'done' | 'blocked'
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [body, setBody] = useState('')

  const save = () => {
    if (taskId && body.trim()) addComment('task', taskId, body)
    setBody('')
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        setBody('')
        onClose()
      }}
      title={kind === 'done' ? t('home.literatureDone') : t('home.literatureBlocked')}
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setBody('')
              onClose()
            }}
          >
            {t('common.close')}
          </Button>
          <Button className="flex-1" disabled={!body.trim()} onClick={save}>
            {t('journal.post')}
          </Button>
        </div>
      }
    >
      <Textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={kind === 'done' ? t('home.literatureDone') : t('home.literatureBlocked')}
        autoFocus
      />
    </Sheet>
  )
}
