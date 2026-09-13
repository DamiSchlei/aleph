import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'
import { STAGE_ORDER } from '@/domain/stage'
import type { StageId } from '@/domain/types'

/** Capture-style stage pills: past mint, current filled accent, future quiet. */
export function StagePath({ current }: { current?: StageId }) {
  const { t } = useTranslation()
  const currentIdx = current ? STAGE_ORDER.indexOf(current) : -1

  return (
    <ol className="mt-3 flex flex-wrap items-center gap-1.5">
      {STAGE_ORDER.map((stage, index) => {
        const past = currentIdx >= 0 && index < currentIdx
        const active = currentIdx >= 0 && index === currentIdx
        return (
          <li key={stage} className="flex items-center gap-1.5">
            <span
              className={cx(
                'inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-semibold tracking-wide',
                active && 'bg-accent text-ink-950',
                past && 'bg-mint/15 text-mint',
                !active && !past && 'bg-ink-800 text-text-3',
              )}
            >
              {t(`stages.${stage}.short`)}
            </span>
            {index < STAGE_ORDER.length - 1 ? (
              <span className="text-[11px] text-text-3" aria-hidden>
                ›
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
