import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'
import { dayLoad } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatHours } from '@/i18n/format'
import type { Difficulty } from '@/domain/types'

const WEIGHT: Record<Difficulty, string> = {
  low: 'bg-accent/45',
  medium: 'bg-accent/75',
  high: 'bg-accent',
}

export function DayBar({ dayKey }: { dayKey: string }) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const load = dayLoad(state, dayKey)
  const divisor = load.overflow ? load.hours : 24

  return (
    <section>
      <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-text-3 uppercase">
        {t('home.dayBarTitle')}
      </p>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-ink-800">
        <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
        <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
        <div className="relative flex h-full w-full">
          {load.segments.map((segment) => (
            <div
              key={segment.id}
              title={segment.title}
              className={cx('h-full min-w-0', WEIGHT[segment.difficulty])}
              style={{ width: `${divisor > 0 ? (segment.hours / divisor) * 100 : 0}%` }}
            />
          ))}
        </div>
      </div>
      <p className="mt-2 text-[12px] text-text-3">
        {t('home.dayBarCaption', { count: formatHours(load.hours, locale) })}
      </p>
      {load.overflow ? (
        <p className="mt-1 text-[13px] text-amber">
          {t('home.dayBarOverflow', { count: formatHours(load.hours, locale) })}
        </p>
      ) : null}
    </section>
  )
}
