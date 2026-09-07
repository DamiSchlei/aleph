import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, EmptyState, Textarea } from '@/components/ui/primitives'
import { addComment } from '@/data/actions'
import { journalFor } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatDateTime } from '@/i18n/format'
import type { ParentType } from '@/domain/types'

export function JournalThread({
  parentType,
  parentId,
  placeholder,
  chronological = false,
}: {
  parentType: ParentType
  parentId: string
  placeholder?: string
  chronological?: boolean
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const entries = journalFor(state, parentType, parentId)
  const ordered = chronological ? [...entries].reverse() : entries
  const [body, setBody] = useState('')

  const post = () => {
    if (!addComment(parentType, parentId, body)) return
    setBody('')
  }

  return (
    <section className="mt-6">
      <h3 className="mb-3 text-[13px] font-semibold tracking-[0.14em] text-ink-400 uppercase">
        {t('journal.title')}
      </h3>
      <div className="mb-3 flex gap-2">
        <Textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder ?? t('journal.placeholder')}
          className="flex-1"
        />
        <Button className="self-end" disabled={!body.trim()} onClick={post}>
          {t('journal.post')}
        </Button>
      </div>
      {ordered.length === 0 ? (
        <EmptyState>{t('journal.empty')}</EmptyState>
      ) : (
        <ol className="flex flex-col gap-2">
          {ordered.map(({ comment, originType, originTitle }) => (
            <li key={comment.id} className="rounded-2xl border border-white/6 bg-ink-900/50 px-3 py-2.5">
              <p className="text-[12px] text-ink-400">
                {formatDateTime(comment.createdAt, locale)}
                {' · '}
                {t(`journal.origin.${originType}`)}
                {originTitle ? ` · ${originTitle}` : ''}
              </p>
              <p className="mt-1 text-[15px] leading-relaxed text-ink-200">{comment.body}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
