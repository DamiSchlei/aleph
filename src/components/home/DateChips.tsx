import { useTranslation } from 'react-i18next'
import { Chip, Input } from '@/components/ui/primitives'
import { AGENDA_FILTERS, type AgendaFilter } from '@/data/selectors'

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

  return (
    <div className="flex flex-col gap-2">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {AGENDA_FILTERS.map((key) => (
          <Chip
            key={key}
            active={filter === key}
            onClick={() => onFilterChange(key)}
            className="shrink-0"
          >
            {t(`home.filters.${key}`)}
          </Chip>
        ))}
      </div>
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
