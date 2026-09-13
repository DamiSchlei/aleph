import { Outlet } from 'react-router-dom'
import { TabBar } from '@/components/nav/TabBar'

export function Shell() {
  return (
    <div className="min-h-dvh">
      <main className="safe-top mx-auto w-full max-w-lg px-4 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom,0px)+3.5rem)]">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
