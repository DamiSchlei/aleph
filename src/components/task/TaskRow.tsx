import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Card, cx } from '@/components/ui/primitives'
import { useAleph } from '@/data/store'
import { objectiveById, resultById, skillById } from '@/data/selectors'
import { isTaskDone, projectReward } from '@/domain/economy'
import { formatDate, formatHours } from '@/i18n/format'
import { skillName, stageShort } from '@/i18n/labels'
import type { Task } from '@/domain/types'

export function TaskCheckbox({
  done,
  onToggle,
  label,
}: {
  done: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      className="flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors hover:bg-white/5"
    >
      <span
        className={cx(
          'flex size-6 items-center justify-center rounded-xl border-2 transition-colors',
          done ? 'border-mint bg-mint text-ink-950' : 'border-ink-600',
        )}
      >
        {done ? (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
    </button>
  )
}

export function TaskRow({
  task,
  onToggle,
  onOpen,
  handle,
  showContext = true,
  showProjection = false,
}: {
  task: Task
  onToggle: () => void
  onOpen?: () => void
  handle?: ReactNode
  showContext?: boolean
  showProjection?: boolean
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const done = isTaskDone(task.status)
  const skill = skillById(state, task.skillId)
  const result = resultById(state, task.resultId)
  const objective = objectiveById(state, task.objectiveId)
  const contextResult = result ?? resultById(state, objective?.resultId)
  const projection = projectReward(task, contextResult?.status === 'active')

  return (
    <Card className="flex items-start gap-1 p-2">
      <TaskCheckbox done={done} onToggle={onToggle} label={t('home.completeTask')} />
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className={cx(
          'min-w-0 flex-1 py-1.5 pr-1 text-left',
          onOpen && 'cursor-pointer rounded-xl transition-colors hover:bg-white/4',
        )}
      >
        <p
          className={cx(
            'text-[15px] leading-snug font-medium',
            done ? 'text-ink-400 line-through' : 'text-white',
          )}
        >
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {skill ? (
            <Badge>
              <span className="size-2 rounded-full" style={{ background: skill.color }} />
              {skillName(t, skill)}
            </Badge>
          ) : null}
          <Badge>{t('common.hours', { count: Number(formatHours(task.actualHours ?? task.estimatedHours, locale)) })}</Badge>
          <Badge>{t(`difficulty.${task.difficulty}`)}</Badge>
          {showContext && contextResult ? <Badge tone="accent">{contextResult.name}</Badge> : null}
          {showContext && objective ? <Badge tone="violet">{objective.name}</Badge> : null}
          {showContext ? <Badge>{stageShort(t, task.stage)}</Badge> : null}
          {task.dueAt && !done ? <Badge tone="amber">{formatDate(task.dueAt, locale)}</Badge> : null}
          {done ? (
            <Badge tone={task.status === 'done_on_time' ? 'mint' : 'rose'}>
              {t(`taskStatus.${task.status}`)}
            </Badge>
          ) : null}
          {task.status === 'cancelled' ? <Badge tone="rose">{t('taskStatus.cancelled')}</Badge> : null}
          {showProjection && !done ? (
            <Badge tone="mint">
              {t('planning.tasks.projected')} +{projection.xp} XP · +{projection.money} $
            </Badge>
          ) : null}
          {done && task.xpGranted !== undefined ? (
            <Badge tone="mint">
              +{task.xpGranted} XP · +{task.moneyGranted} $
            </Badge>
          ) : null}
        </div>
      </button>
      {handle}
    </Card>
  )
}
