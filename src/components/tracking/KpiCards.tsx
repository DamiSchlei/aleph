import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/primitives'
import { formatHours, formatNumber } from '@/i18n/format'
import type { TrackingStats } from '@/data/selectors'
import type { Locale } from '@/domain/types'

export function KpiCards({ stats, locale }: { stats: TrackingStats; locale: Locale }) {
  const { t } = useTranslation()
  const empty = stats.completed === 0

  const cards = [
    { label: t('tracking.cards.completed'), value: String(stats.completed) },
    {
      label: t('tracking.cards.onTime'),
      value: empty ? t('common.dash') : String(stats.onTime),
    },
    { label: t('tracking.cards.late'), value: String(stats.late) },
    {
      label: t('tracking.cards.avgDelay'),
      value:
        stats.avgDelayDays === null
          ? t('common.dash')
          : `${formatNumber(stats.avgDelayDays, locale)} ${t('tracking.cards.avgDelayUnit')}`,
    },
    {
      label: t('tracking.cards.hours'),
      value: formatHours(stats.hoursLast7, locale),
      caption: t('tracking.cards.hoursCaption'),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card) => (
        <Card key={card.label} className="py-3">
          <p className="text-[12px] font-medium tracking-wide text-text-3 uppercase">{card.label}</p>
          <p className="mt-1 text-[22px] font-semibold text-white">{card.value}</p>
          {card.caption ? <p className="text-[12px] text-text-3">{card.caption}</p> : null}
        </Card>
      ))}
    </div>
  )
}
