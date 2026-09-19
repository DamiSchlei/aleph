import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ResultFormSheet } from '@/components/planning/ResultForm'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { AssignSheet } from '@/components/task/AssignSheet'
import { TaskRow } from '@/components/task/TaskRow'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { useTaskActions } from '@/components/task/useTaskActions'
import { SortableList } from '@/components/ui/SortableList'
import { RowMenu } from '@/components/ui/RowMenu'
import {
  Button,
  Chip,
  EmptyState,
  Input,
  Page,
  Select,
} from '@/components/ui/primitives'
import { ConfirmDialog, Sheet } from '@/components/ui/Sheet'
import { archiveResult, reorderResults, restoreResult } from '@/data/actions'
import {
  activeResults,
  attendingResults,
  leastActiveAttending,
  pickerObjectives,
  pickerResults,
  resultProgress,
  skillById,
  stageFocusOfResult,
  taskResultStatus,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { shouldSoftWarnActiveResults } from '@/domain/limits'
import { STAGE_ORDER } from '@/domain/stage'
import { pillarOfResult, PILLAR_COLOR } from '@/domain/pillars'
import { formatPercent } from '@/i18n/format'
import { skillName, stageShort } from '@/i18n/labels'
import type { AlephState, Result, StageId, Task, TaskStatus } from '@/domain/types'

type PlanningTab = 'results' | 'tasks'

function railColor(state: AlephState, result: Result): string {
  return skillById(state, result.skillId)?.color ?? PILLAR_COLOR[pillarOfResult(result)]
}

export function PlanningPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<PlanningTab>('results')

  return (
    <Page className="flex flex-col gap-3 pt-2">
      <div className="flex gap-2">
        <Chip active={tab === 'results'} onClick={() => setTab('results')} className="min-w-28 justify-center">
          {t('planning.tabs.results')}
        </Chip>
        <Chip active={tab === 'tasks'} onClick={() => setTab('tasks')} className="min-w-28 justify-center">
          {t('planning.tabs.tasks')}
        </Chip>
      </div>
      {tab === 'results' ? <ResultsTab /> : <TasksTab />}
    </Page>
  )
}

function ResultsTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = useAleph()
  const locale = state.character.locale
  const results = activeResults(state)
  const archived = state.results.filter((r) => r.status === 'archived')
  const attendingCount = attendingResults(state).length
  const [open, setOpen] = useState(false)
  const [seed, setSeed] = useState<string | undefined>()
  const [showArchived, setShowArchived] = useState(false)
  const [capOpen, setCapOpen] = useState(false)
  const [archiveId, setArchiveId] = useState<string | null>(null)

  const openCreate = (name?: string) => {
    setSeed(name)
    setOpen(true)
  }

  const requestCreate = (name?: string) => {
    if (shouldSoftWarnActiveResults(attendingCount)) {
      setSeed(name)
      setCapOpen(true)
      return
    }
    openCreate(name)
  }

  const writeJournal = () => {
    setCapOpen(false)
    const target = leastActiveAttending(state)
    if (target) navigate(`/planning/results/${target.id}`)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-text-3 uppercase">
          {t('planning.activeEnterprises')}
        </p>
        {results.length > 0 ? (
          <button
            type="button"
            aria-label={t('planning.results.new')}
            onClick={() => requestCreate()}
            className="flex size-11 items-center justify-center rounded-full border border-line text-accent"
          >
            +
          </button>
        ) : null}
      </div>

      <Link to="/planning/week" className="text-[13px] text-accent">
        {t('planning.openWeek')}
      </Link>

      {results.length === 0 ? (
        <EmptyState
          action={<Button onClick={() => requestCreate()}>{t('planning.newResult')}</Button>}
        >
          {t('planning.results.empty')}
        </EmptyState>
      ) : (
        <SortableList
          ids={results.map((r) => r.id)}
          onReorder={reorderResults}
          handleLabel={t('common.reorderHint')}
        >
          {(id, handle) => {
            const result = results.find((r) => r.id === id)
            if (!result) return null
            const progress = resultProgress(state, result.id)
            const stage = stageFocusOfResult(state, result.id)
            const percent =
              progress.tasksTotal > 0 && progress.ratio && progress.ratio > 0
                ? formatPercent(progress.ratio, locale)
                : null
            const count = progress.objectiveCount
            const countLabel =
              count === 1
                ? t('planning.objectiveCountOne')
                : t('planning.objectiveCount', { count })
            const meta = [countLabel, stage ? stageShort(t, stage) : null]
              .filter(Boolean)
              .join(' · ')
            return (
              <div className="relative flex overflow-hidden rounded-2xl border border-line bg-surface-2">
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{ background: railColor(state, result) }}
                />
                <Link
                  to={`/planning/results/${result.id}`}
                  className="flex min-h-11 min-w-0 flex-1 items-center py-2.5 pr-1 pl-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[17px] leading-snug font-medium text-ink">
                      {result.name}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] leading-tight text-text-3">{meta}</p>
                  </div>
                  {percent ? (
                    <span className="shrink-0 pl-2 text-[13px] font-medium tabular-nums text-accent">
                      {percent}
                    </span>
                  ) : null}
                </Link>
                <div className="flex items-center pr-0.5">
                  <RowMenu
                    items={[
                      {
                        label: t('common.edit'),
                        onClick: () => navigate(`/planning/results/${result.id}`),
                      },
                      {
                        label: t('common.archive'),
                        tone: 'danger',
                        onClick: () => setArchiveId(result.id),
                      },
                    ]}
                  />
                  <div className="opacity-30">{handle}</div>
                </div>
              </div>
            )
          }}
        </SortableList>
      )}

      {archived.length > 0 ? (
        <div>
          <Button variant="ghost" className="px-2" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? t('planning.results.hideArchived') : t('planning.results.showArchived')}
          </Button>
          {showArchived ? (
            <ul className="mt-2 flex flex-col gap-2">
              {archived.map((result) => (
                <li
                  key={result.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-3 py-2"
                >
                  <Link to={`/planning/results/${result.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-ink">{result.name}</p>
                    <p className="text-[12px] text-text-3">{t('resultStatus.archived')}</p>
                  </Link>
                  <Button variant="secondary" onClick={() => restoreResult(result.id)}>
                    {t('planning.results.restore')}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <ResultFormSheet open={open} initialName={seed} onClose={() => setOpen(false)} />
      <ConfirmDialog
        open={capOpen}
        title={t('planning.results.createTitle')}
        message={t('planning.results.softCap', { count: attendingCount })}
        confirmLabel={t('planning.results.writeJournal')}
        cancelLabel={t('planning.results.createAnyway')}
        onConfirm={writeJournal}
        onCancel={() => {
          setCapOpen(false)
          openCreate(seed)
        }}
        onDismiss={() => setCapOpen(false)}
      />
      <ConfirmDialog
        open={Boolean(archiveId)}
        title={t('common.archive')}
        tone="danger"
        message={t('planning.results.archiveConfirm')}
        onCancel={() => setArchiveId(null)}
        onConfirm={() => {
          if (archiveId) archiveResult(archiveId)
          setArchiveId(null)
        }}
      />
    </div>
  )
}

const isLoose = (task: Task): boolean => !task.objectiveId && !task.resultId

function TasksTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = useAleph()
  const { toggle, execute, dialog } = useTaskCompletion()
  const actions = useTaskActions()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>()
  const [assigning, setAssigning] = useState<Task | undefined>()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [resultId, setResultId] = useState('')
  const [objectiveId, setObjectiveId] = useState('')
  const [stage, setStage] = useState<StageId | ''>('')
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [skillId, setSkillId] = useState('')
  const [before, setBefore] = useState('')

  const objectives = resultId ? pickerObjectives(state, resultId) : []
  const filterCount = [resultId, objectiveId, stage, status, skillId, before].filter(Boolean).length

  const filtered = useMemo(() => {
    return state.tasks
      .filter((task) => {
        if (taskResultStatus(state, task) === 'archived') return false
        if (resultId && task.resultId !== resultId) return false
        if (objectiveId && task.objectiveId !== objectiveId) return false
        if (stage && task.stage !== stage) return false
        if (status && task.status !== status) return false
        if (skillId && task.skillId !== skillId) return false
        if (before && (!task.dueAt || task.dueAt.slice(0, 10) > before)) return false
        return true
      })
      .sort((a, b) => {
        const al = isLoose(a) ? 0 : 1
        const bl = isLoose(b) ? 0 : 1
        if (al !== bl) return al - bl
        return a.importance - b.importance
      })
  }, [state, resultId, objectiveId, stage, status, skillId, before])

  const clear = () => {
    setResultId('')
    setObjectiveId('')
    setStage('')
    setStatus('')
    setSkillId('')
    setBefore('')
  }

  return (
    <div className="flex flex-col gap-3">
      {state.tasks.length > 0 ? (
        <>
          <Button onClick={() => setCreating(true)}>{t('planning.tasks.new')}</Button>
          <div className="flex items-center justify-between gap-2">
            <Button variant="secondary" onClick={() => setFiltersOpen(true)}>
              {t('planning.openFilters')}
              {filterCount > 0 ? ` · ${filterCount}` : ''}
            </Button>
            <p className="text-[13px] text-text-3">{t('planning.tasks.count', { count: filtered.length })}</p>
          </div>
        </>
      ) : null}
      {state.tasks.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={() => navigate('/')}>{t('planning.tasks.emptyCta')}</Button>
          }
        >
          {t('planning.tasks.empty')}
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={clear}>{t('planning.tasks.clearFilters')}</Button>
          }
        >
          {t('planning.tasks.emptyFiltered')}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((task) => (
            <li key={task.id}>
              <TaskRow
                task={task}
                onToggle={() => toggle(task)}
                onExecute={() => execute(task)}
                onOpen={() => setEditing(task)}
                onAssign={() => setAssigning(task)}
                onDelete={() => actions.requestDelete(task)}
                showProjection
              />
            </li>
          ))}
        </ul>
      )}
      {dialog}
      {actions.dialog}
      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('planning.tasks.filters')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={clear}>
              {t('planning.tasks.clearFilters')}
            </Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <Select
            value={resultId}
            onChange={(e) => {
              setResultId(e.target.value)
              setObjectiveId('')
            }}
          >
            <option value="">{t('planning.tasks.filterResult')}</option>
            {pickerResults(state).map((result) => (
              <option key={result.id} value={result.id}>
                {result.name}
              </option>
            ))}
          </Select>
          <Select value={objectiveId} onChange={(e) => setObjectiveId(e.target.value)}>
            <option value="">{t('planning.tasks.filterObjective')}</option>
            {objectives.map((objective) => (
              <option key={objective.id} value={objective.id}>
                {objective.name}
              </option>
            ))}
          </Select>
          <Select value={stage} onChange={(e) => setStage(e.target.value as StageId | '')}>
            <option value="">{t('planning.tasks.filterStage')}</option>
            {STAGE_ORDER.map((id) => (
              <option key={id} value={id}>
                {t(`stages.${id}.short`)}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus | '')}>
            <option value="">{t('planning.tasks.filterStatus')}</option>
            {(['pending', 'in_progress', 'done_on_time', 'done_late', 'cancelled'] as TaskStatus[]).map(
              (id) => (
                <option key={id} value={id}>
                  {t(`taskStatus.${id}`)}
                </option>
              ),
            )}
          </Select>
          <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
            <option value="">{t('planning.tasks.filterSkill')}</option>
            {state.skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skillName(t, skill)}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            aria-label={t('planning.tasks.filterDate')}
          />
        </div>
      </Sheet>
      <TaskFormSheet open={creating} collapsedMore onClose={() => setCreating(false)} />
      <TaskFormSheet
        open={Boolean(editing)}
        task={editing}
        moments={{
          onComplete: (tk) => toggle(tk),
          onExecute: (tk) => execute(tk),
          onReturn: (tk) => actions.back(tk),
        }}
        onClose={() => setEditing(undefined)}
      />
      <AssignSheet
        open={Boolean(assigning)}
        task={assigning}
        onClose={() => setAssigning(undefined)}
      />
    </div>
  )
}
