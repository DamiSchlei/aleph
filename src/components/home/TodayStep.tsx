import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/primitives'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { featuredAgendaTask, isTaskOverdue, objectiveById, resultById } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatHours } from '@/i18n/format'
import { isTaskDone } from '@/domain/economy'
import type { Task } from '@/domain/types'

export const TODAY_STEP_CLASS =
  'bg-surface-2 border border-accent/20 p-5 rounded-[20px]'

export function TodayStep() {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const { toggle, dialog: completionDialog } = useTaskCompletion()
  const [editing, setEditing] = useState<Task | undefined>()
  const task = featuredAgendaTask(state, 'today')
  const objective = task?.objectiveId ? objectiveById(state, task.objectiveId) : undefined
  const result = task ? resultById(state, task.resultId) ?? resultById(state, objective?.resultId) : undefined
  const hours = task
    ? t('common.hours', { count: Number(formatHours(task.actualHours ?? task.estimatedHours, locale)) })
    : null
  const meta = task ? [hours, result?.name].filter(Boolean).join(' · ') : null

  return (
    <section className={TODAY_STEP_CLASS}>
      <p className="text-[12px] text-accent">{t('home.stepToday')}</p>
      {task ? (
        <>
          <h2 className="mt-2 text-[18px] font-medium leading-snug text-white">{task.title}</h2>
          {meta ? <p className="mt-1 text-[13px] text-text-3">{meta}</p> : null}
          <div className="mt-4 flex gap-2">
            <Button className="flex-1" onClick={() => toggle(task)}>
              {t('home.completeCta')}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(task)}>
              {t('home.moveCta')}
            </Button>
          </div>
        </>
      ) : (
        <p className="mt-2 text-[15px] leading-relaxed text-text-2">{t('home.stepTodayEmpty')}</p>
      )}
      {completionDialog}
      <TaskFormSheet
        open={Boolean(editing)}
        task={editing}
        blockedPrompt={editing ? isTaskOverdue(editing) && !isTaskDone(editing.status) : false}
        onClose={() => setEditing(undefined)}
      />
    </section>
  )
}
