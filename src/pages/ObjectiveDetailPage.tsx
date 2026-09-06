import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { JournalThread } from '@/components/journal/JournalThread'
import { ObjectiveFormSheet } from '@/components/planning/ObjectiveForm'
import { StagePipeline } from '@/components/planning/StagePipeline'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { TaskRow } from '@/components/task/TaskRow'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { Button, Badge, EmptyState, SectionTitle, cx } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { SortableList } from '@/components/ui/SortableList'
import { archiveObjective, moveObjectiveStage, reorderTasks } from '@/data/actions'
import { objectiveById, resultById, tasksOfObjective } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { STAGE_ORDER, canMoveTo } from '@/domain/stage'
import { stageName } from '@/i18n/labels'
import type { StageId, Task } from '@/domain/types'

export function ObjectiveDetailPage() {
  const { objectiveId = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const state = useAleph()
  const objective = objectiveById(state, objectiveId)
  const result = objective ? resultById(state, objective.resultId) : undefined
  const tasks = objective ? tasksOfObjective(state, objective.id) : []
  const { toggle, dialog } = useTaskCompletion()
  const [edit, setEdit] = useState(false)
  const [taskPreset, setTaskPreset] = useState<{ stage: StageId } | null>(null)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [stageWarn, setStageWarn] = useState<{ stage: StageId; openCount: number } | null>(null)

  const requestMove = (stage: StageId, openCount: number) => {
    if (!objective || !canMoveTo(objective.currentStage, stage)) return
    if (openCount > 0 || objective.doneWhen) {
      setStageWarn({ stage, openCount })
      return
    }
    moveObjectiveStage(objective.id, stage)
  }

  if (!objective) {
    return (
      <div className="pt-6">
        <EmptyState
          action={
            <Button variant="secondary" onClick={() => navigate('/planning')}>
              {t('common.back')}
            </Button>
          }
        >
          {t('planning.results.noObjectives')}
        </EmptyState>
      </div>
    )
  }

  // The active stage leads; the others follow as secondary context.
  const orderedStages: StageId[] = [
    objective.currentStage,
    ...STAGE_ORDER.filter((s) => s !== objective.currentStage),
  ]

  const warnMessage = () => {
    const parts: string[] = []
    if (stageWarn && stageWarn.openCount > 0) {
      parts.push(
        t('planning.objectives.stageOpenTasks', {
          stage: stageName(t, objective.currentStage),
          count: stageWarn.openCount,
        }),
      )
    }
    if (objective.doneWhen) {
      parts.push(t('planning.objectives.doneWhenConfirm', { doneWhen: objective.doneWhen }))
    }
    return parts.join(' ') || t('planning.objectives.stageAdvance')
  }

  return (
    <div className="flex flex-col gap-5 pt-4">
      <button
        type="button"
        onClick={() => navigate(`/planning/results/${objective.resultId}`)}
        className="min-h-11 self-start text-[14px] text-ink-400"
      >
        ← {result?.name ?? t('planning.results.detailTitle')}
      </button>
      <header>
        <h1 className="text-2xl font-semibold text-white">{objective.name}</h1>
        {objective.why ? <p className="mt-1 text-[15px] text-ink-400">{objective.why}</p> : null}
        {objective.doneWhen ? (
          <p className="mt-2 text-[13px] text-ink-200">
            <span className="text-ink-400">{t('planning.objectives.doneWhen')}: </span>
            {objective.doneWhen}
          </p>
        ) : null}
      </header>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setEdit(true)}>
          {t('common.edit')}
        </Button>
        <Button variant="danger" className="flex-1" onClick={() => setArchiveOpen(true)}>
          {t('common.archive')}
        </Button>
      </div>

      <StagePipeline objective={objective} tasks={tasks} onRequestMove={requestMove} />

      {orderedStages.map((stage) => {
        const active = stage === objective.currentStage
        const stageTasks = tasks.filter((task) => task.stage === stage)
        return (
          <section key={stage} className={cx(!active && 'opacity-70')}>
            <SectionTitle
              action={
                <Button
                  variant="ghost"
                  className="px-3"
                  onClick={() => setTaskPreset({ stage })}
                >
                  {t('planning.tasks.new')}
                </Button>
              }
            >
              <span className="flex items-center gap-2">
                {t(`stages.${stage}.name`)}
                {active ? <Badge tone="accent">{t('planning.objectives.activeStage')}</Badge> : null}
              </span>
            </SectionTitle>
            {stageTasks.length === 0 ? (
              <EmptyState>{t('planning.objectives.stageEmpty')}</EmptyState>
            ) : (
              <SortableList
                ids={stageTasks.map((task) => task.id)}
                onReorder={(ids) => reorderTasks(ids, 'importance')}
                handleLabel={t('common.reorderHint')}
              >
                {(id, handle) => {
                  const task = stageTasks.find((item) => item.id === id)
                  if (!task) return null
                  return (
                    <TaskRow
                      task={task}
                      onToggle={() => toggle(task)}
                      onOpen={() => setEditingTask(task)}
                      handle={handle}
                      showContext={false}
                    />
                  )
                }}
              </SortableList>
            )}
          </section>
        )
      })}

      <JournalThread parentType="objective" parentId={objective.id} />
      {dialog}

      <ObjectiveFormSheet
        open={edit}
        resultId={objective.resultId}
        objective={objective}
        onClose={() => setEdit(false)}
      />
      <TaskFormSheet
        open={taskPreset !== null}
        preset={{
          resultId: objective.resultId,
          objectiveId: objective.id,
          stage: taskPreset?.stage ?? objective.currentStage,
        }}
        onClose={() => setTaskPreset(null)}
      />
      <TaskFormSheet
        open={Boolean(editingTask)}
        task={editingTask}
        onClose={() => setEditingTask(undefined)}
      />
      <ConfirmDialog
        open={archiveOpen}
        title={t('common.archive')}
        message={t('planning.objectives.archiveConfirm')}
        tone="danger"
        onCancel={() => setArchiveOpen(false)}
        onConfirm={() => {
          archiveObjective(objective.id)
          navigate(`/planning/results/${objective.resultId}`)
        }}
      />
      <ConfirmDialog
        open={stageWarn !== null}
        title={t('planning.objectives.stageAdvance')}
        message={warnMessage()}
        onCancel={() => setStageWarn(null)}
        onConfirm={() => {
          if (stageWarn) moveObjectiveStage(objective.id, stageWarn.stage)
          setStageWarn(null)
        }}
      />
    </div>
  )
}
