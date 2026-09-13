import { Navigate, Outlet } from 'react-router-dom'
import { useAleph } from '@/data/store'

/** First-run shell without the tab bar. */
export function OnboardingLayout() {
  const { character } = useAleph()
  if (character.onboarded) return <Navigate to="/" replace />

  return (
    <div className="min-h-dvh bg-bg">
      <main className="safe-top mx-auto w-full max-w-lg px-4 pb-10 pt-6">
        <Outlet />
      </main>
    </div>
  )
}
