import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useLocale } from './hooks'
import { useAleph } from '@/data/store'

/**
 * Routes users through /onboarding until Character.onboarded is true.
 * Onboarded users hitting /onboarding* bounce home.
 */
export function OnboardingGate() {
  useLocale()
  const onboarded = Boolean(useAleph().character.onboarded)
  const { pathname } = useLocation()
  const onOnboarding = pathname.startsWith('/onboarding')

  if (!onboarded && !onOnboarding) {
    return <Navigate to="/onboarding" replace />
  }
  if (onboarded && onOnboarding) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
