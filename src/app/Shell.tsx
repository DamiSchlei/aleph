import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { rollPendingTasksToToday } from '@/data/actions'

export function Shell() {
  useEffect(() => {
    rollPendingTasksToToday()
  }, [])

  return (
    <div className="min-h-dvh bg-bg">
      <main className="safe-top safe-bottom mx-auto w-full max-w-lg px-4 pb-8">
        <Outlet />
      </main>
    </div>
  )
}
