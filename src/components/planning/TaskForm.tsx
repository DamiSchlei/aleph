import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { JournalThread } from '@/components/journal/JournalThread'
import { TerrainChips } from '@/components/task/TerrainChips'
import { Button, Chip, Field, Input, Select, Textarea, cx } from '@/components/ui/primitives'
import { ConfirmDialog, Sheet } from '@/components/ui/Sheet'
import { addComment, createTask, createTaskSeries, deleteTask, updateTask } from '@/data/actions'
import { pickerObjectives, pickerResults } from '@/data/selectors'
import { newId, useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { MAX_CHECKLIST_ITEMS, MAX_SERIES_BLOCKS, MIN_ESTIMATED_HOURS } from '@/domain/limits'
import { addDays, isoWeekday, seriesDayKeys, startOfWeek, toDayKey } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { skillName } from '@/i18n/labels'
import type { Difficulty, Task, TaskCheckItem, Terrain } from '@/domain/types'

const ISO_WEEKDAYS = [
  { iso: 1, key: 'mon' },
  { iso: 2, key: 'tue' },
  { iso: 3, key: 'wed' },
  { iso: 4, key: 'thu' },
  { iso: 5, key: 'fri' },
  { iso: 6, key: 'sat' },
  { iso: 7, key: 'sun' },
] as const

export interface TaskMoments {
  onComplete?: (task: Task) => void
  onExecute?: (task: Task) => void
  onReturn?: (task: Task) => void
}

interface TaskPreset {
  resultId?: string
  objectiveId?: string
  dueAt?: string
  scheduledStart?: string
  scheduledEnd?: string
}

export function TaskFormSheet({
  open,
  onClose,
  task,
  preset,
  moments,
  blockedPrompt = false,
  scoped = false,
  initialTitle,
  collapsedMore = true,
}: {
  open: boolean
  onClose: () => void
  task?: Task
  preset?: TaskPreset
  moments?: TaskMoments
  blockedPrompt?: boolean
  scoped?: boolean
  /** Prefill for composer create. */
  initialTitle?: string
  /** Start with Más opciones collapsed (default true). */
  collapsedMore?: boolean
}) {
  const { t } = useTranslation()
  const key = `${task?.id ?? 'new'}:${preset?.objectiveId ?? ''}:${initialTitle ?? ''}:${open ? '1' : '0'}`
  return (
    <Sheet
      key={key}
      open={open}
      onClose={onClose}
      title={task ? t('taskEdit.title') : t('planning.tasks.createTitle')}
      footer={null}
    >
      <TaskFormBody
        task={task}
        preset={preset}
        moments={moments}
        blockedPrompt={blockedPrompt}
        scoped={scoped}
        initialTitle={initialTitle}
        collapsedMore={collapsedMore}
        onClose={onClose}
      />
    </Sheet>
  )
}

function todayKey(): string {
  return toDayKey(new Date())
}

function weekEndKey(): string {
  return toDayKey(addDays(startOfWeek(new Date()), 6))
}

function TaskFormBody({
  task,
  preset,
  moments,
  blockedPrompt,
  scoped,
  initialTitle,
  collapsedMore,
  onClose,
}: {
  task?: Task
  preset?: TaskPreset
  moments?: TaskMoments
  blockedPrompt?: boolean
  scoped?: boolean
  initialTitle?: string
  collapsedMore?: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const { notify } = useFeedback()
  const [title, setTitle] = useState(task?.title ?? initialTitle ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [resultId, setResultId] = useState(task?.resultId ?? preset?.resultId ?? '')
  const [objectiveId, setObjectiveId] = useState(task?.objectiveId ?? preset?.objectiveId ?? '')
  const [skillId, setSkillId] = useState(task?.skillId ?? '')
  const [terrain, setTerrain] = useState<Terrain | undefined>(task?.terrain)
  const [hours, setHours] = useState(String(task?.estimatedHours ?? 1))
  const [difficulty, setDifficulty] = useState<Difficulty>(task?.difficulty ?? 'medium')
  const [dueAt, setDueAt] = useState(task?.dueAt?.slice(0, 10) ?? preset?.dueAt ?? '')
  const [pickDate, setPickDate] = useState(false)
  const [doneCheck, setDoneCheck] = useState(task?.doneCheck ?? '')
  const [checklist, setChecklist] = useState<TaskCheckItem[]>(task?.checklist ?? [])
  const [referenceUrl, setReferenceUrl] = useState(task?.referenceUrl ?? '')
  const [blockedNote, setBlockedNote] = useState('')
  const [asSeries, setAsSeries] = useState(false)
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [horizon, setHorizon] = useState<'week' | 'month'>('week')
  const [moreOpen, setMoreOpen] = useState(!collapsedMore)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const objectives = useMemo(
    () => (resultId ? pickerObjectives(state, resultId) : []),
    [resultId, state],
  )

  const today = todayKey()
  const weekEnd = weekEndKey()
  const showMoments = task && !isTaskDone(task.status) && moments
  const seriesHours = Math.max(MIN_ESTIMATED_HOURS, Number(hours) || 1)
  const seriesDates = asSeries && !task ? seriesDayKeys(weekdays, horizon, new Date(), MAX_SERIES_BLOCKS) : []
  const seriesWouldOverflow =
    asSeries && !task && seriesDayKeys(weekdays, horizon, new Date(), MAX_SERIES_BLOCKS + 1).length > MAX_SERIES_BLOCKS
  const canSave =
    Boolean(title.trim()) &&
    (!asSeries || Boolean(task) || seriesDates.length > 0) &&
    (Boolean(task) || Boolean(terrain))
  const checklistDone = checklist.filter((item) => item.done).length

  const toggleWeekday = (iso: number) => {
    setWeekdays((current) =>
      current.includes(iso) ? current.filter((day) => day !== iso) : [...current, iso].sort((a, b) => a - b),
    )
  }

  const save = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    if (!task && !terrain) return
    const estimatedHours = Math.max(MIN_ESTIMATED_HOURS, Number(hours) || 1)
    const payload = {
      title: trimmed,
      notes: notes.trim() || undefined,
      resultId: resultId || undefined,
      objectiveId: objectiveId || undefined,
      skillId: skillId || undefined,
      terrain,
      estimatedHours,
      difficulty,
      dueAt: dueAt || undefined,
      scheduledFor: dueAt || undefined,
      scheduledStart: preset?.scheduledStart ?? task?.scheduledStart,
      scheduledEnd: preset?.scheduledEnd ?? task?.scheduledEnd,
      doneCheck: doneCheck.trim() || undefined,
      checklist: checklist.filter((item) => item.text.trim()).map((item) => ({
        ...item,
        text: item.text.trim(),
      })),
      referenceUrl: referenceUrl.trim() || undefined,
    }
    if (task) {
      updateTask(task.id, payload)
    } else if (asSeries) {
      if (seriesDates.length === 0) return
      createTaskSeries({
        ...payload,
        weekdays,
        hoursPerBlock: estimatedHours,
        horizon,
      })
    } else {
      createTask(payload)
    }
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

      <TerrainChips value={terrain} onChange={setTerrain} />

      <div className="grid grid-cols-2 gap-3">
        <Field label={t('taskEdit.hours')}>
          <Input
            type="number"
            min={MIN_ESTIMATED_HOURS}
            step={0.25}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </Field>
        <Field label={t('taskEdit.difficulty')}>
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            <option value="low">{t('difficulty.low')}</option>
            <option value="medium">{t('difficulty.medium')}</option>
            <option value="high">{t('difficulty.high')}</option>
          </Select>
        </Field>
      </div>

      <button
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        className="flex min-h-11 items-center justify-between rounded-2xl border border-line-strong bg-subtle px-3.5 text-[14px] text-text-2"
      >
        <span>{t('taskEdit.moreOptions')}</span>
        <span className="flex items-center gap-2 text-text-3">
          {checklist.length > 0 ? (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent">
              {checklistDone}/{checklist.length}
            </span>
          ) : null}
          <span className={cx('transition-transform', moreOpen && 'rotate-180')}>▾</span>
        </span>
      </button>

      {moreOpen ? (
        <div className="flex flex-col gap-4">
          {scoped ? null : (
            <>
              <Field label={t('taskEdit.result')}>
                <Select
                  value={resultId}
                  onChange={(e) => {
                    setResultId(e.target.value)
                    setObjectiveId('')
                  }}
                >
                  <option value="">{t('common.unassigned')}</option>
                  {pickerResults(state).map((result) => (
                    <option key={result.id} value={result.id}>
                      {result.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('taskEdit.objective')}>
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
            </>
          )}

          <Field label={t('taskEdit.skill')}>
            <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
              <option value="">{t('common.noSkill')}</option>
              {state.skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skillName(t, skill)}
                </option>
              ))}
            </Select>
          </Field>

          {task ? (
            task.seriesId && task.dueAt ? (
              <p className="text-[13px] text-text-3">{t('planning.tasks.seriesPart', { date: task.dueAt })}</p>
            ) : null
          ) : (
            <Field label={t('planning.tasks.seriesTitle')} hint={t('planning.tasks.seriesHint')}>
              <Chip
                active={asSeries}
                onClick={() => {
                  if (asSeries) {
                    setAsSeries(false)
                    return
                  }
                  setAsSeries(true)
                  setWeekdays((current) => (current.length > 0 ? current : [isoWeekday(new Date())]))
                }}
              >
                {t('planning.tasks.seriesTitle')}
              </Chip>
              {asSeries ? (
                <>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ISO_WEEKDAYS.map((day) => (
                      <Chip
                        key={day.iso}
                        active={weekdays.includes(day.iso)}
                        onClick={() => toggleWeekday(day.iso)}
                      >
                        {t(`weekdays.${day.key}`)}
                      </Chip>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Chip active={horizon === 'week'} onClick={() => setHorizon('week')}>
                      {t('planning.tasks.seriesWeek')}
                    </Chip>
                    <Chip active={horizon === 'month'} onClick={() => setHorizon('month')}>
                      {t('planning.tasks.seriesMonth')}
                    </Chip>
                  </div>
                  <p className="mt-2 text-[13px] text-text-2">
                    {t('planning.tasks.seriesPreview', {
                      count: seriesDates.length,
                      hours: seriesHours,
                    })}
                  </p>
                  {seriesWouldOverflow ? (
                    <p className="mt-1 text-[13px] text-amber">{t('planning.tasks.seriesCapped')}</p>
                  ) : null}
                </>
              ) : null}
            </Field>
          )}

          {asSeries && !task ? null : (
            <Field label={t('taskEdit.date')}>
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
          )}

          <Field label={`${t('common.notes')} (${t('common.optional')})`}>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Field label={`${t('planning.tasks.doneCheck')} (${t('common.optional')})`}>
            <Input
              value={doneCheck}
              onChange={(e) => setDoneCheck(e.target.value)}
              placeholder={t('planning.tasks.doneCheckPlaceholder')}
            />
          </Field>
          <Field label={t('taskEdit.checklist')}>
            <ul className="flex flex-col gap-2">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      setChecklist((current) =>
                        current.map((entry) =>
                          entry.id === item.id ? { ...entry, done: !entry.done } : entry,
                        ),
                      )
                    }
                    className="size-5 accent-mint"
                  />
                  <Input
                    value={item.text}
                    onChange={(e) =>
                      setChecklist((current) =>
                        current.map((entry) =>
                          entry.id === item.id ? { ...entry, text: e.target.value } : entry,
                        ),
                      )
                    }
                  />
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              className="mt-2"
              onClick={() => {
                if (checklist.length >= MAX_CHECKLIST_ITEMS) {
                  notify(t('planning.tasks.checklistLimit'))
                  return
                }
                setChecklist((current) => [...current, { id: newId('check'), text: '', done: false }])
              }}
            >
              {t('planning.tasks.checklistAdd')}
            </Button>
          </Field>
          <Field label={`${t('planning.tasks.referenceUrl')} (${t('common.optional')})`}>
            <Input
              type="url"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder={t('planning.tasks.referenceUrlPlaceholder')}
            />
          </Field>
        </div>
      ) : null}

      {blockedPrompt && task ? (
        <Field label={t('taskEdit.blockedPrompt')}>
          <div className="flex gap-2">
            <Textarea
              rows={2}
              value={blockedNote}
              onChange={(e) => setBlockedNote(e.target.value)}
              placeholder={t('taskEdit.blockedPlaceholder')}
              className="flex-1"
            />
            <Button
              variant="secondary"
              className="self-end"
              disabled={!blockedNote.trim()}
              onClick={() => {
                if (addComment('task', task.id, blockedNote)) setBlockedNote('')
              }}
            >
              {t('journal.post')}
            </Button>
          </div>
        </Field>
      ) : null}

      <div className="flex gap-2 pt-2">
        {task ? (
          <Button variant="danger" className="flex-1" onClick={() => setDeleteOpen(true)}>
            {t('taskEdit.delete')}
          </Button>
        ) : (
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        )}
        <Button className="flex-1" disabled={!canSave} onClick={save}>
          {task ? t('taskEdit.save') : t('common.save')}
        </Button>
      </div>

      {showMoments && task ? (
        <div className="flex flex-col gap-2 border-t border-line pt-4">
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

      <ConfirmDialog
        open={deleteOpen}
        title={t('common.delete')}
        tone="danger"
        message={t('planning.tasks.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (task) deleteTask(task.id)
          setDeleteOpen(false)
          onClose()
        }}
      />
    </div>
  )
}
