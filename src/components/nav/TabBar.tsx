import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'

function PlanningIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h10M4 12h13M4 18h7" strokeLinecap="round" />
      <circle cx="19.5" cy="6" r="1.6" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrackingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5" strokeLinecap="round" />
      <path d="M4 19h16" strokeLinecap="round" />
      <path d="M8 16v-4M13 16V8M18 16v-6" strokeLinecap="round" />
    </svg>
  )
}

export function TabBar() {
  const { t } = useTranslation()

  const tabs = [
    { to: '/planning', label: t('nav.planning'), icon: <PlanningIcon />, primary: false },
    { to: '/', label: t('nav.home'), icon: <HomeIcon />, primary: true },
    { to: '/tracking', label: t('nav.tracking'), icon: <TrackingIcon />, primary: false },
  ]

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-ink-950/90 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1.5 pb-1.5">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                cx(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 transition-colors',
                  tab.primary && 'font-semibold',
                  isActive ? 'text-accent' : 'text-text-3 hover:text-text-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cx(
                      'flex items-center justify-center rounded-2xl transition-colors',
                      tab.primary ? 'size-11' : 'size-9',
                      tab.primary && (isActive ? 'bg-accent/15' : 'bg-white/5'),
                    )}
                  >
                    {tab.icon}
                  </span>
                  <span className={cx('text-[11px] leading-none', tab.primary && 'text-[12px]')}>
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
