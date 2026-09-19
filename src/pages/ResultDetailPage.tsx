import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ObjectiveFormSheet } from '@/components/planning/ObjectiveForm'
import { ResultFormSheet } from '@/components/planning/ResultForm'
import { Button, EmptyState, Page, SectionTitle, cx } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { SortableList } from '@/components/ui/SortableList'
import { RowMenu } from '@/components/ui/RowMenu'
import { archiveResult, reorderObjectives, restoreResult } from '@/data/actions'
import { canAddObjective, MAX_OBJECTIVES_PER_RESULT } from '@/domain/limits'
import { pillarOfResult, PILLAR_COLOR } from '@/domain/pillars'
import {
  activeObjectivesOfResult,
  completedObjectivesOfResult,
  deriveObjectiveStage,
  objectiveProgress,
  resultById,
  skillById,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatDate, formatPercent } from '@/i18n/format'
import { stageShort } from '@/i18n/labels'
import type { AlephState, Objective, Result } from '@/domain/types'

function railColor(state: AlephState, result: Result): string {
  return skillById(state, result.skillId)?.color ?? PILLAR_COLOR[pillarOfResult(result)]
}

function ObjectiveRow({
  objective,
  handle,
}: {
  objective: Objective
  handle?: ReactNode
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const obj = objectiveProgress(state, objective.id)
  const done = objective.status === 'done'
  const percent =
    !done && obj.tasksTotal > 0 && obj.ratio && obj.ratio > 0
      ? formatPercent(obj.ratio, locale)
      : null
  const meta = [
    objective.targetDate ? formatDate(objective.targetDate, locale) : null,
    !done ? stageShort(t, deriveObjectiveStage(state, objective.id)) : t(`objectiveStatus.${objective.status}`),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className={cx(
        'relative flex overflow-hidden rounded-2xl border border-line bg-surface-2',
        done && 'opacity-80',
      )}
    >
      <Link
        to={`/planning/objectives/${objective.id}`}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 py-2.5 pr-2 pl-3"
      >
        {done ? (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-mint text-white">
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className={cx('line-clamp-1 text-[15px] leading-snug font-medium', done ? 'text-ink-3' : 'text-ink')}>
            {objective.name}
          </p>
          <p className="mt-0.5 truncate text-[12px] leading-tight text-text-3">{meta}</p>
        </div>
        {percent ? (
          <span className="shrink-0 text-[13px] tabular-nums text-accent">{percent}</span>
        ) : (
          <span aria-hidden className="text-ink-3">
            ›
          </span>
        )}
      </Link>
      {handle ? <div className="opacity-30">{handle}</div> : null}
    </div>
  )
}

export function ResultDetailPage() {
  const { resultId = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const state = useAleph()
  const result = resultById(state, resultId)
  const active = result ? activeObjectivesOfResult(state, result.id) : []
  const completed = result ? completedObjectivesOfResult(state, result.id) : []
  const [edit, setEdit] = useState(false)
  const [addObjective, setAddObjective] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const atLimit = !canAddObjective(state.objectives, resultId)
  const isArchived = result?.status === 'archived'
  const pillar = result ? pillarOfResult(result) : 'mind'
  const color = result ? railColor(state, result) : PILLAR_COLOR[pillar]

  if (!result) {
    return (
      <div className="pt-6">
        <EmptyState
          action={
            <Button variant="secondary" onClick={() => navigate('/planning')}>
              {t('common.back')}
            </Button>
          }
        >
          {t('planning.results.empty')}
        </EmptyState>
      </div>
    )
  }

  const meta = [
    result.targetDate ? formatDate(result.targetDate, state.character.locale) : null,
    t(`resultStatus.${result.status}`),
    t(`pillars.${pillar}`),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Page className="flex flex-col gap-4 pt-2">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate('/planning')}
          className="min-h-11 text-left text-[14px] text-text-3"
        >
          ← {t('planning.title')}
        </button>
        {isArchived ? (
          <Button variant="secondary" className="min-h-11 px-3" onClick={() => restoreResult(result.id)}>
            {t('planning.results.restore')}
          </Button>
        ) : (
          <RowMenu
            items={[
              { label: t('common.edit'), onClick: () => setEdit(true) },
              { label: t('common.archive'), tone: 'danger', onClick: () => setArchiveOpen(true) },
            ]}
          />
        )}
      </div>

      <header className="relative overflow-hidden rounded-2xl border border-line bg-surface-2 py-2.5 pr-3 pl-3">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: color }} />
        <div className="pl-2">
          <h1 className="line-clamp-2 text-[17px] leading-snug font-semibold text-ink">{result.name}</h1>
          <p className="mt-0.5 truncate text-[12px] leading-tight text-text-3">{meta}</p>
          {result.why ? (
            <p className="mt-1 line-clamp-1 break-words text-[13px] text-text-3">{result.why}</p>
          ) : null}
        </div>
      </header>

      <div>
        <SectionTitle
          action={
            isArchived ? null : (
              <Button disabled={atLimit} className="min-h-11 px-3" onClick={() => setAddObjective(true)}>
                {t('planning.objectives.new')}
              </Button>
            )
          }
        >
          {t('planning.results.activeObjectives', {
            count: active.length,
            max: MAX_OBJECTIVES_PER_RESULT,
          })}
        </SectionTitle>
        {atLimit && !isArchived ? (
          <p className="mb-3 text-[13px] leading-relaxed text-amber">{t('planning.objectives.limitReached')}</p>
        ) : null}
        {active.length === 0 ? (
          <EmptyState>
            {completed.length > 0
              ? t('planning.results.noActiveObjectives')
              : t('planning.results.noObjectives')}
          </EmptyState>
        ) : (
          <SortableList
            ids={active.map((o) => o.id)}
            onReorder={(ids) => reorderObjectives(result.id, ids)}
            handleLabel={t('common.reorderHint')}
          >
            {(id, handle) => {
              const objective = active.find((o) => o.id === id)
              if (!objective) return null
              return <ObjectiveRow objective={objective} handle={handle} />
            }}
          </SortableList>
        )}
      </div>

      {completed.length > 0 ? (
        <div>
          <SectionTitle>{t('planning.results.completedObjectives')}</SectionTitle>
          <ul className="flex flex-col gap-2">
            {completed.map((objective) => (
              <li key={objective.id}>
                <ObjectiveRow objective={objective} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ResultFormSheet open={edit} result={result} onClose={() => setEdit(false)} />
      <ObjectiveFormSheet
        open={addObjective}
        resultId={result.id}
        onClose={() => setAddObjective(false)}
      />
      <ConfirmDialog
        open={archiveOpen}
        title={t('common.archive')}
        message={t('planning.results.archiveConfirm')}
        tone="danger"
        onCancel={() => setArchiveOpen(false)}
        onConfirm={() => {
          archiveResult(result.id)
          navigate('/planning')
        }}
      />
    </Page>
  )
}
