import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input, cx } from '@/components/ui/primitives'
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
        className="safe-bottom fixed inset-x-0 bottom-[var(--tab-bar-height)] z-30 border-t border-line bg-bg/95 px-4 py-2.5 backdrop-blur-xl"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Input
            id="home-composer-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('home.composerPlaceholder')}
            className="flex-1 rounded-2xl"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            aria-label={t('home.proposeCta')}
            className={cx(
              'flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors',
              title.trim()
                ? 'bg-accent text-white'
                : 'bg-subtle text-text-3',
            )}
          >
            <SendIcon />
          </button>
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

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
