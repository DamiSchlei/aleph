import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'
import { blockContext } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { formatHours } from '@/i18n/format'
import type { Task } from '@/domain/types'

/**
 * Closed Home block: one scheduled Task as a two-line unit (~56–64px).
 * Not a domain entity — rail + title + meta + quiet actions.
 */
export function TaskBlock({
  task,
  handle,
  onToggle,
  onOpen,
  showGroupLabel,
  omitResult,
}: {
  task: Task
  handle: ReactNode
  onToggle: () => void
  onOpen: () => void
  /** Result name above the first card of a consecutive same-result run. */
  showGroupLabel?: boolean
  /** Hide result on the meta line when a group label already names it. */
  omitResult?: boolean
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const ctx = blockContext(state, task)
  const done = isTaskDone(task.status)
  const hours = `${formatHours(ctx.hours, locale)} h`
  const stage = t(`stages.${ctx.stage}.short`)
  const hideResult = Boolean(showGroupLabel || omitResult)

  const metaParts: string[] = []
  if (ctx.kind === 'loose') {
    metaParts.push(t('planning.tasks.loose'), hours, stage)
  } else if (ctx.kind === 'anchored') {
    if (ctx.objective?.name) metaParts.push(ctx.objective.name)
    metaParts.push(hours, stage)
  } else {
    if (!hideResult && ctx.result?.name) metaParts.push(ctx.result.name)
    metaParts.push(hours, stage)
  }

  const lineageHref = ctx.objective
    ? `/planning/objectives/${ctx.objective.id}`
    : ctx.result
      ? `/planning/results/${ctx.result.id}`
      : undefined

  const titleName = t(done ? 'home.blockA11yDone' : 'home.blockA11y', {
    title: task.title,
    hours,
    stage,
  })

  return (
    <div className="flex flex-col gap-1">
      {showGroupLabel && ctx.result ? (
        lineageHref ? (
          <Link
            to={lineageHref}
            className="block truncate px-1 text-[11px] leading-tight text-text-3"
          >
            {ctx.result.name}
          </Link>
        ) : (
          <p className="truncate px-1 text-[11px] leading-tight text-text-3">{ctx.result.name}</p>
        )
      ) : null}
      <div className="relative flex overflow-hidden rounded-2xl border border-line bg-surface-2">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ background: ctx.color }}
        />
        <div className="flex min-w-0 flex-1 items-center py-2.5 pr-1 pl-3">
          <button
            type="button"
            onClick={onOpen}
            aria-label={titleName}
            className="min-h-11 min-w-0 flex-1 py-0 text-left"
          >
            <p
              className={cx(
                'line-clamp-1 text-[15px] leading-snug font-medium text-ink',
                done && 'line-through text-ink-3',
              )}
            >
              {task.title}
            </p>
            <p className="mt-0.5 truncate text-[12px] leading-tight text-text-3">
              {metaParts.slice(0, 3).join(' · ')}
            </p>
          </button>
          <button
            type="button"
            role="checkbox"
            aria-checked={done}
            aria-label={t(done ? 'home.reopenNamed' : 'home.completeNamed', { title: task.title })}
            onClick={onToggle}
            className="flex size-11 shrink-0 items-center justify-center"
          >
            <span
              className={cx(
                'flex size-[22px] items-center justify-center rounded-md border-2',
                done ? 'border-mint bg-mint text-white' : 'border-line-strong',
              )}
            >
              {done ? (
                <svg
                  viewBox="0 0 16 16"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M3.5 8.5 6.5 11.5 12.5 4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
          </button>
          <div className="opacity-30">{handle}</div>
        </div>
      </div>
    </div>
  )
}

/** Compact chip for PeriodGrid cells — same color language as TaskBlock. */
export function TaskBlockChip({ task }: { task: Task }) {
  const state = useAleph()
  const ctx = blockContext(state, task)
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: ctx.color }} />
      <span className="min-w-0 truncate text-[10px] leading-tight text-ink">{task.title}</span>
    </span>
  )
}
