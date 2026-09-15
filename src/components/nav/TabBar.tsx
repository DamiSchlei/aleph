import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'

const TABS = [
  { id: 'planning', to: '/planning', labelKey: 'nav.planning' },
  { id: 'home', to: '/', labelKey: 'nav.home' },
  { id: 'tracking', to: '/tracking', labelKey: 'nav.tracking' },
] as const

function tabIsActive(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/'
  if (to === '/planning') return pathname === '/planning' || pathname.startsWith('/planning/')
  if (to === '/tracking') return pathname === '/tracking'
  return false
}

export function TabBar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  if (pathname.startsWith('/onboarding')) return null

  return (
    <nav
      aria-label={t('nav.bar')}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-line bg-raised/90 p-1.5 shadow-paper backdrop-blur">
        {TABS.map((tab) => {
          const active = tabIsActive(pathname, tab.to)
          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              end={tab.to === '/'}
              aria-label={t(tab.labelKey)}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex size-11 items-center justify-center rounded-full',
                active ? 'text-accent' : 'text-ink-3',
              )}
            >
              <TabIcon id={tab.id} filled={tab.id === 'home' && active} />
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

function TabIcon({ id, filled }: { id: (typeof TABS)[number]['id']; filled: boolean }) {
  if (id === 'home') {
    return (
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
        <path
          d="M4.5 11.2 12 4.4l7.5 6.8V20a1.2 1.2 0 0 1-1.2 1.2h-4.6v-6.2H10.3V21.2H5.7A1.2 1.2 0 0 1 4.5 20z"
          fill={filled ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (id === 'planning') {
    return (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
        <rect x="4" y="5.5" width="16" height="14" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4 10h16M8 3.5v4M16 3.5v4M8 14h8M8 17.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
      <path
        d="M3.5 16.5 7.5 11l3 3.5L15.5 7l5 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
