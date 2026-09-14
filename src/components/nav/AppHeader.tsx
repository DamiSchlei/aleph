import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { AccountMenu } from '@/components/nav/AccountMenu'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { cx } from '@/components/ui/primitives'

/** Top chrome: avatar opens AccountMenu; optional section title beside it. */
export function AppHeader({
  title,
  className,
}: {
  title?: ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  const { character } = useAleph()
  const { pulseKey } = useFeedback()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className={cx('flex items-center gap-3 pt-2 pb-3', className)}>
        <button
          type="button"
          aria-label={t('account.openMenu')}
          onClick={() => setMenuOpen(true)}
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
        >
          <span className="aspect-[5/6] w-9 overflow-hidden rounded-[14px] border border-line">
            <Avatar
              avatar={character.avatar}
              size={36}
              pulseKey={pulseKey}
              className="h-full w-full rounded-[14px]"
            />
          </span>
        </button>
        {title ? <div className="min-w-0 flex-1">{title}</div> : <div className="flex-1" />}
      </header>
      <AccountMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
