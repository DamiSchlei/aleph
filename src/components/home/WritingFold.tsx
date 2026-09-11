import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LiteratureLine } from '@/components/home/LiteratureLine'
import { WalkerJournal } from '@/components/home/WalkerJournal'
import { cx } from '@/components/ui/primitives'

export function WritingFold({
  openSignal,
  children,
}: {
  openSignal?: number
  children?: ReactNode
}) {
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
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
      >
        <p className="text-[12px] font-medium tracking-[0.16em] text-text-3 uppercase">
          {t('home.writingTitle')}
        </p>
        <span className={cx('text-text-3 transition-transform', open && 'rotate-180')}>▾</span>
      </button>
      {open ? (
        <div className="mt-2 flex flex-col gap-4">
          {children}
          <WalkerJournal />
          <LiteratureLine />
        </div>
      ) : null}
    </section>
  )
}
