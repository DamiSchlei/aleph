import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { JournalThread } from '@/components/journal/JournalThread'
import { ObjectiveFormSheet } from '@/components/planning/ObjectiveForm'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { TaskRow } from '@/components/task/TaskRow'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { useTaskActions } from '@/components/task/useTaskActions'
import { Button, EmptyState, Page, SectionTitle } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { SortableList } from '@/components/ui/SortableList'
import { archiveObjective, reorderTasks } from '@/data/actions'
import {
  nextReviewDue,
  nextTaskOfObjective,
  objectiveById,
  objectiveHealth,
  resultById,
  tasksOfObjective,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { formatDate } from '@/i18n/format'
import type { Task } from '@/domain/types'

export function ObjectiveDetailPage() {
  const { objectiveId = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const state = useAleph()
  const objective = objectiveById(state, objectiveId)
  const result = objective ? resultById(state, objective.resultId) : undefined
  const { toggle, dialog: completionDialog } = useTaskCompletion()
  const actions = useTaskActions()
  const [edit, setEdit] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [showDone, setShowDone] = useState(false)

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

  const all = tasksOfObjective(state, objective.id)
  const execution = all.filter((tk) => tk.stage === 'execution' && !isTaskDone(tk.status) && tk.status !== 'cancelled')
  const research = all.filter((tk) => tk.stage === 'research' && !isTaskDone(tk.status) && tk.status !== 'cancelled')
  const doneTasks = all.filter((tk) => isTaskDone(tk.status))
  const health = objectiveHealth(state, objective.id)
  const next = nextTaskOfObjective(state, objective.id)
  const reviewDue = nextReviewDue(state, objective.id)

  const momentProps = {
    onComplete: (tk: Task) => toggle(tk),
    onExecute: (tk: Task) => actions.execute(tk),
    onReturn: (tk: Task) => actions.back(tk),
  }

  return (
    <Page className="flex flex-col gap-5 pt-4">
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
        {next ? (
          <p className="mt-2 text-[15px] text-ink-200">{next.title}</p>
        ) : (
          <button
            type="button"
            className="mt-2 min-h-11 text-left text-[15px] text-accent"
            onClick={() => setCreating(true)}
          >
            {t('planning.objectives.nextStepCta')}
          </button>
        )}
        {reviewDue ? (
          <p className="mt-1 text-[13px] text-ink-400">
            {t('planning.objectives.reviewNext', { date: formatDate(reviewDue, state.character.locale) })}
          </p>
        ) : null}
        <p className="mt-2 text-[14px] leading-relaxed text-ink-200">{t(health.key, health.params)}</p>
      </header>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setEdit(true)}>
          {t('common.edit')}
        </Button>
        <Button variant="danger" className="flex-1" onClick={() => setArchiveOpen(true)}>
          {t('common.archive')}
        </Button>
      </div>

      <Button onClick={() => setCreating(true)}>{t('planning.tasks.new')}</Button>

      <section>
        <SectionTitle>{t('moments.research')}</SectionTitle>
        {research.length === 0 ? (
          <EmptyState>{t('planning.objectives.noneInResearch')}</EmptyState>
        ) : (
          <SortableList
            ids={research.map((tk) => tk.id)}
            onReorder={(ids) => reorderTasks(ids, 'importance')}
            handleLabel={t('common.reorderHint')}
          >
            {(id, handle) => {
              const task = research.find((tk) => tk.id === id)
              if (!task) return null
              return (
                <TaskRow
                  task={task}
                  onToggle={() => toggle(task)}
                  onExecute={() => actions.execute(task)}
                  onDelete={() => actions.requestDelete(task)}
                  onOpen={() => setEditingTask(task)}
                  handle={handle}
                  showContext={false}
                  hideCheckbox
                />
              )
            }}
          </SortableList>
        )}
      </section>

      <section>
        <SectionTitle>{t('moments.execution')}</SectionTitle>
        {execution.length === 0 ? (
          <EmptyState>{t('planning.objectives.noneInProgress')}</EmptyState>
        ) : (
          <SortableList
            ids={execution.map((tk) => tk.id)}
            onReorder={(ids) => reorderTasks(ids, 'importance')}
            handleLabel={t('common.reorderHint')}
          >
            {(id, handle) => {
              const task = execution.find((tk) => tk.id === id)
              if (!task) return null
              return (
                <TaskRow
                  task={task}
                  onToggle={() => toggle(task)}
                  onReturn={() => actions.back(task)}
                  onDelete={() => actions.requestDelete(task)}
                  onOpen={() => setEditingTask(task)}
                  handle={handle}
                  showContext={false}
                />
              )
            }}
          </SortableList>
        )}
      </section>

      {doneTasks.length > 0 ? (
        <section>
          <SectionTitle
            action={
              <Button variant="ghost" className="px-3" onClick={() => setShowDone((v) => !v)}>
                {showDone ? t('common.hide') : t('common.show')}
              </Button>
            }
          >
            {t('moments.done')} · {doneTasks.length}
          </SectionTitle>
          {showDone ? (
            <ul className="flex flex-col gap-2">
              {doneTasks.map((task) => (
                <li key={task.id}>
                  <TaskRow
                    task={task}
                    onToggle={() => toggle(task)}
                    onDelete={() => actions.requestDelete(task)}
                    onOpen={() => setEditingTask(task)}
                    showContext={false}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <JournalThread
        parentType="objective"
        parentId={objective.id}
        placeholder={t('journal.workingPlaceholder')}
        chronological
      />
      {completionDialog}
      {actions.dialog}

      <ObjectiveFormSheet
        open={edit}
        resultId={objective.resultId}
        objective={objective}
        onClose={() => setEdit(false)}
      />
      <TaskFormSheet
        open={creating}
        preset={{ resultId: objective.resultId, objectiveId: objective.id }}
        scoped
        onClose={() => setCreating(false)}
      />
      <TaskFormSheet
        open={Boolean(editingTask)}
        task={editingTask}
        moments={momentProps}
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
    </Page>
  )
}
