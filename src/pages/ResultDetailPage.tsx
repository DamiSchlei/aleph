import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { JournalThread } from '@/components/journal/JournalThread'
import { ObjectiveFormSheet } from '@/components/planning/ObjectiveForm'
import { ResultRelations } from '@/components/planning/ResultRelations'
import { ResultFormSheet } from '@/components/planning/ResultForm'
import { Button, Card, EmptyState, ProgressBar } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { SortableList } from '@/components/ui/SortableList'
import { archiveResult, reorderObjectives } from '@/data/actions'
import { canAddObjective, MAX_OBJECTIVES_PER_RESULT } from '@/domain/limits'
import { objectiveProgress, objectivesOfResult, resultById, resultProgress, skillById } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatDate } from '@/i18n/format'
import { skillName, stageShort } from '@/i18n/labels'

export function ResultDetailPage() {
  const { resultId = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const state = useAleph()
  const result = resultById(state, resultId)
  const objectives = result ? objectivesOfResult(state, result.id) : []
  const progress = result ? resultProgress(state, result.id) : null
  const skill = result ? skillById(state, result.skillId) : undefined
  const [edit, setEdit] = useState(false)
  const [addObjective, setAddObjective] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const atLimit = !canAddObjective(state.objectives, resultId)

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
    <div className="flex flex-col gap-5 pt-4">
      <button type="button" onClick={() => navigate('/planning')} className="min-h-11 self-start text-[14px] text-ink-400">
        ← {t('planning.title')}
      </button>
      <header>
        <h1 className="text-2xl font-semibold text-white">{result.name}</h1>
        {result.why ? <p className="mt-1 text-[15px] text-ink-400">{result.why}</p> : null}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-400">
          {skill ? <span>{skillName(t, skill)}</span> : null}
          {result.targetDate ? <span>{formatDate(result.targetDate, state.character.locale)}</span> : null}
          <span>{t(`resultStatus.${result.status}`)}</span>
        </div>
      </header>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setEdit(true)}>
          {t('common.edit')}
        </Button>
        <Button variant="danger" className="flex-1" onClick={() => setArchiveOpen(true)}>
          {t('common.archive')}
        </Button>
      </div>

      {progress ? (
        <Card>
          <p className="text-[13px] text-ink-400">
            {progress.tasksTotal === 0
              ? t('planning.results.noTasks')
              : t('planning.results.progress', { done: progress.tasksDone, total: progress.tasksTotal })}
          </p>
          <ProgressBar className="mt-2" ratio={progress.ratio} />
          <p className="mt-3 text-[12px] text-ink-400">
            {(['research', 'execution', 'review'] as const)
              .map((stage) => `${stageShort(t, stage)} ${progress.objectivesByStage[stage]}`)
              .join(' · ')}
          </p>
        </Card>
      ) : null}

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-semibold tracking-[0.14em] text-ink-400 uppercase">
            {t('planning.results.objectivesCount', {
              count: objectives.length,
              max: MAX_OBJECTIVES_PER_RESULT,
            })}
          </h2>
          <Button disabled={atLimit} onClick={() => setAddObjective(true)}>
            {t('planning.objectives.new')}
          </Button>
        </div>
        {atLimit ? (
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
              return (
                <Card className="flex items-start gap-1 p-2">
                  <Link to={`/planning/objectives/${objective.id}`} className="min-w-0 flex-1 p-2">
                    <p className="font-medium text-white">{objective.name}</p>
                    <p className="mt-1 text-[12px] text-ink-400">
                      {stageShort(t, objective.currentStage)}
                      {' · '}
                      {obj.tasksTotal === 0
                        ? t('planning.results.noTasks')
                        : t('planning.results.progress', { done: obj.tasksDone, total: obj.tasksTotal })}
                    </p>
                    <ProgressBar className="mt-2" ratio={obj.ratio} />
                  </Link>
                  {handle}
                </Card>
              )
            }}
          </SortableList>
        )}
      </div>

      <ResultRelations objectives={objectives} />
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
    </div>
  )
}
