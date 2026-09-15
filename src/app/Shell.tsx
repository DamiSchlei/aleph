import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { JournalBubble } from '@/components/journal/JournalBubble'
import { TabBar } from '@/components/nav/TabBar'
import { rollPendingTasksToToday } from '@/data/actions'

export function Shell() {
  useEffect(() => {
    rollPendingTasksToToday()
  }, [])

  return (
    <div className="relative min-h-dvh bg-bg">
      <main
        className="safe-top mx-auto w-full max-w-lg px-4"
        style={{ paddingBottom: 'calc(var(--tab-bar-height) + env(safe-area-inset-bottom))' }}
      >
        <Outlet />
      </main>
      <JournalBubble />
      <TabBar />
    </div>
  )
}
