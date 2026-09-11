import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'
import { STAGE_ORDER } from '@/domain/stage'
import type { StageId } from '@/domain/types'

export function StagePath({ current }: { current?: StageId }) {
  const { t } = useTranslation()
  const currentIdx = current ? STAGE_ORDER.indexOf(current) : -1

  return (
    <ol className="mt-3 flex items-center gap-2">
      {STAGE_ORDER.map((stage, index) => {
        const tone =
          currentIdx < 0
            ? 'text-text-3'
            : index < currentIdx
              ? 'text-mint'
              : index === currentIdx
                ? 'text-accent'
                : 'text-text-3'
        const dot =
          currentIdx < 0
            ? 'bg-text-3/40'
            : index < currentIdx
              ? 'bg-mint'
              : index === currentIdx
                ? 'bg-accent'
                : 'bg-text-3/40'
        return (
          <li key={stage} className="flex min-w-0 flex-1 items-center gap-2">
            <span className={cx('size-1.5 shrink-0 rounded-full', dot)} />
            <span className={cx('truncate text-[11px] font-medium', tone)}>
              {t(`stages.${stage}.short`)}
            </span>
            {index < STAGE_ORDER.length - 1 ? <span className="h-px min-w-2 flex-1 bg-white/14" /> : null}
          </li>
        )
      })}
    </ol>
  )
}
