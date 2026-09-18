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
 * Closed Home block: one scheduled Task as a visual unit.
 * Not a domain entity — lineage + title + meta + quiet actions.
 */
export function TaskBlock({
  task,
  handle,
  onToggle,
  onOpen,
  showGroupLabel,
}: {
  task: Task
  handle: ReactNode
  onToggle: () => void
  onOpen: () => void
  /** Optional result label above the card when grouping consecutive blocks. */
  showGroupLabel?: boolean
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const ctx = blockContext(state, task)
  const done = isTaskDone(task.status)

  const metaParts: string[] = []
  if (ctx.timeRange.start && ctx.timeRange.end) {
    metaParts.push(`${ctx.timeRange.start}–${ctx.timeRange.end}`)
  }
  metaParts.push(`${formatHours(ctx.hours, locale)} h`)
  metaParts.push(t(`stages.${ctx.stage}.short`))

  const lineageHref = ctx.objective
    ? `/planning/objectives/${ctx.objective.id}`
    : ctx.result
      ? `/planning/results/${ctx.result.id}`
      : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {showGroupLabel && ctx.result ? (
        <p className="px-1 text-[11px] tracking-[0.14em] text-text-3 uppercase">{ctx.result.name}</p>
      ) : null}
      <div
        className={cx(
          'relative flex min-h-16 overflow-hidden rounded-[20px] border border-line bg-surface-2',
        )}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: ctx.color }}
        />
        <div className="flex min-w-0 flex-1 items-start gap-1 py-3.5 pr-2 pl-3.5">
          <div className="min-w-0 flex-1">
            {lineageHref ? (
              <Link to={lineageHref} className="block min-w-0">
                <Lineage
                  resultName={ctx.result?.name}
                  objectiveName={ctx.objective?.name}
                  kind={ctx.kind}
                  color={ctx.color}
                />
              </Link>
            ) : (
              <Lineage
                resultName={undefined}
                objectiveName={undefined}
                kind={ctx.kind}
                color={ctx.color}
              />
            )}
            <button
              type="button"
              onClick={onOpen}
              className="mt-1.5 w-full min-w-0 text-left"
            >
              <p
                className={cx(
                  'line-clamp-2 text-[16px] leading-snug font-medium text-ink',
                  done && 'line-through text-ink-3',
                )}
              >
                {task.title}
              </p>
              <p className="mt-1 text-[12px] text-text-3">{metaParts.join(' · ')}</p>
              {ctx.doneWhen ? (
                <p className="mt-1 text-[12px] text-text-3">
                  {t('home.doneWhen', { text: ctx.doneWhen })}
                </p>
              ) : null}
            </button>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-0.5">
            <button
              type="button"
              role="checkbox"
              aria-checked={done}
              aria-label={t('home.completeBlock')}
              onClick={onToggle}
              className="flex size-11 items-center justify-center"
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
            <div className="opacity-50">{handle}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Lineage({
  resultName,
  objectiveName,
  kind,
  color,
}: {
  resultName?: string
  objectiveName?: string
  kind: 'anchored' | 'result-only' | 'loose'
  color: string
}) {
  const { t } = useTranslation()

  if (kind === 'loose') {
    return (
      <p className="text-[11px] font-semibold tracking-[0.14em] text-amber uppercase">
        {t('planning.tasks.loose')}
      </p>
    )
  }

  return (
    <div className="min-w-0">
      {resultName ? (
        <p
          className="truncate text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ color }}
        >
          {resultName}
        </p>
      ) : null}
      {kind === 'anchored' && objectiveName ? (
        <p className="mt-0.5 truncate text-[12px] text-text-2">{objectiveName}</p>
      ) : null}
      {kind === 'result-only' ? (
        <p className="mt-0.5 text-[12px] text-text-3">{t('home.noObjective')}</p>
      ) : null}
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
