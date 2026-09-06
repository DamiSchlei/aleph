import { Outlet } from 'react-router-dom'
import { TabBar } from '@/components/nav/TabBar'
import { useLocale } from './hooks'

export function Shell() {
  useLocale()

  return (
    <div className="min-h-dvh">
      <main className="safe-top mx-auto w-full max-w-lg px-4 pb-[calc(var(--tab-bar-height)+2rem)]">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
