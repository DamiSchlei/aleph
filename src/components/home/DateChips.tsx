import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'
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
        {PRIMARY.map(({ filter: key, labelKey }) => {
          const active = filter === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMoreOpen(false)
                onFilterChange(key)
              }}
              className={cx(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors',
                active
                  ? 'bg-accent text-ink-950'
                  : 'border border-white/12 bg-transparent text-text-3',
              )}
            >
              {active ? <CheckIcon /> : null}
              {t(labelKey)}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => {
            setMoreOpen((open) => !open)
            if (!moreActive) onFilterChange('pick')
          }}
          className={cx(
            'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[16px] transition-colors',
            moreActive
              ? 'bg-accent text-ink-950'
              : 'border border-white/12 bg-transparent text-text-3',
          )}
          aria-label={t('home.filterMore')}
        >
          ···
        </button>
      </div>

      {moreOpen || moreActive ? (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {MORE.map((key) => {
            const active = filter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => onFilterChange(key)}
                className={cx(
                  'inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-accent text-ink-950'
                    : 'border border-white/12 bg-transparent text-text-3',
                )}
              >
                {t(`home.filters.${key}`)}
              </button>
            )
          })}
        </div>
      ) : null}

      {filter === 'pick' ? (
        <input
          type="date"
          value={pickDate}
          onChange={(e) => onPickDateChange(e.target.value)}
          aria-label={t('home.filters.pick')}
          className="min-h-11 w-full rounded-2xl border border-white/10 bg-ink-800 px-3.5 text-[15px] text-white outline-none"
        />
      ) : null}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
