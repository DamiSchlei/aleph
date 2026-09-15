import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { AccountMenu } from '@/components/nav/AccountMenu'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { cx } from '@/components/ui/primitives'

/** Top chrome: avatar opens AccountMenu; optional Inicio / Plan; optional title. */
export function AppHeader({
  title,
  showHome = false,
  showPlanning = false,
  className,
}: {
  title?: ReactNode
  showHome?: boolean
  showPlanning?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const { character } = useAleph()
  const { pulseKey } = useFeedback()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className={cx('flex flex-wrap items-center gap-x-2 gap-y-2 pt-2 pb-3', className)}>
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
            className="flex min-h-11 shrink-0 items-center px-1 text-[15px] font-medium text-accent"
          >
            {t('nav.home')}
          </Link>
        ) : null}
        {showPlanning ? (
          <Link
            to="/planning"
            className="flex min-h-11 shrink-0 items-center px-1 text-[15px] font-medium text-accent"
          >
            {t('nav.planShort')}
          </Link>
        ) : null}
        {title ? (
          <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">{title}</div>
        ) : (
          <div className="hidden flex-1 sm:block" />
        )}
      </header>
      <AccountMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
