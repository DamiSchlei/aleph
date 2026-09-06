import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from './primitives'

export interface RowMenuItem {
  label: string
  onClick: () => void
  tone?: 'default' | 'danger'
}

/** A compact kebab overflow menu for row-level actions (e.g. Eliminar). */
export function RowMenu({ items, label }: { items: RowMenuItem[]; label?: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative self-center">
      <button
        type="button"
        aria-label={label ?? t('common.more')}
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-2xl text-ink-400 transition-colors hover:bg-white/5"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
          <circle cx="12" cy="5" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="12" cy="19" r="1.7" />
        </svg>
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 top-10 z-50 min-w-44 rounded-2xl border border-white/10 bg-ink-900 p-1 shadow-lg">
            {items.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
                className={cx(
                  'block w-full rounded-xl px-3 py-2 text-left text-[14px] transition-colors hover:bg-white/6',
                  item.tone === 'danger' ? 'text-rose' : 'text-ink-200',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
