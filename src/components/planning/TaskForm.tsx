import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { JournalThread } from '@/components/journal/JournalThread'
import { Button, Chip, Field, Input, Select, Textarea } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { createTask, updateTask } from '@/data/actions'
import { objectivesOfResult } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { MIN_ESTIMATED_HOURS } from '@/domain/limits'
import { addDays, startOfWeek, toDayKey } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import type { Difficulty, Task } from '@/domain/types'

export interface TaskMoments {
  onComplete?: (task: Task) => void
  onExecute?: (task: Task) => void
  onReturn?: (task: Task) => void
}

interface TaskPreset {
  resultId?: string
  objectiveId?: string
  dueAt?: string
}

export function TaskFormSheet({
  open,
  onClose,
  task,
  preset,
  moments,
}: {
  open: boolean
  onClose: () => void
  task?: Task
  preset?: TaskPreset
  moments?: TaskMoments
}) {
  const { t } = useTranslation()
  const key = `${task?.id ?? 'new'}:${preset?.objectiveId ?? ''}:${open ? '1' : '0'}`
  return (
    <Sheet
      key={key}
      open={open}
      onClose={onClose}
      title={task ? t('planning.tasks.editTitle') : t('planning.tasks.createTitle')}
      footer={null}
    >
      <TaskFormBody task={task} preset={preset} moments={moments} onClose={onClose} />
    </Sheet>
  )
}

function todayKey(): string {
  return toDayKey(new Date())
}

/** End of the current week (Sunday), the target for the "this week" quick date. */
function weekEndKey(): string {
  return toDayKey(addDays(startOfWeek(new Date()), 6))
}

function TaskFormBody({
  task,
  preset,
  moments,
  onClose,
}: {
  task?: Task
  preset?: TaskPreset
  moments?: TaskMoments
  onClose: () => void
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [resultId, setResultId] = useState(task?.resultId ?? preset?.resultId ?? '')
  const [objectiveId, setObjectiveId] = useState(task?.objectiveId ?? preset?.objectiveId ?? '')
  const [hours, setHours] = useState(String(task?.estimatedHours ?? 1))
  const [difficulty, setDifficulty] = useState<Difficulty>(task?.difficulty ?? 'medium')
  const [dueAt, setDueAt] = useState(task?.dueAt?.slice(0, 10) ?? preset?.dueAt ?? '')
  const [pickDate, setPickDate] = useState(false)

  const objectives = useMemo(
    () => (resultId ? objectivesOfResult(state, resultId) : []),
    [resultId, state],
  )

  const today = todayKey()
  const weekEnd = weekEndKey()
  const showMoments = task && !isTaskDone(task.status) && moments

  const save = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    const estimatedHours = Math.max(MIN_ESTIMATED_HOURS, Number(hours) || 1)
    const payload = {
      title: trimmed,
      notes: notes.trim() || undefined,
      resultId: resultId || undefined,
      objectiveId: objectiveId || undefined,
      estimatedHours,
      difficulty,
      dueAt: dueAt || undefined,
      scheduledFor: dueAt || undefined,
    }
    if (task) updateTask(task.id, payload)
    else createTask(payload)
    onClose()
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label={t('common.title')}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('planning.tasks.titlePlaceholder')}
          autoFocus
        />
      </Field>
      <Field label={t('common.result')}>
        <Select
          value={resultId}
          onChange={(e) => {
            setResultId(e.target.value)
            setObjectiveId('')
          }}
        >
          <option value="">{t('common.unassigned')}</option>
          {state.results
            .filter((r) => r.status !== 'archived')
            .map((result) => (
              <option key={result.id} value={result.id}>
                {result.name}
              </option>
            ))}
        </Select>
      </Field>
      <Field label={t('common.objective')}>
        <Select
          value={objectiveId}
          onChange={(e) => setObjectiveId(e.target.value)}
          disabled={!resultId}
        >
          <option value="">{t('common.unassigned')}</option>
          {objectives.map((objective) => (
            <option key={objective.id} value={objective.id}>
              {objective.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('common.estimatedHours')}>
          <Input
            type="number"
            min={MIN_ESTIMATED_HOURS}
            step={0.25}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </Field>
        <Field label={t('common.difficulty')}>
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            <option value="low">{t('difficulty.low')}</option>
            <option value="medium">{t('difficulty.medium')}</option>
            <option value="high">{t('difficulty.high')}</option>
          </Select>
        </Field>
      </div>
      <Field label={`${t('common.dueDate')} (${t('common.optional')})`}>
        <div className="flex flex-wrap gap-2">
          <Chip
            active={!pickDate && dueAt === today}
            onClick={() => {
              setDueAt(today)
              setPickDate(false)
            }}
          >
            {t('common.today')}
          </Chip>
          <Chip
            active={!pickDate && dueAt === weekEnd}
            onClick={() => {
              setDueAt(weekEnd)
              setPickDate(false)
            }}
          >
            {t('planning.tasks.thisWeek')}
          </Chip>
          <Chip active={pickDate} onClick={() => setPickDate(true)}>
            {t('planning.tasks.pickDate')}
          </Chip>
          <Chip
            active={!pickDate && dueAt === ''}
            onClick={() => {
              setDueAt('')
              setPickDate(false)
            }}
          >
            {t('planning.tasks.noDate')}
          </Chip>
        </div>
        {pickDate ? (
          <Input
            type="date"
            className="mt-2"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        ) : null}
      </Field>
      <Field label={`${t('common.notes')} (${t('common.optional')})`}>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button className="flex-1" disabled={!title.trim()} onClick={save}>
          {t('common.save')}
        </Button>
      </div>

      {showMoments && task ? (
        <div className="flex flex-col gap-2 border-t border-white/6 pt-4">
          {task.stage === 'research' ? (
            <Button
              onClick={() => {
                moments?.onExecute?.(task)
                onClose()
              }}
            >
              {t('planning.tasks.execute')}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  moments?.onComplete?.(task)
                  onClose()
                }}
              >
                {t('planning.tasks.complete')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  moments?.onReturn?.(task)
                  onClose()
                }}
              >
                {t('planning.tasks.backToResearch')}
              </Button>
            </>
          )}
        </div>
      ) : null}

      {task ? <JournalThread parentType="task" parentId={task.id} /> : null}
    </div>
  )
}
