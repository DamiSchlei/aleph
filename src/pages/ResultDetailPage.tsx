import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { JournalThread } from '@/components/journal/JournalThread'
import { ObjectiveFormSheet } from '@/components/planning/ObjectiveForm'
import { ResultFormSheet } from '@/components/planning/ResultForm'
import { Button, Card, EmptyState, Page, ProgressBar, SectionTitle } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { SortableList } from '@/components/ui/SortableList'
import { archiveResult, reorderObjectives, restoreResult } from '@/data/actions'
import { canAddObjective, MAX_OBJECTIVES_PER_RESULT } from '@/domain/limits'
import { pillarOfResult, PILLAR_COLOR } from '@/domain/pillars'
import {
  activeObjectivesOfResult,
  completedObjectivesOfResult,
  deriveObjectiveStage,
  objectiveProgress,
  resultById,
  resultHealth,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatDate } from '@/i18n/format'
import { stageShort } from '@/i18n/labels'
import type { Objective } from '@/domain/types'

function ObjectiveRow({
  objective,
  handle,
}: {
  objective: Objective
  handle?: ReactNode
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const obj = objectiveProgress(state, objective.id)
  const done = objective.status === 'done'

  return (
    <Card
      className={`flex items-start gap-1 border border-line bg-surface p-2 ${done ? 'opacity-80' : ''}`}
    >
      <Link
        to={`/planning/objectives/${objective.id}`}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 p-2"
      >
        {done ? (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-mint text-white">
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className={`font-medium text-ink ${done ? 'text-ink-3' : ''}`}>{objective.name}</p>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[12px] text-ink-3">
            {objective.targetDate ? (
              <span>
                {t('home.metaDate', {
                  date: formatDate(objective.targetDate, state.character.locale),
                })}
              </span>
            ) : null}
            {!done ? <span>{stageShort(t, deriveObjectiveStage(state, objective.id))}</span> : null}
          </div>
          {!done && obj.tasksTotal > 0 ? <ProgressBar className="mt-2" ratio={obj.ratio} /> : null}
        </div>
        <span aria-hidden className="text-ink-3">
          ›
        </span>
      </Link>
      {handle}
    </Card>
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
  const health = result ? resultHealth(state, result.id) : null
  const [edit, setEdit] = useState(false)
  const [addObjective, setAddObjective] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const atLimit = !canAddObjective(state.objectives, resultId)
  const isArchived = result?.status === 'archived'
  const pillar = result ? pillarOfResult(result) : 'mind'

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

  return (
    <Page className="flex flex-col gap-5 pt-4">
      <button
        type="button"
        onClick={() => navigate('/planning')}
        className="min-h-11 self-start text-[14px] text-text-3"
      >
        ← {t('planning.title')}
      </button>
      <header>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: PILLAR_COLOR[pillar] }}
            title={t(`pillars.${pillar}`)}
          />
          <h1 className="text-2xl font-semibold text-ink">{result.name}</h1>
        </div>
        {result.why ? <p className="mt-1 text-[15px] text-text-3">{result.why}</p> : null}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-text-3">
          {result.targetDate ? <span>{formatDate(result.targetDate, state.character.locale)}</span> : null}
          <span>{t(`resultStatus.${result.status}`)}</span>
          <span>{t(`pillars.${pillar}`)}</span>
        </div>
      </header>

      {health ? (
        <Card>
          <p className="text-[14px] leading-relaxed text-text-3">{t(health.key, health.params)}</p>
        </Card>
      ) : null}

      {isArchived ? (
        <Button variant="secondary" onClick={() => restoreResult(result.id)}>
          {t('planning.results.restore')}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setEdit(true)}>
            {t('common.edit')}
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => setArchiveOpen(true)}>
            {t('common.archive')}
          </Button>
        </div>
      )}

      <div>
        <SectionTitle
          action={
            isArchived ? null : (
              <Button disabled={atLimit} onClick={() => setAddObjective(true)}>
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

      <JournalThread parentType="result" parentId={result.id} />

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
