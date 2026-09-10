import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Chip, Input, SectionTitle } from '@/components/ui/primitives'
import { addWalkerEntry, setWalkerMood } from '@/data/actions'
import { recentWalkerEntries, todayWalkerMood } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatDate } from '@/i18n/format'
import type { WalkerMood } from '@/domain/types'

const MOODS: WalkerMood[] = ['up', 'tight', 'low']

export function WalkerJournal() {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const entries = recentWalkerEntries(state)
  const storedMood = todayWalkerMood(state)
  const [body, setBody] = useState('')
  const [pendingMood, setPendingMood] = useState<WalkerMood | undefined>()
  const mood = pendingMood ?? storedMood

  const pickMood = (next: WalkerMood) => {
    setPendingMood(next)
    setWalkerMood(next)
  }

  const post = () => {
    if (!addWalkerEntry({ body, mood })) return
    setBody('')
  }

  return (
    <section>
      <SectionTitle>{t('home.walker.title')}</SectionTitle>
      <div className="mb-3 flex flex-wrap gap-2">
        {MOODS.map((id) => (
          <Chip key={id} active={mood === id} onClick={() => pickMood(id)}>
            {t(`home.walker.mood.${id}`)}
          </Chip>
        ))}
      </div>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          post()
        }}
      >
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('home.walker.placeholder')}
        />
        <Button type="submit" disabled={!body.trim()}>
          {t('journal.post')}
        </Button>
      </form>
      {entries.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="text-[13px] leading-relaxed text-ink-400">
              <span>{formatDate(entry.createdAt, locale)}</span>
              {entry.mood ? ` · ${t(`home.walker.mood.${entry.mood}`)}` : ''}
              {' · '}
              {entry.body}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
