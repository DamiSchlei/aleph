import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TerrainChips } from '@/components/task/TerrainChips'
import { cx } from '@/components/ui/primitives'
import { captureLooseTask } from '@/data/actions'
import { composerWriteForDay } from '@/domain/composerParse'
import type { Terrain } from '@/domain/types'

let lastComposerTerrain: Terrain | undefined

/**
 * Title + hours + terrain + submit. Creates a loose task on `dayKey` (not always today).
 */
export function Composer({ dayKey }: { dayKey: string }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const [hours, setHours] = useState(1)
  const [terrain, setTerrain] = useState<Terrain | undefined>(lastComposerTerrain)
  const inputRef = useRef<HTMLInputElement>(null)

  const pickTerrain = useCallback((next: Terrain) => {
    lastComposerTerrain = next
    setTerrain(next)
  }, [])

  const submit = useCallback(() => {
    const raw = draft.trim()
    if (!raw || !terrain) return
    const write = composerWriteForDay(raw, dayKey, hours)
    captureLooseTask(write.title, {
      scheduledFor: write.scheduledFor,
      dueAt: write.dueAt,
      estimatedHours: write.estimatedHours,
      difficulty: write.difficulty,
      terrain,
    })
    setDraft('')
    setHours(1)
    inputRef.current?.focus()
  }, [dayKey, draft, hours, terrain])

  const canSubmit = Boolean(draft.trim()) && Boolean(terrain)

  return (
    <form
      className="flex flex-col gap-2 rounded-2xl border border-line-strong bg-bg px-3 py-2"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          id="home-composer-input"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('home.composerPlaceholder')}
          className="min-h-11 min-w-0 flex-1 basis-[10rem] bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-4"
        />
        <div className="flex shrink-0 items-center text-[13px] text-ink-3">
          <button
            type="button"
            aria-label={t('home.hoursDown')}
            className="flex size-11 items-center justify-center rounded-xl hover:bg-subtle"
            onClick={() => setHours((value) => Math.max(0.5, Math.round((value - 0.5) * 10) / 10))}
          >
            −
          </button>
          <span className="min-w-7 text-center tabular-nums text-ink">{hours}h</span>
          <button
            type="button"
            aria-label={t('home.hoursUp')}
            className="flex size-11 items-center justify-center rounded-xl hover:bg-subtle"
            onClick={() => setHours((value) => Math.min(8, Math.round((value + 0.5) * 10) / 10))}
          >
            +
          </button>
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cx(
            'min-h-11 shrink-0 rounded-2xl px-3 text-[14px] font-semibold',
            canSubmit ? 'bg-accent text-white' : 'bg-subtle text-ink-4',
          )}
        >
          {t('home.composerCta')}
        </button>
      </div>
      <TerrainChips value={terrain} onChange={pickTerrain} hint={false} />
    </form>
  )
}
