import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { JournalBubble } from '@/components/journal/JournalBubble'
import { rollPendingTasksToToday } from '@/data/actions'

export function Shell() {
  useEffect(() => {
    rollPendingTasksToToday()
  }, [])

  return (
    <div className="relative min-h-dvh bg-bg">
      <main className="safe-top safe-bottom mx-auto w-full max-w-lg px-4 pb-28">
        <Outlet />
      </main>
      <JournalBubble />
    </div>
  )
}
