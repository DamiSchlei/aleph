import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, IconButton, cx } from './primitives'

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onClose}
        className="absolute inset-0 bg-ink-950"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'animate-rise relative flex h-dvh max-h-dvh w-full max-w-lg flex-col bg-ink-950 sm:my-auto sm:h-auto sm:max-h-[90dvh] sm:rounded-3xl sm:border sm:border-white/8 sm:bg-ink-900',
          className,
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/6 px-4 py-3">
          <h2 className="text-[17px] font-semibold text-white">{title}</h2>
          <IconButton label={t('common.close')} onClick={onClose}>
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </IconButton>
        </header>
        <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer ? (
          <footer className="safe-bottom border-t border-white/6 px-4 py-3">{footer}</footer>
        ) : null}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  onDismiss,
  tone = 'primary',
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  onDismiss?: () => void
  tone?: 'primary' | 'danger'
}) {
  const { t } = useTranslation()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-5">
      <button
        type="button"
        aria-label={t('common.cancel')}
        onClick={onDismiss ?? onCancel}
        className="absolute inset-0 bg-ink-950"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className="animate-rise relative w-full max-w-sm rounded-2xl border border-white/8 bg-ink-900 p-5"
      >
        <h2 className="text-[17px] font-semibold text-white">{title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-400">{message}</p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
