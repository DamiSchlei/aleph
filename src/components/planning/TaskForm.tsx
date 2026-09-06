import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { JournalThread } from '@/components/journal/JournalThread'
import { Button, Chip, Field, Input, Select, Textarea } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { createTask, updateTask } from '@/data/actions'
import { objectivesOfResult } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { STAGE_ORDER, openedStages } from '@/domain/stage'
import { MIN_ESTIMATED_HOURS } from '@/domain/limits'
import { addDays, startOfWeek, toDayKey } from '@/domain/dates'
import type { Difficulty, StageId, Task } from '@/domain/types'

export function TaskFormSheet({
  open,
  onClose,
  task,
  preset,
}: {
  open: boolean
  onClose: () => void
  task?: Task
  preset?: {
    resultId?: string
    objectiveId?: string
    stage?: StageId
    dueAt?: string
  }
}) {
  const { t } = useTranslation()
  const key = `${task?.id ?? 'new'}:${preset?.objectiveId ?? ''}:${preset?.stage ?? ''}:${open ? '1' : '0'}`
  return (
    <Sheet
      key={key}
      open={open}
      onClose={onClose}
      title={task ? t('planning.tasks.editTitle') : t('planning.tasks.createTitle')}
      footer={null}
    >
      <TaskFormBody task={task} preset={preset} onClose={onClose} />
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
  onClose,
}: {
  task?: Task
  preset?: {
    resultId?: string
    objectiveId?: string
    stage?: StageId
    dueAt?: string
  }
  onClose: () => void
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [resultId, setResultId] = useState(task?.resultId ?? preset?.resultId ?? '')
  const [objectiveId, setObjectiveId] = useState(task?.objectiveId ?? preset?.objectiveId ?? '')
  const [stage, setStage] = useState<StageId>(task?.stage ?? preset?.stage ?? 'research')
  const [hours, setHours] = useState(String(task?.estimatedHours ?? 1))
  const [difficulty, setDifficulty] = useState<Difficulty>(task?.difficulty ?? 'medium')
  const [dueAt, setDueAt] = useState(task?.dueAt?.slice(0, 10) ?? preset?.dueAt ?? '')
  const [pickDate, setPickDate] = useState(false)

  const objectives = useMemo(
    () => (resultId ? objectivesOfResult(state, resultId) : []),
    [resultId, state],
  )
  const selectedObjective = objectives.find((o) => o.id === objectiveId)
  const allowedStages = selectedObjective ? openedStages(selectedObjective.currentStage) : STAGE_ORDER

  const today = todayKey()
  const weekEnd = weekEndKey()

  const save = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    const estimatedHours = Math.max(MIN_ESTIMATED_HOURS, Number(hours) || 1)
    const payload = {
      title: trimmed,
      notes: notes.trim() || undefined,
      resultId: resultId || undefined,
      objectiveId: objectiveId || undefined,
      stage,
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
          onChange={(e) => {
            const next = e.target.value
            setObjectiveId(next)
            const obj = objectives.find((o) => o.id === next)
            if (obj && !openedStages(obj.currentStage).includes(stage)) {
              setStage(obj.currentStage)
            }
          }}
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
      <Field label={t('common.stage')}>
        <Select value={stage} onChange={(e) => setStage(e.target.value as StageId)}>
          {allowedStages.map((id) => (
            <option key={id} value={id}>
              {t(`stages.${id}.name`)}
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
          {dueAt ? (
            <Chip
              onClick={() => {
                setDueAt('')
                setPickDate(false)
              }}
            >
              {t('planning.tasks.noDate')}
            </Chip>
          ) : null}
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
      {task ? <JournalThread parentType="task" parentId={task.id} /> : null}
    </div>
  )
}
