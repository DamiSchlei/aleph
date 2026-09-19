import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { JournalThread } from '@/components/journal/JournalThread'
import { ObjectiveFormSheet } from '@/components/planning/ObjectiveForm'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { TaskRow } from '@/components/task/TaskRow'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { useTaskActions } from '@/components/task/useTaskActions'
import { Button, Chip, EmptyState, Page, ProgressBar, cx } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { RowMenu } from '@/components/ui/RowMenu'
import { archiveObjective, setObjectiveStatus } from '@/data/actions'
import {
  deriveObjectiveStage,
  objectiveById,
  objectiveProgress,
  resultById,
  tasksOfObjective,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { toDayKey } from '@/domain/dates'
import { canAddObjective } from '@/domain/limits'
import { formatDate, formatPercent } from '@/i18n/format'
import { stageShort } from '@/i18n/labels'
import type { ObjectiveStatus, Task } from '@/domain/types'

const STATUS_OPTIONS: ObjectiveStatus[] = ['pending', 'in_progress', 'done', 'blocked']

export function ObjectiveDetailPage() {
  const { objectiveId = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const objective = objectiveById(state, objectiveId)
  const result = objective ? resultById(state, objective.resultId) : undefined
  const { toggle, execute, dialog: completionDialog } = useTaskCompletion()
  const actions = useTaskActions()
  const [edit, setEdit] = useState(false)
  const [creating, setCreating] = useState(false)
  const [creatingObjective, setCreatingObjective] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [archiveOpen, setArchiveOpen] = useState(false)
  const canAddNext = objective ? canAddObjective(state.objectives, objective.resultId) : false

  const all = useMemo(
    () => (objective ? tasksOfObjective(state, objective.id) : []),
    [state, objective],
  )
  const progress = objective ? objectiveProgress(state, objective.id) : null
  const openTasks = all.filter((tk) => !isTaskDone(tk.status) && tk.status !== 'cancelled')
  const pending = openTasks.filter((tk) => tk.status === 'pending')
  const inProgress = openTasks.filter((tk) => tk.status === 'in_progress')
  const associated = [...pending, ...inProgress]
  const completed = all.filter((tk) => isTaskDone(tk.status))
  const stage = objective ? deriveObjectiveStage(state, objective.id) : 'research'
  const percent =
    progress && progress.tasksTotal > 0 && progress.ratio && progress.ratio > 0
      ? formatPercent(progress.ratio, locale)
      : null

  if (!objective || !progress) {
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

  const momentProps = {
    onComplete: (tk: Task) => toggle(tk),
    onExecute: (tk: Task) => execute(tk),
    onReturn: (tk: Task) => actions.back(tk),
  }

  const meta = [
    result?.name,
    objective.targetDate ? formatDate(objective.targetDate, locale) : null,
    stageShort(t, stage),
    completed.length > 0 ? t('objectiveDetail.completedCount', { n: completed.length }) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Page className="flex flex-col gap-4 pt-2 pb-24">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate(`/planning/results/${objective.resultId}`)}
          className="min-h-11 min-w-0 truncate text-left text-[14px] text-ink-3"
        >
          ← {result?.name ?? t('planning.results.detailTitle')}
        </button>
        <RowMenu
          items={[
            { label: t('common.edit'), onClick: () => setEdit(true) },
            { label: t('common.archive'), tone: 'danger', onClick: () => setArchiveOpen(true) },
          ]}
        />
      </div>

      <header>
        <h1 className="text-[17px] leading-snug font-semibold text-ink">{objective.name}</h1>
        <p className="mt-0.5 truncate text-[12px] leading-tight text-text-3">{meta}</p>
        {objective.why ? (
          <p className="mt-1 line-clamp-2 text-[13px] text-ink-3">{objective.why}</p>
        ) : null}
      </header>

      {percent && progress.ratio && progress.ratio > 0 ? (
        <div className="flex items-center gap-3">
          <ProgressBar className="flex-1" ratio={progress.ratio} />
          <span className="text-[13px] tabular-nums text-accent">{percent}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <Chip
            key={status}
            active={objective.status === status}
            onClick={() => setObjectiveStatus(objective.id, status)}
            className="min-h-11"
          >
            {t(`objectiveStatus.${status}`)}
          </Chip>
        ))}
      </div>

      {objective.status === 'done' ? (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-ink-3">{t('planning.objectives.completedCtaTitle')}</p>
          {canAddNext ? (
            <Button className="min-h-11 w-full" onClick={() => setCreatingObjective(true)}>
              {t('planning.objectives.completedCtaNew')}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="min-h-11 w-full"
              onClick={() => navigate(`/planning/results/${objective.resultId}`)}
            >
              {t('planning.objectives.completedCtaBack')}
            </Button>
          )}
        </div>
      ) : null}

      <section>
        <p className="mb-2 text-[13px] font-semibold tracking-[0.14em] text-ink-3 uppercase">
          {t('objectiveDetail.tasksTitle')}
        </p>
        {associated.length === 0 ? (
          <EmptyState>{t('planning.objectives.noneInProgress')}</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {associated.map((task) => (
              <li key={task.id}>
                <TaskRow
                  task={task}
                  onToggle={() => toggle(task)}
                  onExecute={() => execute(task)}
                  onReturn={() => actions.back(task)}
                  onDelete={() => actions.requestDelete(task)}
                  onOpen={() => setEditingTask(task)}
                  showContext={false}
                />
              </li>
            ))}
          </ul>
        )}
        <Button className="mt-3 min-h-11 w-full" onClick={() => setCreating(true)}>
          {t('objectiveDetail.createTask')}
        </Button>
      </section>

      {completed.length > 0 ? (
        <section>
          <p className="mb-2 text-[13px] font-semibold tracking-[0.14em] text-ink-3 uppercase">
            {t('objectiveDetail.completedTasksTitle')}
          </p>
          <ul className="flex flex-col gap-2">
            {completed.map((task) => (
              <li
                key={task.id}
                className="flex min-h-11 items-center gap-3 rounded-2xl border border-line bg-subtle px-3 py-2 opacity-80"
              >
                <span className="flex size-6 items-center justify-center rounded-md bg-mint text-white">
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className={cx('min-w-0 flex-1 truncate text-[15px] text-ink-3 line-through')}>
                  {task.title}
                </span>
                <span className="text-[12px] text-ink-3">{t(`taskStatus.${task.status}`)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <JournalThread
        parentType="objective"
        parentId={objective.id}
        placeholder={t('journal.objectivePlaceholder')}
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
      <ObjectiveFormSheet
        open={creatingObjective}
        resultId={objective.resultId}
        onClose={() => setCreatingObjective(false)}
      />
      <TaskFormSheet
        open={creating}
        preset={{
          resultId: objective.resultId,
          objectiveId: objective.id,
          dueAt: toDayKey(new Date()),
        }}
        scoped
        collapsedMore
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
