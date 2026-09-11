import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-strong text-ink-950 font-semibold hover:bg-accent active:bg-accent disabled:bg-ink-700 disabled:text-text-3',
  secondary:
    'bg-ink-800 text-text-2 border border-white/10 hover:bg-ink-700 disabled:text-text-3',
  ghost: 'text-text-2 hover:bg-white/5 disabled:text-text-3',
  danger: 'bg-rose/15 text-rose border border-rose/30 hover:bg-rose/25',
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-[15px] transition-colors',
        'disabled:cursor-not-allowed',
        BUTTON_VARIANTS[variant],
        className,
      )}
    />
  )
}

export function IconButton({
  className,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cx(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-2xl text-text-2 transition-colors hover:bg-white/5',
        className,
      )}
    />
  )
}

export function Card({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cx(
        'rounded-2xl border border-white/14 bg-surface p-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="text-[13px] font-semibold tracking-[0.14em] text-text-3 uppercase">{children}</h2>
      {action}
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-text-3">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-text-3">{hint}</span> : null}
    </label>
  )
}

const CONTROL =
  'w-full min-h-11 rounded-2xl border border-white/10 bg-ink-800 px-3.5 text-[15px] text-white placeholder:text-3 outline-none transition-colors focus:border-accent/60'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(CONTROL, className)} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(CONTROL, 'py-2.5 leading-relaxed', className)} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(CONTROL, 'appearance-none pr-9', className)} />
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'mint' | 'amber' | 'rose' | 'violet'
  className?: string
}) {
  const tones = {
    neutral: 'bg-ink-800 text-text-2',
    accent: 'bg-accent/15 text-accent',
    mint: 'bg-mint/15 text-mint',
    amber: 'bg-amber/15 text-amber',
    rose: 'bg-rose/15 text-rose',
    violet: 'bg-violet/15 text-violet',
  } as const
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function ProgressBar({
  ratio,
  color,
  className,
}: {
  /** Null means "no sample": the bar stays empty instead of reading 0%. */
  ratio: number | null
  color?: string
  className?: string
}) {
  const width = ratio === null ? 0 : Math.min(100, Math.max(0, ratio * 100))
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-white/10', className)}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${width}%`, background: color ?? 'var(--color-accent-strong)' }}
      />
    </div>
  )
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        '-mx-4 min-h-[calc(100dvh-var(--tab-bar-height))] bg-ink-950 px-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function EmptyState({
  children,
  hint,
  action,
}: {
  children: ReactNode
  hint?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl px-4 py-8 text-center">
      <p className="text-[15px] leading-relaxed text-text-2">{children}</p>
      {hint ? <div className="mt-1 text-[13px] text-text-3">{hint}</div> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function Chip({
  children,
  onClick,
  active,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  active?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'min-h-11 rounded-full border px-3 py-1.5 text-[13px] transition-colors',
        active
          ? 'border-accent/50 bg-accent/15 text-accent'
          : 'border-white/10 bg-ink-800 text-text-2 hover:bg-ink-700',
        className,
      )}
    >
      {children}
    </button>
  )
}
