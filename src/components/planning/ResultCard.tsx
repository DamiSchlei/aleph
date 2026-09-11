import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge, Card, ProgressBar } from '@/components/ui/primitives'
import { resultHealth, resultProgress } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { MAX_OBJECTIVES_PER_RESULT } from '@/domain/limits'
import { STAGE_ORDER } from '@/domain/stage'
import { formatDate, formatHours } from '@/i18n/format'
import { stageShort } from '@/i18n/labels'
import type { Result } from '@/domain/types'
import type { ReactNode } from 'react'

export function ResultCard({
  result,
  handle,
}: {
  result: Result
  handle?: ReactNode
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const progress = resultProgress(state, result.id)
  const health = resultHealth(state, result.id)

  return (
    <Card className="flex items-start gap-1 p-2">
      <Link to={`/planning/results/${result.id}`} className="min-w-0 flex-1 p-2">
        <p className="font-display text-[16px] font-semibold text-white">{result.name}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {result.targetDate ? (
            <Badge tone="amber">{formatDate(result.targetDate, state.character.locale)}</Badge>
          ) : null}
          <Badge tone="accent">
            {t('planning.results.objectivesCount', {
              count: progress.objectiveCount,
              max: MAX_OBJECTIVES_PER_RESULT,
            })}
          </Badge>
        </div>
        {progress.tasksTotal > 0 ? <ProgressBar className="mt-3" ratio={progress.ratio} /> : null}
        <p className="mt-2 text-[12px] text-ink-400">
          {progress.tasksTotal === 0
            ? t('planning.results.noTasks')
            : t('planning.results.progress', {
                done: progress.tasksDone,
                total: progress.tasksTotal,
              })}
          {' · '}
          {t('planning.results.hours', {
            done: formatHours(progress.hoursDone, state.character.locale),
            total: formatHours(progress.hoursEstimated, state.character.locale),
          })}
        </p>
        <p className="mt-1 text-[12px] text-ink-400">
          {STAGE_ORDER.map(
            (stage) => `${stageShort(t, stage)} ${progress.objectivesByStage[stage]}`,
          ).join(' · ')}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-200">{t(health.key, health.params)}</p>
      </Link>
      {handle}
    </Card>
  )
}
