import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'
import { STAGE_ORDER } from '@/domain/stage'
import { stageShort } from '@/i18n/labels'
import type { StageId } from '@/domain/types'

export function StagePath({ currentStage }: { currentStage: StageId }) {
  const { t } = useTranslation()
  const currentIndex = STAGE_ORDER.indexOf(currentStage)

  return (
    <ol className="flex items-center gap-2">
      {STAGE_ORDER.map((stage, index) => {
        const reached = index <= currentIndex
        const active = index === currentIndex
        return (
          <li key={stage} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={cx(
                  'flex size-8 items-center justify-center rounded-full border text-[11px] font-semibold',
                  reached
                    ? active
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-mint/40 bg-mint/10 text-mint'
                    : 'border-white/10 bg-white/4 text-ink-400',
                )}
              >
                {index + 1}
              </span>
              <span className="truncate text-center text-[10px] text-ink-400">
                {stageShort(t, stage)}
              </span>
            </div>
            {index < STAGE_ORDER.length - 1 ? (
              <span
                className={cx(
                  'mb-4 h-px flex-1',
                  index < currentIndex ? 'bg-mint/40' : 'bg-white/10',
                )}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
