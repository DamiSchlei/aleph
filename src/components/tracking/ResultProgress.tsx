import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ProgressBar } from '@/components/ui/primitives'
import {
  activeResults,
  objectiveProgress,
  objectivesOfResult,
  resultProgress,
  resultRailColor,
  resultWeekStats,
  stageFocusOfResult,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatHours } from '@/i18n/format'
import { stageShort } from '@/i18n/labels'

export function ResultProgress({
  weekAnchor,
  hideEmptyCta = false,
}: {
  weekAnchor: string
  hideEmptyCta?: boolean
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const results = activeResults(state)
  const [openId, setOpenId] = useState<string | null>(null)

  if (results.length === 0) {
    if (hideEmptyCta) return null
    return <p className="px-1 text-[15px] leading-relaxed text-ink-3">{t('tracking.results.empty')}</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {results.map((result) => {
        const overall = resultProgress(state, result.id)
        const week = resultWeekStats(state, result.id, weekAnchor)
        const weekly = week.planned > 0
        const countLabel = weekly
          ? `${week.done}/${week.planned}`
          : overall.tasksTotal > 0
            ? `${overall.tasksDone}/${overall.tasksTotal}`
            : null
        const ratio = weekly ? week.ratio : overall.ratio
        const stage = stageFocusOfResult(state, result.id)
        const expanded = openId === result.id
        const objectives = objectivesOfResult(state, result.id)
        const metaParts: string[] = []
        metaParts.push(`${formatHours(week.hours, locale)} h`)
        if (stage) metaParts.push(stageShort(t, stage))
        if (!weekly && overall.tasksTotal > 0) metaParts.push(t('tracking.resultOverall'))

        return (
          <li key={result.id}>
            <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-2">
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ background: resultRailColor(state, result) }}
              />
              <button
                type="button"
                className="flex w-full min-h-11 flex-col gap-1 py-3 pr-3 pl-3.5 text-left"
                onClick={() => setOpenId(expanded ? null : result.id)}
                aria-expanded={expanded}
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/planning/results/${result.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-0 flex-1 line-clamp-2 text-[17px] leading-snug font-medium text-ink"
                  >
                    {result.name}
                  </Link>
                  {countLabel ? (
                    <span className="shrink-0 pt-0.5 text-[13px] font-medium tabular-nums text-accent">
                      {countLabel}
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-[12px] text-text-3">{metaParts.join(' · ')}</p>
                {ratio !== null && ratio > 0 ? <ProgressBar className="mt-1" ratio={ratio} /> : null}
              </button>
              {expanded ? (
                <ul className="flex flex-col gap-1 border-t border-line px-3.5 py-2">
                  {objectives.length === 0 ? (
                    <li className="py-1 text-[13px] text-text-3">{t('planning.results.noObjectives')}</li>
                  ) : (
                    objectives.map((objective) => {
                      const obj = objectiveProgress(state, objective.id)
                      const done = objective.status === 'done'
                      return (
                        <li key={objective.id}>
                          <Link
                            to={`/planning/objectives/${objective.id}`}
                            className="flex min-h-11 items-center justify-between gap-2"
                          >
                            <span
                              className={`min-w-0 truncate text-[14px] ${done ? 'text-ink-3 line-through' : 'text-ink'}`}
                            >
                              {objective.name}
                            </span>
                            <span className="shrink-0 text-[12px] text-text-3">
                              {obj.tasksTotal > 0
                                ? `${obj.tasksDone}/${obj.tasksTotal}`
                                : stageShort(t, objective.currentStage)}
                            </span>
                          </Link>
                        </li>
                      )
                    })
                  )}
                </ul>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
