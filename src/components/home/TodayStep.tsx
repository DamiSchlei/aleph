import { useTranslation } from 'react-i18next'
import { Button, EmptyState } from '@/components/ui/primitives'
import { resultById } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatHours } from '@/i18n/format'
import type { Task } from '@/domain/types'

export function TodayStep({
  task,
  onComplete,
  onMove,
}: {
  task: Task | null
  onComplete: () => void
  onMove: () => void
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale

  if (!task) {
    return (
      <section className="surface-raised rounded-2xl p-4">
        <EmptyState>{t('home.stepTodayEmpty')}</EmptyState>
      </section>
    )
  }

  const result = task.resultId ? resultById(state, task.resultId) : undefined
  const difficultyLabel = t(`difficulty.${task.difficulty}`)
  const hoursLabel = formatHours(task.estimatedHours, locale)

  return (
    <section className="surface-raised rounded-2xl p-4">
      <p className="text-[13px] font-medium tracking-[0.14em] text-ink-400 uppercase">
        {t('home.stepToday')}
      </p>
      <p className="mt-2 text-[17px] font-medium leading-snug text-white">{task.title}</p>
      <p className="mt-1 text-[13px] text-ink-400">
        {result ? `${result.name} · ` : ''}
        {hoursLabel}
        {' · '}
        <span className={task.difficulty === 'high' ? 'text-amber' : undefined}>{difficultyLabel}</span>
      </p>
      <div className="mt-4 flex gap-2">
        <Button className="flex-1" onClick={onComplete}>
          {t('home.completeCta')}
        </Button>
        <Button variant="ghost" className="flex-1" onClick={onMove}>
          {t('home.moveCta')}
        </Button>
      </div>
    </section>
  )
}
