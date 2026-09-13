import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@/components/ui/primitives'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { dueAtForFilter, type AgendaFilter } from '@/data/selectors'

/**
 * Fixed above the tab bar. Submitting opens the shared TaskForm sheet
 * (Más opciones collapsed) with the typed title and filter due date.
 */
export function Composer({ filter, pickDate }: { filter: AgendaFilter; pickDate: string }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<{ title: string; dueAt?: string } | null>(null)

  const submit = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    setDraft({ title: trimmed, dueAt: dueAtForFilter(filter, pickDate) })
    setCreating(true)
    setTitle('')
  }

  return (
    <>
      <form
        className="safe-bottom fixed inset-x-0 bottom-[var(--tab-bar-height)] z-30 border-t border-white/8 bg-ink-950/95 px-4 py-2 backdrop-blur-xl"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="mx-auto flex max-w-lg gap-2">
          <Input
            id="home-composer-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('home.composerPlaceholder')}
            className="flex-1"
          />
          <Button type="submit" disabled={!title.trim()}>
            {t('home.proposeCta')}
          </Button>
        </div>
      </form>

      <TaskFormSheet
        open={creating}
        onClose={() => {
          setCreating(false)
          setDraft(null)
        }}
        preset={{
          dueAt: draft?.dueAt,
        }}
        initialTitle={draft?.title}
        collapsedMore
      />
    </>
  )
}
