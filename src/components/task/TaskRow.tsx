import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, cx } from '@/components/ui/primitives'
import { RowMenu } from '@/components/ui/RowMenu'
import { useAleph } from '@/data/store'
import { objectiveById, resultById, skillById } from '@/data/selectors'
import { isTaskDone, projectReward } from '@/domain/economy'
import { formatDate, formatHours } from '@/i18n/format'
import { skillName } from '@/i18n/labels'
import type { Task } from '@/domain/types'

export function TaskCheckbox({
  done,
  onToggle,
  label,
  compact = false,
}: {
  done: boolean
  onToggle: () => void
  label: string
  compact?: boolean
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      className={cx(
        'flex shrink-0 items-center justify-center rounded-2xl transition-colors hover:bg-white/5',
        compact ? 'size-8' : 'size-11',
      )}
    >
      <span
        className={cx(
          'flex items-center justify-center border transition-colors',
          compact ? 'size-5 rounded-full border' : 'size-6 rounded-xl border-2',
          done ? 'border-mint bg-mint text-ink-950' : 'border-text-3',
        )}
      >
        {done ? (
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
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
      className="self-center min-h-11 rounded-2xl border border-white/10 bg-white/4 px-3 text-[13px] whitespace-nowrap text-ink-200 transition-colors hover:bg-white/8"
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
  density = 'full',
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
  density?: 'full' | 'home'
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
  const loose = !task.objectiveId && !task.resultId

  const canAssign = loose && !done && Boolean(onAssign)
  const canExecute = task.stage === 'research' && !done && Boolean(onExecute)
  const canReturn = task.stage === 'execution' && !done && Boolean(onReturn)
  const home = density === 'home'
  const hoursLabel = formatHours(task.actualHours ?? task.estimatedHours, locale)

  if (home) {
    return (
      <div className="surface-row flex min-h-11 items-center rounded-2xl px-3 py-2.5">
        <TaskCheckbox
          done={done}
          onToggle={onToggle}
          label={t('home.completeTask')}
          compact
        />
        <button
          type="button"
          onClick={onOpen}
          disabled={!onOpen}
          className="min-w-0 flex-1 px-2 text-left"
        >
          <p className={cx('truncate text-[14px] font-medium', done ? 'text-text-3 line-through' : 'text-white')}>
            {task.title}
          </p>
        </button>
        <span className="shrink-0 text-[12px] text-text-3">{hoursLabel}</span>
        {handle}
      </div>
    )
  }

  return (
    <Card className="flex items-start gap-1 p-2">
      {hideCheckbox ? null : (
        <TaskCheckbox done={done} onToggle={onToggle} label={t('home.completeTask')} />
      )}
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className={cx(
          'min-w-0 flex-1 py-1.5 pr-1 text-left',
          hideCheckbox && 'pl-2',
          onOpen && 'cursor-pointer rounded-xl transition-colors hover:bg-white/4',
        )}
      >
        <p
          className={cx(
            'text-[15px] leading-snug font-medium',
            done ? 'text-text-3 line-through' : 'text-white',
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
          {showContext && loose ? <Badge tone="amber">{t('planning.tasks.loose')}</Badge> : null}
          {showContext && !loose && !done ? (
            <Badge tone={task.stage === 'execution' ? 'mint' : 'neutral'}>
              {t(`moments.${task.stage}`)}
            </Badge>
          ) : null}
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
      {canExecute ? (
        <Button className="self-center shrink-0 px-3" onClick={onExecute!}>
          {t('planning.tasks.execute')}
        </Button>
      ) : null}
      {canReturn ? <RowAction onClick={onReturn!}>{t('planning.tasks.backToResearch')}</RowAction> : null}
      {canAssign ? <RowAction onClick={onAssign!}>{t('planning.tasks.assign')}</RowAction> : null}
      {onDelete ? (
        <RowMenu items={[{ label: t('common.delete'), tone: 'danger', onClick: onDelete }]} />
      ) : null}
      {handle}
    </Card>
  )
}
