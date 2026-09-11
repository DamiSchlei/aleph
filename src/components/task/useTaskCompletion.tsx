import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Chip, Field, Input, Textarea } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { closeTask, executeTaskWithNote, reopenTask } from '@/data/actions'
import { resolveTaskSkillId } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { MIN_ESTIMATED_HOURS } from '@/domain/limits'
import { isTaskDone } from '@/domain/economy'
import { skillName } from '@/i18n/labels'
import type { Task } from '@/domain/types'

/**
 * Shared Home + Planning hook. Execute and close both require their sheet
 * fields; there is no mute skip. One comment lives on the close sheet.
 */
export function useTaskCompletion(): {
  execute: (task: Task) => void
  close: (task: Task) => void
  toggle: (task: Task) => void
  dialog: ReactNode
} {
  const state = useAleph()
  const { celebrate } = useFeedback()
  const { t } = useTranslation()
  const [executing, setExecuting] = useState<Task | null>(null)
  const [executeComment, setExecuteComment] = useState('')
  const [closing, setClosing] = useState<Task | null>(null)
  const [closeHours, setCloseHours] = useState('')
  const [closeComment, setCloseComment] = useState('')
  const [closeSkillId, setCloseSkillId] = useState('')

  const resetExecute = () => {
    setExecuting(null)
    setExecuteComment('')
  }

  const resetClose = () => {
    setClosing(null)
    setCloseHours('')
    setCloseComment('')
    setCloseSkillId('')
  }

  const execute = (task: Task) => {
    if (task.stage !== 'research' || isTaskDone(task.status)) return
    setExecuting(task)
    setExecuteComment('')
  }

  const close = (task: Task) => {
    if (isTaskDone(task.status)) return
    setClosing(task)
    setCloseHours(String(task.actualHours ?? task.estimatedHours))
    setCloseComment('')
    setCloseSkillId(resolveTaskSkillId(state, task) ?? '')
  }

  const toggle = (task: Task) => {
    if (isTaskDone(task.status)) {
      reopenTask(task.id)
      return
    }
    close(task)
  }

  const submitExecute = () => {
    if (!executing || !executeComment.trim()) return
    executeTaskWithNote(executing.id, executeComment)
    resetExecute()
  }

  const submitClose = () => {
    if (!closing) return
    const hours = Number(closeHours)
    if (!closeComment.trim() || !Number.isFinite(hours) || hours < MIN_ESTIMATED_HOURS) return
    const outcome = closeTask(closing.id, {
      actualHours: hours,
      comment: closeComment,
      skillId: closeSkillId || undefined,
    })
    if (outcome?.paid) celebrate(outcome)
    resetClose()
  }

  const hoursOk =
    Number.isFinite(Number(closeHours)) && Number(closeHours) >= MIN_ESTIMATED_HOURS
  const needsSkill = Boolean(closing) && !resolveTaskSkillId(state, closing!) && state.skills.length > 0

  const dialog = (
    <>
      <Sheet
        open={executing !== null}
        onClose={resetExecute}
        title={t('planning.tasks.executeTitle')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={resetExecute}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" disabled={!executeComment.trim()} onClick={submitExecute}>
              {t('planning.tasks.execute')}
            </Button>
          </div>
        }
      >
        <Field label={t('planning.tasks.executeComment')}>
          <Textarea
            rows={3}
            value={executeComment}
            onChange={(e) => setExecuteComment(e.target.value)}
            placeholder={t('planning.tasks.executeComment')}
            autoFocus
          />
        </Field>
      </Sheet>

      <Sheet
        open={closing !== null}
        onClose={resetClose}
        title={t('planning.tasks.closeTitle')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={resetClose}>
              {t('common.cancel')}
            </Button>
            <Button
              className="flex-1"
              disabled={!hoursOk || !closeComment.trim()}
              onClick={submitClose}
            >
              {t('planning.tasks.complete')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label={t('planning.tasks.closeHours')}>
            <Input
              type="number"
              min={MIN_ESTIMATED_HOURS}
              step={0.25}
              value={closeHours}
              onChange={(e) => setCloseHours(e.target.value)}
            />
          </Field>
          <Field label={t('planning.tasks.closeComment')}>
            <Textarea
              rows={3}
              value={closeComment}
              onChange={(e) => setCloseComment(e.target.value)}
              placeholder={t('planning.tasks.closeComment')}
            />
          </Field>
          {needsSkill ? (
            <div className="flex flex-wrap gap-2">
              {state.skills.map((skill) => (
                <Chip
                  key={skill.id}
                  active={closeSkillId === skill.id}
                  onClick={() => setCloseSkillId(skill.id)}
                >
                  {skillName(t, skill)}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </Sheet>
    </>
  )

  return { execute, close, toggle, dialog }
}
