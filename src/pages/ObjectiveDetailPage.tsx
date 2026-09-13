import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { JournalThread } from '@/components/journal/JournalThread'
import { ObjectiveFormSheet } from '@/components/planning/ObjectiveForm'
import { StagePath } from '@/components/planning/StagePath'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { TaskRow } from '@/components/task/TaskRow'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { useTaskActions } from '@/components/task/useTaskActions'
import { Button, Card, EmptyState, Page, ProgressBar } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { archiveObjective, updateObjectiveInventory, updateTask } from '@/data/actions'
import {
  objectiveById,
  objectiveProgress,
  resultById,
  tasksOfObjective,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { toDayKey } from '@/domain/dates'
import { formatMoney, formatPercent } from '@/i18n/format'
import { stageShort } from '@/i18n/labels'
import type { ObjectiveInventory, Task, TaskCheckItem } from '@/domain/types'

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
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [archiveOpen, setArchiveOpen] = useState(false)

  const all = useMemo(
    () => (objective ? tasksOfObjective(state, objective.id) : []),
    [state, objective],
  )
  const checklistItems = useMemo(() => buildChecklist(all), [all])
  const progress = objective ? objectiveProgress(state, objective.id) : null
  const percent = formatPercent(progress?.ratio, locale)
  const inventory = objective?.inventory ?? { costs: 0, contacts: 0, docs: 0, links: 0 }
  const openTasks = all.filter((tk) => !isTaskDone(tk.status) && tk.status !== 'cancelled')

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

  const bumpInventory = (key: keyof ObjectiveInventory) => {
    updateObjectiveInventory(objective.id, { [key]: (inventory[key] ?? 0) + 1 })
  }

  return (
    <Page className="flex flex-col gap-5 pt-4 pb-20">
      <button
        type="button"
        onClick={() => navigate(`/planning/results/${objective.resultId}`)}
        className="min-h-11 self-start text-[14px] text-text-3"
      >
        ← {result?.name ?? t('planning.results.detailTitle')}
      </button>

      <header>
        <h1 className="text-2xl font-semibold text-white">{objective.name}</h1>
        {objective.why ? <p className="mt-1 text-[15px] text-text-3">{objective.why}</p> : null}
        <p className="mt-2 text-[13px] text-text-3">
          {t('objectiveDetail.stageLabel', { stage: stageShort(t, objective.currentStage) })}
        </p>
        <StagePath current={objective.currentStage} />
      </header>

      <Card className="rounded-[20px]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] text-text-3">{t('objectiveDetail.progress')}</p>
          <p className="text-[15px] font-semibold text-accent">{percent ?? t('common.dash')}</p>
        </div>
        {progress.tasksTotal > 0 ? <ProgressBar className="mt-2" ratio={progress.ratio} /> : null}
      </Card>

      <section>
        <p className="mb-2 text-[13px] font-semibold tracking-[0.14em] text-text-3 uppercase">
          {t('objectiveDetail.checklistTitle')}
        </p>
        {checklistItems.length === 0 ? (
          <p className="text-[14px] text-text-3">{t('planning.objectives.noConcreteStep')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {checklistItems.map((item) => (
              <li key={item.id}>
                <label className="flex min-h-11 items-center gap-3 rounded-2xl bg-ink-900/80 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => item.onToggle()}
                    className="size-5 accent-accent-strong"
                  />
                  <span className={item.done ? 'text-text-3 line-through' : 'text-white'}>
                    {item.text}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="mb-2 text-[13px] font-semibold tracking-[0.14em] text-text-3 uppercase">
          {t('inventory.title')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              {
                key: 'costs' as const,
                label: t('inventory.costs'),
                value: `${t('common.money')}${formatMoney(inventory.costs, locale)}`,
              },
              {
                key: 'contacts' as const,
                label: t('inventory.contacts'),
                value: t('inventory.contactsUnit', { count: inventory.contacts }),
              },
              {
                key: 'docs' as const,
                label: t('inventory.docs'),
                value: t('inventory.docsUnit', { count: inventory.docs }),
              },
              {
                key: 'links' as const,
                label: t('inventory.links'),
                value: t('inventory.linksUnit', { count: inventory.links }),
              },
            ] as const
          ).map((cell) => (
            <Card key={cell.key} className="rounded-[20px] py-3">
              <p className="text-[12px] text-text-3">{cell.label}</p>
              <p className="mt-1 text-[16px] font-medium text-white">{cell.value}</p>
              <button
                type="button"
                onClick={() => bumpInventory(cell.key)}
                className="mt-2 text-[13px] text-accent"
              >
                {t('inventory.add')}
              </button>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-[13px] font-semibold tracking-[0.14em] text-text-3 uppercase">
          {t('objectiveDetail.tasksTitle')}
        </p>
        {openTasks.length === 0 ? (
          <EmptyState>{t('planning.objectives.noneInProgress')}</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {openTasks.map((task) => (
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
      </section>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setEdit(true)}>
          {t('common.edit')}
        </Button>
        <Button variant="danger" className="flex-1" onClick={() => setArchiveOpen(true)}>
          {t('common.archive')}
        </Button>
      </div>

      <JournalThread
        parentType="objective"
        parentId={objective.id}
        placeholder={t('journal.workingPlaceholder')}
        chronological
      />
      {completionDialog}
      {actions.dialog}

      <div className="safe-bottom sticky bottom-0 -mx-4 border-t border-white/8 bg-ink-950/95 px-4 py-3 backdrop-blur-xl">
        <Button className="w-full" onClick={() => setCreating(true)}>
          {t('objectiveDetail.ctaToday')}
        </Button>
      </div>

      <ObjectiveFormSheet
        open={edit}
        resultId={objective.resultId}
        objective={objective}
        onClose={() => setEdit(false)}
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

interface ChecklistRow {
  id: string
  text: string
  done: boolean
  onToggle: () => void
}

function buildChecklist(tasks: Task[]): ChecklistRow[] {
  const fromChecklists: ChecklistRow[] = []
  for (const task of tasks) {
    if (!task.checklist?.length) continue
    for (const item of task.checklist) {
      fromChecklists.push({
        id: `${task.id}:${item.id}`,
        text: item.text,
        done: item.done || isTaskDone(task.status),
        onToggle: () => toggleChecklistItem(task, item),
      })
    }
  }
  if (fromChecklists.length > 0) return fromChecklists

  return tasks
    .filter((task) => task.status !== 'cancelled')
    .map((task) => ({
      id: task.id,
      text: task.title,
      done: isTaskDone(task.status),
      onToggle: () => undefined,
    }))
}

function toggleChecklistItem(task: Task, item: TaskCheckItem) {
  const next = (task.checklist ?? []).map((entry) =>
    entry.id === item.id ? { ...entry, done: !entry.done } : entry,
  )
  updateTask(task.id, { checklist: next })
}
