import { useTranslation } from 'react-i18next'
import { Badge, cx } from '@/components/ui/primitives'
import { STAGE_ORDER, canAdvance, canMoveTo, openTasksInStage } from '@/domain/stage'
import type { Objective, StageId, Task } from '@/domain/types'

export function StagePipeline({
  objective,
  tasks,
  onRequestMove,
}: {
  objective: Objective
  tasks: Task[]
  onRequestMove: (stage: StageId, openCount: number) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-2">
      {STAGE_ORDER.map((stage, index) => {
        const current = objective.currentStage === stage
        const reachable = canMoveTo(objective.currentStage, stage)
        const skipBlocked = !current && !reachable && !canAdvance(objective.currentStage, stage)
        const openCount = openTasksInStage(tasks, objective.id, objective.currentStage).length

        return (
          <button
            key={stage}
            type="button"
            disabled={!reachable}
            onClick={() => onRequestMove(stage, openCount)}
            className={cx(
              'min-h-16 flex-1 rounded-2xl border px-2 py-2 text-left transition-colors',
              current
                ? 'border-accent/50 bg-accent/12'
                : reachable
                  ? 'border-white/10 bg-white/4 hover:bg-white/8'
                  : 'border-white/6 bg-ink-900/40 text-ink-400',
            )}
          >
            <p className="text-[11px] font-semibold tracking-wide text-ink-400">{index + 1}</p>
            <p className={cx('mt-0.5 text-[13px] leading-tight font-medium', current && 'text-white')}>
              {t(`stages.${stage}.short`)}
            </p>
            {current ? <Badge tone="accent" className="mt-1">{t('planning.objectives.stageAdvance')}</Badge> : null}
            {skipBlocked && stage === 'review' && objective.currentStage === 'research' ? (
              <p className="mt-1 text-[11px] text-ink-400">{t('planning.objectives.stageCannotSkip')}</p>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
