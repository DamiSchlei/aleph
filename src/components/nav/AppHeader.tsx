import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { AccountMenu } from '@/components/nav/AccountMenu'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { cx } from '@/components/ui/primitives'

/** Top chrome: avatar opens AccountMenu; optional Inicio link; optional title. */
export function AppHeader({
  title,
  showHome = false,
  className,
}: {
  title?: ReactNode
  showHome?: boolean
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
        {showHome ? (
          <Link
            to="/"
            className="flex min-h-11 items-center px-1 text-[15px] font-medium text-accent"
          >
            {t('nav.home')}
          </Link>
        ) : null}
        {title ? <div className="min-w-0 flex-1">{title}</div> : <div className="flex-1" />}
      </header>
      <AccountMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
