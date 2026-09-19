import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, cx } from '@/components/ui/primitives'
import { RowMenu } from '@/components/ui/RowMenu'
import { useAleph } from '@/data/store'
import { blockContext, objectiveById, resultById } from '@/data/selectors'
import { isTaskDone, projectReward } from '@/domain/economy'
import { formatDate, formatHours } from '@/i18n/format'
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
      className="flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors hover:bg-subtle"
    >
      <span
        className={cx(
          'flex size-[22px] items-center justify-center rounded-md border-2 transition-colors',
          done ? 'border-mint bg-mint text-white' : 'border-line-strong',
        )}
      >
        {done ? (
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
    </button>
  )
}

function RowAction({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-center min-h-11 rounded-2xl border border-line-strong bg-subtle px-3 text-[13px] whitespace-nowrap text-ink-2 transition-colors hover:bg-subtle"
    >
      {children}
    </button>
  )
}

export function TaskRow({
  task,
  onToggle,
  onOpen,
  onAssign,
  onExecute,
  onReturn,
  onDelete,
  handle,
  showContext = true,
  showProjection = false,
  hideCheckbox = false,
  className,
}: {
  task: Task
  onToggle: () => void
  onOpen?: () => void
  onAssign?: () => void
  onExecute?: () => void
  onReturn?: () => void
  onDelete?: () => void
  handle?: ReactNode
  showContext?: boolean
  showProjection?: boolean
  hideCheckbox?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const done = isTaskDone(task.status)
  const ctx = blockContext(state, task)
  const result = resultById(state, task.resultId)
  const objective = objectiveById(state, task.objectiveId)
  const contextResult = result ?? resultById(state, objective?.resultId)
  const projection = projectReward(task, contextResult?.status === 'active')
  const loose = !task.objectiveId && !task.resultId

  const canAssign = loose && !done && Boolean(onAssign)
  const canExecute = task.stage === 'research' && !done && Boolean(onExecute)
  const canReturn = task.stage === 'execution' && !done && Boolean(onReturn)

  const metaParts: string[] = [`${formatHours(task.actualHours ?? task.estimatedHours, locale)} h`]
  if (showContext) {
    if (loose) metaParts.push(t('planning.tasks.loose'))
    else if (contextResult?.name) metaParts.push(contextResult.name)
    if (objective?.name) metaParts.push(objective.name)
  }
  if (!loose && !done) metaParts.push(t(`stages.${task.stage}.short`))
  if (task.dueAt && !done) metaParts.push(formatDate(task.dueAt, locale))
  if (done) metaParts.push(t(`taskStatus.${task.status}`))
  if (task.status === 'cancelled') metaParts.push(t('taskStatus.cancelled'))
  if (showProjection && !done) {
    metaParts.push(`+${projection.xp} XP · +${projection.money} $`)
  }
  if (done && task.xpGranted !== undefined) {
    metaParts.push(`+${task.xpGranted} XP · +${task.moneyGranted} $`)
  }

  return (
    <div className={cx('relative flex overflow-hidden rounded-2xl border border-line bg-surface-2', className)}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: ctx.color }} />
      {hideCheckbox ? null : (
        <TaskCheckbox done={done} onToggle={onToggle} label={t('home.completeTask')} />
      )}
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className={cx(
          'min-h-11 min-w-0 flex-1 py-2.5 pr-1 text-left',
          hideCheckbox && 'pl-3',
          onOpen && 'cursor-pointer',
        )}
      >
        <p
          className={cx(
            'line-clamp-1 text-[15px] leading-snug font-medium',
            done ? 'text-ink-3 line-through' : 'text-ink',
          )}
        >
          {task.title}
        </p>
        <p className="mt-0.5 truncate text-[12px] leading-tight text-text-3">{metaParts.join(' · ')}</p>
      </button>
      {canExecute ? (
        <Button className="self-center shrink-0 px-3" onClick={onExecute!}>
          {t('planning.tasks.execute')}
        </Button>
      ) : null}
      {canReturn ? <RowAction onClick={onReturn!}>{t('planning.tasks.backToResearch')}</RowAction> : null}
      {canAssign ? (
        <RowAction onClick={onAssign!}>{t('planning.tasks.assignShort')}</RowAction>
      ) : null}
      {onDelete ? (
        <RowMenu items={[{ label: t('common.delete'), tone: 'danger', onClick: onDelete }]} />
      ) : null}
      {handle ? <div className="opacity-30">{handle}</div> : null}
    </div>
  )
}
