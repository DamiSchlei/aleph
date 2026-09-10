import { Outlet } from 'react-router-dom'
import { TabBar } from '@/components/nav/TabBar'
import { OnboardingHost } from '@/components/onboarding/Onboarding'
import { useLocale } from './hooks'

export function Shell() {
  useLocale()

  return (
    <OnboardingHost>
      <div className="min-h-dvh">
        <main className="safe-top mx-auto w-full max-w-lg px-4 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom,0px)+2.75rem)]">
          <Outlet />
        </main>
        <TabBar />
      </div>
    </OnboardingHost>
  )
}
