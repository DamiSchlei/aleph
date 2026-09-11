import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/primitives'
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
      <section className="surface-raised rounded-[20px] p-5">
        <p className="text-[12px] font-medium tracking-[0.16em] text-accent uppercase">{t('home.stepToday')}</p>
        <p className="mt-3 text-[17px] font-medium leading-snug text-text-2">{t('home.stepTodayEmpty')}</p>
      </section>
    )
  }

  const result = task.resultId ? resultById(state, task.resultId) : undefined
  const difficultyLabel = t(`difficulty.${task.difficulty}`)
  const hoursLabel = formatHours(task.estimatedHours, locale)

  return (
    <section className="surface-raised rounded-[20px] p-5">
      <p className="text-[12px] font-medium tracking-[0.16em] text-accent uppercase">{t('home.stepToday')}</p>
      <div className="mt-3 flex items-start gap-3">
        <span className="mt-0.5 size-7 shrink-0 rounded-full border border-white/25" />
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-medium leading-snug text-white">{task.title}</p>
          <p className="mt-1 text-[13px] text-text-3">
            {result ? `${result.name} · ` : ''}
            {hoursLabel}
            {' · '}
            <span className={task.difficulty === 'high' ? 'text-amber' : undefined}>{difficultyLabel}</span>
          </p>
        </div>
      </div>
      <Button className="mt-4 w-full" onClick={onComplete}>
        {t('home.completeCta')}
      </Button>
      <button
        type="button"
        onClick={onMove}
        className="mt-2 min-h-11 w-full text-center text-[13px] text-text-3"
      >
        {t('home.moveCta')}
      </button>
    </section>
  )
}
