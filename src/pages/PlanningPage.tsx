import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ResultFormSheet } from '@/components/planning/ResultForm'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { AssignSheet } from '@/components/task/AssignSheet'
import { TaskRow } from '@/components/task/TaskRow'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { SortableList } from '@/components/ui/SortableList'
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ProgressBar,
  Select,
} from '@/components/ui/primitives'
import { reorderResults } from '@/data/actions'
import { activeResults, resultHealth, resultProgress } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { MAX_OBJECTIVES_PER_RESULT } from '@/domain/limits'
import { STAGE_ORDER } from '@/domain/stage'
import { formatDate, formatHours } from '@/i18n/format'
import { skillName, stageShort } from '@/i18n/labels'
import type { StageId, Task, TaskStatus } from '@/domain/types'

type PlanningTab = 'results' | 'tasks'

const CHIP_KEYS = ['product', 'money', 'body'] as const

export function PlanningPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<PlanningTab>('results')

  return (
    <div className="flex flex-col gap-5 pt-4">
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
    </div>
  )
}

function ResultsTab() {
  const { t } = useTranslation()
  const state = useAleph()
  const results = activeResults(state)
  const [open, setOpen] = useState(false)
  const [seed, setSeed] = useState<string | undefined>()

  const openCreate = (name?: string) => {
    setSeed(name)
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] leading-relaxed text-ink-400">{t('planning.results.helper')}</p>
      <Button onClick={() => openCreate()}>{t('planning.results.new')}</Button>
      {results.length === 0 ? (
        <EmptyState
          action={
            <div className="flex max-w-sm flex-wrap justify-center gap-2">
              {CHIP_KEYS.map((key) => (
                <Chip key={key} onClick={() => openCreate(t(`planning.results.chips.${key}`))}>
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
            const progress = resultProgress(state, result.id)
            const health = resultHealth(state, result.id)
            return (
              <Card className="flex items-start gap-1 p-2">
                <Link to={`/planning/results/${result.id}`} className="min-w-0 flex-1 p-2">
                  <p className="text-[16px] font-semibold text-white">{result.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.targetDate ? <Badge tone="amber">{formatDate(result.targetDate, state.character.locale)}</Badge> : null}
                    <Badge tone="accent">
                      {t('planning.results.objectivesCount', {
                        count: progress.objectiveCount,
                        max: MAX_OBJECTIVES_PER_RESULT,
                      })}
                    </Badge>
                  </div>
                  <ProgressBar className="mt-3" ratio={progress.ratio} />
                  <p className="mt-2 text-[12px] text-ink-400">
                    {progress.tasksTotal === 0
                      ? t('planning.results.noTasks')
                      : t('planning.results.progress', {
                          done: progress.tasksDone,
                          total: progress.tasksTotal,
                        })}
                    {' · '}
                    {t('planning.results.hours', {
                      done: formatHours(progress.hoursDone, state.character.locale),
                      total: formatHours(progress.hoursEstimated, state.character.locale),
                    })}
                  </p>
                  <p className="mt-1 text-[12px] text-ink-400">
                    {STAGE_ORDER.map(
                      (stage) => `${stageShort(t, stage)} ${progress.objectivesByStage[stage]}`,
                    ).join(' · ')}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-200">
                    {t(health.key, health.params)}
                  </p>
                </Link>
                {handle}
              </Card>
            )
          }}
        </SortableList>
      )}
      <ResultFormSheet open={open} initialName={seed} onClose={() => setOpen(false)} />
    </div>
  )
}

const isLoose = (task: Task): boolean => !task.objectiveId && !task.resultId

function TasksTab() {
  const { t } = useTranslation()
  const state = useAleph()
  const { toggle, dialog } = useTaskCompletion()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>()
  const [assigning, setAssigning] = useState<Task | undefined>()
  const [resultId, setResultId] = useState('')
  const [objectiveId, setObjectiveId] = useState('')
  const [stage, setStage] = useState<StageId | ''>('')
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [skillId, setSkillId] = useState('')
  const [before, setBefore] = useState('')
  const [moreFilters, setMoreFilters] = useState(false)

  const objectives = state.objectives.filter((o) => !resultId || o.resultId === resultId)

  const filtered = useMemo(() => {
    return state.tasks
      .filter((task) => {
        if (resultId && task.resultId !== resultId) return false
        if (objectiveId && task.objectiveId !== objectiveId) return false
        if (stage && task.stage !== stage) return false
        if (status && task.status !== status) return false
        if (skillId && task.skillId !== skillId) return false
        if (before && (!task.dueAt || task.dueAt.slice(0, 10) > before)) return false
        return true
      })
      .sort((a, b) => {
        // Loose steps float to the top so they are easy to assign.
        const al = isLoose(a) ? 0 : 1
        const bl = isLoose(b) ? 0 : 1
        if (al !== bl) return al - bl
        return a.importance - b.importance
      })
  }, [state.tasks, resultId, objectiveId, stage, status, skillId, before])

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
      <Button onClick={() => setCreating(true)}>{t('planning.tasks.new')}</Button>
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={resultId}
          onChange={(e) => {
            setResultId(e.target.value)
            setObjectiveId('')
          }}
        >
          <option value="">{t('planning.tasks.filterResult')}</option>
          {state.results.map((result) => (
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
        <input
          type="date"
          value={before}
          onChange={(e) => setBefore(e.target.value)}
          aria-label={t('planning.tasks.filterDate')}
          className="min-h-11 w-full rounded-2xl border border-white/8 bg-ink-800/80 px-3.5 text-[15px]"
        />
      </div>
      {moreFilters ? (
        <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
          <option value="">{t('planning.tasks.filterSkill')}</option>
          {state.skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skillName(t, skill)}
            </option>
          ))}
        </Select>
      ) : null}
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="px-2" onClick={() => setMoreFilters((v) => !v)}>
          {t('planning.tasks.moreFilters')}
        </Button>
        <div className="flex items-center gap-2">
          <p className="text-[13px] text-ink-400">{t('planning.tasks.count', { count: filtered.length })}</p>
          <Button variant="ghost" onClick={clear}>
            {t('planning.tasks.clearFilters')}
          </Button>
        </div>
      </div>
      {state.tasks.length === 0 ? (
        <EmptyState>{t('planning.tasks.empty')}</EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState>{t('planning.tasks.emptyFiltered')}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((task) => (
            <li key={task.id}>
              <TaskRow
                task={task}
                onToggle={() => toggle(task)}
                onOpen={() => setEditing(task)}
                onAssign={() => setAssigning(task)}
                showProjection
              />
            </li>
          ))}
        </ul>
      )}
      {dialog}
      <TaskFormSheet open={creating} onClose={() => setCreating(false)} />
      <TaskFormSheet open={Boolean(editing)} task={editing} onClose={() => setEditing(undefined)} />
      <AssignSheet
        open={Boolean(assigning)}
        task={assigning}
        onClose={() => setAssigning(undefined)}
      />
    </div>
  )
}
