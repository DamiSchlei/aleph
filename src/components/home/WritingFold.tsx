import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LiteratureLine } from '@/components/home/LiteratureLine'
import { WalkerJournal } from '@/components/home/WalkerJournal'
import { cx } from '@/components/ui/primitives'

export function WritingFold({ openSignal }: { openSignal?: number }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (openSignal) setOpen(true)
  }, [openSignal])

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="surface-raised flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left"
      >
        <div>
          <p className="text-[13px] font-semibold tracking-[0.14em] text-ink-400 uppercase">
            {t('home.writingTitle')}
          </p>
          <p className="mt-0.5 text-[13px] text-ink-400">{t('home.writingHint')}</p>
        </div>
        <span className={cx('text-ink-400 transition-transform', open && 'rotate-180')}>▾</span>
      </button>
      {open ? (
        <div className="mt-3 flex flex-col gap-4">
          <WalkerJournal />
          <LiteratureLine />
        </div>
      ) : null}
    </section>
  )
}
