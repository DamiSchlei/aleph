import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { JournalThread } from '@/components/journal/JournalThread'
import { Sheet } from '@/components/ui/Sheet'
import { setJournalBubbleHidden } from '@/data/actions'
import { useAleph } from '@/data/store'

type BubbleMode = 'pip' | 'collapsed' | 'open'

/**
 * Character journal entry point on every Shell route.
 * Pip (hidden) ↔ collapsed chip ↔ sheet. Survives navigation via character.journalBubbleHidden.
 */
export function JournalBubble() {
  const { t } = useTranslation()
  const state = useAleph()
  const character = state.character
  const [mode, setMode] = useState<BubbleMode>(character.journalBubbleHidden ? 'pip' : 'collapsed')
  const [forcePip, setForcePip] = useState(false)

  useEffect(() => {
    setMode(character.journalBubbleHidden ? 'pip' : 'collapsed')
  }, [character.journalBubbleHidden])

  useEffect(() => {
    const composerFocused = () => document.activeElement?.id === 'home-composer-input'

    const sync = () => {
      const vv = window.visualViewport
      const keyboardUp = Boolean(vv && window.innerHeight - vv.height > 80)
      setForcePip(composerFocused() || keyboardUp)
    }

    const onFocusIn = () => {
      if (composerFocused()) setForcePip(true)
    }
    const onFocusOut = () => {
      // Defer so the next focus target is known.
      window.setTimeout(sync, 0)
    }

    sync()
    window.visualViewport?.addEventListener('resize', sync)
    window.visualViewport?.addEventListener('scroll', sync)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      window.visualViewport?.removeEventListener('resize', sync)
      window.visualViewport?.removeEventListener('scroll', sync)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  const visibleMode: BubbleMode = forcePip && mode !== 'open' ? 'pip' : mode

  const hideToPip = () => {
    setMode('pip')
    setJournalBubbleHidden(true)
  }

  const showCollapsed = () => {
    setMode('collapsed')
    setJournalBubbleHidden(false)
  }

  const openSheet = () => {
    setMode('open')
    setJournalBubbleHidden(false)
  }

  const closeSheet = () => {
    setMode(character.journalBubbleHidden ? 'pip' : 'collapsed')
  }

  return (
    <>
      {visibleMode === 'pip' ? (
        <button
          type="button"
          aria-label={t('journal.bubbleOpen')}
          onClick={showCollapsed}
          className="fixed z-40 size-3 rounded-full bg-ink-2/80"
          style={{
            right: 'max(1rem, env(safe-area-inset-right))',
            bottom: 'max(calc(var(--tab-bar-height) + 0.5rem), env(safe-area-inset-bottom))',
          }}
        />
      ) : null}

      {visibleMode === 'collapsed' ? (
        <div
          className="fixed z-40 flex items-end gap-1"
          style={{
            right: 'max(1rem, env(safe-area-inset-right))',
            bottom: 'max(calc(var(--tab-bar-height) + 0.5rem), env(safe-area-inset-bottom))',
          }}
        >
          <button
            type="button"
            aria-label={t('journal.bubbleHide')}
            title={t('journal.bubbleHide')}
            onClick={hideToPip}
            className="mb-1 flex size-7 items-center justify-center rounded-full border border-line bg-surface text-ink-3"
          >
            <span aria-hidden className="text-[12px] leading-none">
              ▾
            </span>
          </button>
          <button
            type="button"
            aria-label={t('journal.bubbleOpen')}
            onClick={openSheet}
            onContextMenu={(e) => {
              e.preventDefault()
              hideToPip()
            }}
            className="flex size-11 items-center justify-center overflow-hidden rounded-full border border-line bg-surface shadow-sm"
          >
            <Avatar avatar={character.avatar} size={36} className="rounded-full" />
          </button>
        </div>
      ) : null}

      <Sheet open={mode === 'open'} onClose={closeSheet} title={t('journal.characterTitle')}>
        <JournalThread
          parentType="character"
          parentId={character.id}
          placeholder={t('journal.characterPlaceholder')}
          emptyLabel={t('journal.characterEmpty')}
          showHeading={false}
          chronological
        />
      </Sheet>
    </>
  )
}
