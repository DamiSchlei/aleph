import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, EmptyState, ProgressBar, SectionTitle } from '@/components/ui/primitives'
import { activeResults, objectiveProgress, objectivesOfResult, resultProgress } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { skillName, stageShort } from '@/i18n/labels'
import { skillById } from '@/data/selectors'

export function ResultProgress() {
  const { t } = useTranslation()
  const state = useAleph()
  const results = activeResults(state)
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <section>
      <SectionTitle>{t('tracking.results.title')}</SectionTitle>
      {results.length === 0 ? (
        <EmptyState>{t('tracking.results.empty')}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {results.map((result) => {
            const progress = resultProgress(state, result.id)
            const skill = skillById(state, result.skillId)
            const expanded = openId === result.id
            const objectives = objectivesOfResult(state, result.id)
            return (
              <li key={result.id}>
                <Card>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-2 text-left"
                    onClick={() => setOpenId(expanded ? null : result.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/planning/results/${result.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="truncate text-[15px] font-semibold text-white"
                      >
                        {result.name}
                      </Link>
                      <span className="text-[12px] text-ink-400">
                        {progress.ratio === null
                          ? t('tracking.results.noTasks')
                          : t('planning.results.progress', {
                              done: progress.tasksDone,
                              total: progress.tasksTotal,
                            })}
                      </span>
                    </div>
                    {skill ? <p className="text-[12px] text-ink-400">{skillName(t, skill)}</p> : null}
                    <ProgressBar ratio={progress.ratio} />
                    <p className="text-[12px] text-ink-400">
                      {expanded ? t('tracking.results.collapse') : t('tracking.results.expand')}
                    </p>
                  </button>
                  {expanded ? (
                    <ul className="mt-3 flex flex-col gap-2 border-t border-white/6 pt-3">
                      {objectives.length === 0 ? (
                        <li className="text-[13px] text-ink-400">{t('planning.results.noObjectives')}</li>
                      ) : (
                        objectives.map((objective) => {
                          const obj = objectiveProgress(state, objective.id)
                          return (
                            <li key={objective.id}>
                              <div className="flex items-center justify-between gap-2">
                                <Link
                                  to={`/planning/objectives/${objective.id}`}
                                  className="truncate text-[14px] text-white"
                                >
                                  {objective.name}
                                </Link>
                                <span className="text-[12px] text-ink-400">{stageShort(t, objective.currentStage)}</span>
                              </div>
                              <ProgressBar className="mt-1.5" ratio={obj.ratio} />
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
    </section>
  )
}
