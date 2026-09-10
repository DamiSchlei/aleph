import { useState } from 'react'
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
import {
  deriveObjectiveStage,
  nextTaskOfObjective,
  objectiveProgress,
  objectivesOfResult,
  resultById,
  resultHealth,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatDate } from '@/i18n/format'
import { stageShort } from '@/i18n/labels'

export function ResultDetailPage() {
  const { resultId = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const state = useAleph()
  const result = resultById(state, resultId)
  const objectives = result ? objectivesOfResult(state, result.id) : []
  const health = result ? resultHealth(state, result.id) : null
  const [edit, setEdit] = useState(false)
  const [addObjective, setAddObjective] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const atLimit = !canAddObjective(state.objectives, resultId)
  const isArchived = result?.status === 'archived'

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
      <button type="button" onClick={() => navigate('/planning')} className="min-h-11 self-start text-[14px] text-ink-400">
        ← {t('planning.title')}
      </button>
      <header>
        <h1 className="text-2xl font-semibold text-white">{result.name}</h1>
        {result.why ? <p className="mt-1 text-[15px] text-ink-400">{result.why}</p> : null}
        {result.law ? (
          <p className="mt-2 text-[15px] leading-relaxed text-ink-200">
            <span className="text-ink-400">{t('planning.results.law')}: </span>
            {result.law}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-400">
          {result.targetDate ? <span>{formatDate(result.targetDate, state.character.locale)}</span> : null}
          <span>{t(`resultStatus.${result.status}`)}</span>
        </div>
      </header>

      {health ? (
        <Card>
          <p className="text-[14px] leading-relaxed text-ink-200">{t(health.key, health.params)}</p>
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
          {t('planning.results.objectivesCount', {
            count: objectives.length,
            max: MAX_OBJECTIVES_PER_RESULT,
          })}
        </SectionTitle>
        {atLimit && !isArchived ? (
          <p className="mb-3 text-[13px] leading-relaxed text-amber">{t('planning.objectives.limitReached')}</p>
        ) : null}
        {objectives.length === 0 ? (
          <EmptyState>{t('planning.results.noObjectives')}</EmptyState>
        ) : (
          <SortableList
            ids={objectives.map((o) => o.id)}
            onReorder={(ids) => reorderObjectives(result.id, ids)}
            handleLabel={t('common.reorderHint')}
          >
            {(id, handle) => {
              const objective = objectives.find((o) => o.id === id)
              if (!objective) return null
              const obj = objectiveProgress(state, objective.id)
              const next = nextTaskOfObjective(state, objective.id)
              return (
                <Card className="flex items-start gap-1 p-2">
                  <Link to={`/planning/objectives/${objective.id}`} className="min-w-0 flex-1 p-2">
                    <p className="font-medium text-white">{objective.name}</p>
                    <p className="mt-1 text-[12px] text-ink-400">
                      {stageShort(t, deriveObjectiveStage(state, objective.id))}
                      {' · '}
                      {obj.tasksTotal === 0
                        ? t('planning.results.noTasks')
                        : t('planning.results.progress', { done: obj.tasksDone, total: obj.tasksTotal })}
                    </p>
                    <ProgressBar className="mt-2" ratio={obj.ratio} />
                    <p className="mt-2 text-[12px] text-ink-200">
                      {next ? next.title : t('planning.objectives.noConcreteStep')}
                    </p>
                  </Link>
                  {handle}
                </Card>
              )
            }}
          </SortableList>
        )}
      </div>

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
