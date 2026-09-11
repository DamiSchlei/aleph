import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ResultCard } from '@/components/planning/ResultCard'
import { ResultFormSheet } from '@/components/planning/ResultForm'
import { TaskFiltersSheet, type TaskFilters } from '@/components/planning/TaskFiltersSheet'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { AssignSheet } from '@/components/task/AssignSheet'
import { TaskRow } from '@/components/task/TaskRow'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { useTaskActions } from '@/components/task/useTaskActions'
import { SortableList } from '@/components/ui/SortableList'
import {
  Button,
  Chip,
  EmptyState,
  Page,
} from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { reorderResults, restoreResult } from '@/data/actions'
import {
  activeResults,
  attendingResults,
  leastActiveAttending,
  taskResultStatus,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { shouldSoftWarnActiveResults } from '@/domain/limits'
import type { Task } from '@/domain/types'

type PlanningTab = 'results' | 'tasks'

const CHIP_KEYS = ['product', 'money', 'body'] as const

const EMPTY_FILTERS: TaskFilters = {
  resultId: '',
  objectiveId: '',
  stage: '',
  status: '',
  skillId: '',
  before: '',
}

export function PlanningPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<PlanningTab>('results')

  return (
    <Page className="flex flex-col gap-5 pt-4">
      <header>
        <h1 className="text-2xl font-semibold text-white">{t('planning.title')}</h1>
        <p className="mt-1 text-[15px] leading-relaxed text-ink-400">{t('planning.subtitle')}</p>
      </header>
      <div className="flex gap-2">
        <Chip active={tab === 'results'} onClick={() => setTab('results')}>
          {t('planning.tabs.results')}
        </Chip>
        <Chip active={tab === 'tasks'} onClick={() => setTab('tasks')}>
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
  const results = activeResults(state)
  const archived = state.results.filter((r) => r.status === 'archived')
  const attendingCount = attendingResults(state).length
  const [open, setOpen] = useState(false)
  const [seed, setSeed] = useState<string | undefined>()
  const [showArchived, setShowArchived] = useState(false)
  const [capOpen, setCapOpen] = useState(false)

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
    <div className="flex flex-col gap-4">
      <p className="text-[14px] leading-relaxed text-ink-400">{t('planning.results.helper')}</p>
      {results.length === 0 ? (
        <EmptyState
          action={
            <div className="flex max-w-sm flex-wrap justify-center gap-2">
              {CHIP_KEYS.map((key) => (
                <Chip key={key} onClick={() => requestCreate(t(`planning.results.chips.${key}`))}>
                  {t(`planning.results.chips.${key}`)}
                </Chip>
              ))}
            </div>
          }
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
            return <ResultCard result={result} handle={handle} />
          }}
        </SortableList>
      )}

      <button
        type="button"
        onClick={() => requestCreate()}
        className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-transparent px-4 py-6 text-[15px] text-ink-400 transition-colors hover:border-accent/40 hover:text-ink-200"
      >
        <span className="text-2xl leading-none text-accent">+</span>
        {t('planning.results.new')}
      </button>

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
                  className="flex items-center justify-between gap-2 rounded-2xl border border-white/8 bg-ink-900 px-3 py-2"
                >
                  <Link to={`/planning/results/${result.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-ink-200">{result.name}</p>
                    <p className="text-[12px] text-ink-400">{t('resultStatus.archived')}</p>
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
    </div>
  )
}

const isLoose = (task: Task): boolean => !task.objectiveId && !task.resultId

function TasksTab() {
  const { t } = useTranslation()
  const state = useAleph()
  const { toggle, dialog } = useTaskCompletion()
  const actions = useTaskActions()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>()
  const [assigning, setAssigning] = useState<Task | undefined>()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS)

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const filtered = useMemo(() => {
    return state.tasks
      .filter((task) => {
        if (taskResultStatus(state, task) === 'archived') return false
        if (filters.resultId && task.resultId !== filters.resultId) return false
        if (filters.objectiveId && task.objectiveId !== filters.objectiveId) return false
        if (filters.stage && task.stage !== filters.stage) return false
        if (filters.status && task.status !== filters.status) return false
        if (filters.skillId && task.skillId !== filters.skillId) return false
        if (filters.before && (!task.dueAt || task.dueAt.slice(0, 10) > filters.before)) return false
        return true
      })
      .sort((a, b) => {
        const al = isLoose(a) ? 0 : 1
        const bl = isLoose(b) ? 0 : 1
        if (al !== bl) return al - bl
        return a.importance - b.importance
      })
  }, [state, filters])

  const looseTasks = filtered.filter(isLoose)
  const assignedTasks = filtered.filter((task) => !isLoose(task))

  const patchFilters = (patch: Partial<TaskFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={() => setCreating(true)}>{t('planning.tasks.new')}</Button>
      <div className="flex items-center justify-between gap-2">
        <Chip active={activeFilterCount > 0} onClick={() => setFiltersOpen(true)}>
          {t('planning.openFilters')}
          {activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
        </Chip>
        <p className="text-[13px] text-ink-400">{t('planning.tasks.count', { count: filtered.length })}</p>
      </div>
      {state.tasks.length === 0 ? (
        <EmptyState>{t('planning.tasks.empty')}</EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState>{t('planning.tasks.emptyFiltered')}</EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {looseTasks.length > 0 ? (
            <section className="border-t-2 border-amber/40 pt-3">
              <p className="mb-2 text-[12px] font-semibold tracking-[0.12em] text-amber uppercase">
                {t('planning.tasks.loose')}
              </p>
              <ul className="flex flex-col gap-2">
                {looseTasks.map((task) => (
                  <li key={task.id}>
                    <TaskRow
                      task={task}
                      onToggle={() => toggle(task)}
                      onOpen={() => setEditing(task)}
                      onAssign={() => setAssigning(task)}
                      onDelete={() => actions.requestDelete(task)}
                      showProjection
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {assignedTasks.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {assignedTasks.map((task) => (
                <li key={task.id}>
                  <TaskRow
                    task={task}
                    onToggle={() => toggle(task)}
                    onOpen={() => setEditing(task)}
                    onAssign={() => setAssigning(task)}
                    onDelete={() => actions.requestDelete(task)}
                    showProjection
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
      {dialog}
      {actions.dialog}
      <TaskFormSheet open={creating} onClose={() => setCreating(false)} />
      <TaskFormSheet
        open={Boolean(editing)}
        task={editing}
        moments={{
          onComplete: (tk) => toggle(tk),
          onExecute: (tk) => actions.execute(tk),
          onReturn: (tk) => actions.back(tk),
        }}
        onClose={() => setEditing(undefined)}
      />
      <AssignSheet
        open={Boolean(assigning)}
        task={assigning}
        onClose={() => setAssigning(undefined)}
      />
      <TaskFiltersSheet
        open={filtersOpen}
        filters={filters}
        onChange={patchFilters}
        onClose={() => setFiltersOpen(false)}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />
    </div>
  )
}
