import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { CustomizeSheet } from '@/components/character/CustomizeSheet'
import { SkillsSheet } from '@/components/home/SkillsSheet'
import { ProgressBar, cx } from '@/components/ui/primitives'
import { applyLocale } from '@/i18n'
import { setCharacterLocale } from '@/data/actions'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { formatMoney } from '@/i18n/format'

export function AccountMenu({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { character } = useAleph()
  const { pulseKey } = useFeedback()
  const [customize, setCustomize] = useState(false)
  const [skills, setSkills] = useState(false)
  const xpRatio = character.xpToNext > 0 ? character.xp / character.xpToNext : null

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const setLocale = (locale: 'es' | 'en') => {
    setCharacterLocale(locale)
    applyLocale(locale)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:justify-start sm:p-4">
        <button
          type="button"
          aria-label={t('common.close')}
          className="absolute inset-0 bg-backdrop"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('account.menuTitle')}
          className="animate-rise relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl border border-line bg-raised sm:mt-14 sm:max-h-[min(32rem,85dvh)] sm:rounded-3xl"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong sm:hidden" />
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="aspect-[5/6] w-14 overflow-hidden rounded-2xl border border-line">
              <Avatar avatar={character.avatar} size={56} pulseKey={pulseKey} className="h-full w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[22px] leading-none text-ink">{character.name}</p>
              <p className="mt-1 text-[13px] text-ink-3">
                {t('account.level', { level: character.level })}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar className="h-1.5 flex-1" ratio={xpRatio} />
                <span className="text-[12px] font-medium text-mint">
                  {formatMoney(character.money, character.locale)}
                </span>
              </div>
            </div>
          </div>

          <nav className="no-scrollbar flex-1 overflow-y-auto px-2 pb-4">
            <MenuButton onClick={() => setCustomize(true)}>{t('account.customize')}</MenuButton>
            <MenuLink to="/planning" onNavigate={onClose}>
              {t('nav.planning')}
            </MenuLink>
            <MenuLink to="/tracking" onNavigate={onClose}>
              {t('nav.tracking')}
            </MenuLink>
            <MenuButton onClick={() => setSkills(true)}>{t('account.skills')}</MenuButton>

            <div className="mt-3 px-3">
              <p className="mb-2 text-[11px] font-extrabold tracking-[0.14em] text-ink-3 uppercase">
                {t('account.locale')}
              </p>
              <div className="flex gap-2">
                {(['es', 'en'] as const).map((locale) => (
                  <button
                    key={locale}
                    type="button"
                    onClick={() => setLocale(locale)}
                    className={cx(
                      'min-h-11 flex-1 rounded-2xl border text-[14px] font-medium',
                      character.locale === locale
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line-strong bg-bg text-ink',
                    )}
                  >
                    {locale.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>

      <CustomizeSheet open={customize} onClose={() => setCustomize(false)} pulseKey={pulseKey} />
      <SkillsSheet open={skills} onClose={() => setSkills(false)} />
    </>
  )
}

function MenuButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 w-full items-center rounded-2xl px-3 text-left text-[15px] text-ink hover:bg-subtle"
    >
      {children}
    </button>
  )
}

function MenuLink({
  to,
  children,
  onNavigate,
}: {
  to: string
  children: string
  onNavigate: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className="flex min-h-12 w-full items-center rounded-2xl px-3 text-[15px] text-ink hover:bg-subtle"
    >
      {children}
    </NavLink>
  )
}
