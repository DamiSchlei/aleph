import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Chip } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { LiteraturePrompt } from '@/components/home/LiteraturePrompt'
import { completeTask, reopenTask } from '@/data/actions'
import { resolveTaskSkillId } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { isTaskDone } from '@/domain/economy'
import { skillName } from '@/i18n/labels'
import type { Task } from '@/domain/types'

/**
 * Single entry point for checking a task off. It pays the reward once and routes
 * XP to the resolved skill. When a task has no skill to inherit, it asks which
 * skill the work counts toward and remembers the answer on the task.
 */
export function useTaskCompletion(): {
  toggle: (task: Task, options?: { askLiterature?: boolean }) => void
  dialog: ReactNode
  literature: ReactNode
} {
  const state = useAleph()
  const { celebrate } = useFeedback()
  const { t } = useTranslation()
  const [asking, setAsking] = useState<Task | null>(null)
  const [askLiterature, setAskLiterature] = useState(false)
  const [literatureTaskId, setLiteratureTaskId] = useState<string | undefined>()

  const run = (taskId: string, skillId?: string, literature?: boolean) => {
    const outcome = completeTask(taskId, skillId ? { skillId } : undefined)
    if (outcome) celebrate(outcome)
    if (literature && outcome) setLiteratureTaskId(taskId)
  }

  const toggle = (task: Task, options?: { askLiterature?: boolean }) => {
    if (isTaskDone(task.status)) {
      reopenTask(task.id)
      return
    }
    const wantLiterature = Boolean(options?.askLiterature)
    const resolved = resolveTaskSkillId(state, task)
    if (!resolved && state.skills.length > 0) {
      setAsking(task)
      setAskLiterature(wantLiterature)
      return
    }
    run(task.id, undefined, wantLiterature)
  }

  const choose = (skillId?: string) => {
    if (asking) run(asking.id, skillId, askLiterature)
    setAsking(null)
    setAskLiterature(false)
  }

  const dialog = (
    <Sheet
      open={asking !== null}
      onClose={() => {
        setAsking(null)
        setAskLiterature(false)
      }}
      title={t('planning.tasks.skillPromptTitle')}
    >
      <div className="flex flex-col gap-4">
        <p className="text-[14px] leading-relaxed text-ink-400">
          {t('planning.tasks.skillPromptHint')}
        </p>
        <div className="flex flex-wrap gap-2">
          {state.skills.map((skill) => (
            <Chip key={skill.id} onClick={() => choose(skill.id)}>
              {skillName(t, skill)}
            </Chip>
          ))}
        </div>
        <Button variant="ghost" onClick={() => choose(undefined)}>
          {t('common.noSkill')}
        </Button>
      </div>
    </Sheet>
  )

  const literature = (
    <LiteraturePrompt
      open={Boolean(literatureTaskId)}
      taskId={literatureTaskId}
      kind="done"
      onClose={() => setLiteratureTaskId(undefined)}
    />
  )

  return { toggle, dialog, literature }
}
