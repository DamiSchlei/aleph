import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Card, EmptyState, ProgressBar } from '@/components/ui/primitives'
import { activeResults, objectiveProgress, objectivesOfResult, resultProgress } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatPercent } from '@/i18n/format'
import { skillName, stageShort } from '@/i18n/labels'
import { skillById } from '@/data/selectors'

export function ResultProgress({ showPercent = false }: { showPercent?: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = useAleph()
  const locale = state.character.locale
  const results = activeResults(state)
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div>
      {results.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={() => navigate('/planning')}>{t('tracking.results.emptyCta')}</Button>
          }
        >
          {t('tracking.results.empty')}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {results.map((result) => {
            const progress = resultProgress(state, result.id)
            const skill = skillById(state, result.skillId)
            const expanded = openId === result.id
            const objectives = objectivesOfResult(state, result.id)
            const percent = formatPercent(progress.ratio, locale)
            return (
              <li key={result.id}>
                <Card className="rounded-[20px]">
                  <button
                    type="button"
                    className="flex w-full flex-col gap-2 text-left"
                    onClick={() => setOpenId(expanded ? null : result.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/planning/results/${result.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="truncate text-[15px] font-semibold text-ink"
                      >
                        {result.name}
                      </Link>
                      <span className="text-[12px] text-accent">
                        {showPercent && percent
                          ? percent
                          : progress.ratio === null
                            ? t('tracking.results.noTasks')
                            : t('planning.results.progress', {
                                done: progress.tasksDone,
                                total: progress.tasksTotal,
                              })}
                      </span>
                    </div>
                    {skill ? <p className="text-[12px] text-text-3">{skillName(t, skill)}</p> : null}
                    {progress.tasksTotal > 0 ? <ProgressBar ratio={progress.ratio} /> : null}
                    <p className="text-[12px] text-text-3">
                      {expanded ? t('tracking.results.collapse') : t('tracking.results.expand')}
                    </p>
                  </button>
                  {expanded ? (
                    <ul className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
                      {objectives.length === 0 ? (
                        <li className="text-[13px] text-text-3">{t('planning.results.noObjectives')}</li>
                      ) : (
                        objectives.map((objective) => {
                          const obj = objectiveProgress(state, objective.id)
                          const objPercent = formatPercent(obj.ratio, locale)
                          return (
                            <li key={objective.id}>
                              <div className="flex items-center justify-between gap-2">
                                <Link
                                  to={`/planning/objectives/${objective.id}`}
                                  className="truncate text-[14px] text-ink"
                                >
                                  {objective.name}
                                </Link>
                                <span className="text-[12px] text-text-3">
                                  {objPercent ?? stageShort(t, objective.currentStage)}
                                </span>
                              </div>
                              {obj.tasksTotal > 0 ? <ProgressBar className="mt-1.5" ratio={obj.ratio} /> : null}
                            </li>
                          )
                        })
                      )}
                    </ul>
                  ) : null}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
