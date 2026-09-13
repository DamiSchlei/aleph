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

export function TodayStep() {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const { toggle, dialog: completionDialog } = useTaskCompletion()
  const [editing, setEditing] = useState<Task | undefined>()
  const task = featuredAgendaTask(state, 'today')
  const objective = task?.objectiveId ? objectiveById(state, task.objectiveId) : undefined
  const result = task
    ? (resultById(state, task.resultId) ?? resultById(state, objective?.resultId))
    : undefined
  const hours = task
    ? t('common.hours', {
        count: formatHours(task.actualHours ?? task.estimatedHours ?? 0, locale),
      })
    : null
  const meta = task ? [hours, result?.name].filter(Boolean).join(' · ') : null

  const focusComposer = () => {
    document.getElementById('home-composer-input')?.focus()
    document
      .getElementById('home-composer-input')
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  return (
    <section className="rounded-[20px] border border-white/12 bg-surface px-5 py-6">
      {task ? (
        <>
          <p className="text-center text-[13px] font-medium text-accent">
            {t('home.stepTodayTitle')}
          </p>
          <h2 className="mt-3 text-center text-[20px] font-semibold leading-snug text-white">
            {task.title}
          </h2>
          {meta ? (
            <p className="mt-2 text-center text-[13px] text-text-3">{meta}</p>
          ) : null}
          <div className="mt-5 flex gap-2">
            <Button className="flex-1 rounded-full" onClick={() => toggle(task)}>
              {t('home.completeCta')}
            </Button>
            <Button
              variant="secondary"
              className="flex-1 rounded-full"
              onClick={() => setEditing(task)}
            >
              {t('home.moveCta')}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-ink-800 text-accent">
            <BulbIcon />
          </span>
          <p className="mt-4 text-[15px] font-semibold text-accent">{t('home.stepTodayTitle')}</p>
          <p className="mt-2 max-w-[16rem] text-[15px] leading-relaxed text-white">
            {t('home.stepTodayEmpty')}
          </p>
          <Button className="mt-5 w-full rounded-full" onClick={focusComposer}>
            {t('home.stepTodayCta')}
          </Button>
        </div>
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

function BulbIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.8c.6.5 1 1.2 1.1 2V17h4.8v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
