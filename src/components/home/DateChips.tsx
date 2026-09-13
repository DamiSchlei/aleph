import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip, Input } from '@/components/ui/primitives'
import type { AgendaFilter } from '@/data/selectors'

const PRIMARY: Array<{ filter: AgendaFilter; labelKey: string }> = [
  { filter: 'today', labelKey: 'home.filterToday' },
  { filter: 'tomorrow', labelKey: 'home.filterTomorrow' },
  { filter: 'week', labelKey: 'home.filterWeek' },
]

const MORE: AgendaFilter[] = ['overdue', 'pick', 'undated']

export function DateChips({
  filter,
  pickDate,
  onFilterChange,
  onPickDateChange,
}: {
  filter: AgendaFilter
  pickDate: string
  onFilterChange: (filter: AgendaFilter) => void
  onPickDateChange: (date: string) => void
}) {
  const { t } = useTranslation()
  const [moreOpen, setMoreOpen] = useState(MORE.includes(filter))
  const moreActive = MORE.includes(filter)

  return (
    <div className="flex flex-col gap-2">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {PRIMARY.map(({ filter: key, labelKey }) => (
          <Chip
            key={key}
            active={filter === key}
            onClick={() => {
              setMoreOpen(false)
              onFilterChange(key)
            }}
            className="h-8 min-h-8 shrink-0 py-0 text-[12px]"
          >
            {t(labelKey)}
          </Chip>
        ))}
        <Chip
          active={moreActive}
          onClick={() => {
            setMoreOpen((open) => !open)
            if (!moreActive) onFilterChange('pick')
          }}
          className="h-8 min-h-8 shrink-0 py-0 text-[12px]"
        >
          {t('home.filterMore')}
        </Chip>
      </div>

      {moreOpen || moreActive ? (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {MORE.map((key) => (
            <Chip
              key={key}
              active={filter === key}
              onClick={() => onFilterChange(key)}
              className="h-8 min-h-8 shrink-0 py-0 text-[12px]"
            >
              {t(`home.filters.${key}`)}
            </Chip>
          ))}
        </div>
      ) : null}

      {filter === 'pick' ? (
        <Input
          type="date"
          value={pickDate}
          onChange={(e) => onPickDateChange(e.target.value)}
          aria-label={t('home.filters.pick')}
        />
      ) : null}
    </div>
  )
}
