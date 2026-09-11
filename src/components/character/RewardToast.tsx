import { cx } from '@/components/ui/primitives'

export interface ToastMessage {
  id: number
  text: string
  detail?: string
  tone?: 'reward' | 'info'
}

export function RewardToast({ toasts }: { toasts: ToastMessage[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tab-bar-height)+1.25rem)] z-70 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cx(
            'reward-toast max-w-sm rounded-2xl border px-4 py-2.5 text-center text-[15px] font-semibold shadow-lg backdrop-blur',
            toast.tone === 'info'
              ? 'border-white/10 bg-ink-800/95 text-ink-200'
              : 'border-mint/30 bg-mint/15 text-mint',
          )}
        >
          {toast.text}
          {toast.detail ? (
            <span className="mt-0.5 block text-[13px] font-normal text-ink-200/80">{toast.detail}</span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
