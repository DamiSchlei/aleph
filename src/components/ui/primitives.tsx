import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white font-semibold hover:bg-accent-hover active:bg-accent-pressed disabled:bg-subtle disabled:text-ink-4 disabled:border disabled:border-line',
  secondary:
    'bg-bg text-ink border border-line-strong hover:bg-subtle disabled:text-ink-4',
  ghost: 'bg-transparent text-ink-2 hover:bg-subtle disabled:text-ink-4',
  danger: 'bg-rose text-white hover:bg-rose/90',
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
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-[15px] transition-colors',
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
        'inline-flex size-11 shrink-0 items-center justify-center rounded-2xl text-ink-2 transition-colors hover:bg-subtle',
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
        'rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-paper)]',
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
      <h2 className="text-[11px] font-extrabold tracking-[0.14em] text-ink-3 uppercase">{children}</h2>
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
      <span className="mb-1.5 block text-[13px] font-medium text-ink-3">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-3">{hint}</span> : null}
    </label>
  )
}

const CONTROL =
  'w-full min-h-12 rounded-2xl border border-line-strong bg-bg px-3.5 text-[15px] text-ink placeholder:text-ink-4 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30'

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
    neutral: 'bg-subtle text-ink-2 border border-line',
    accent: 'bg-accent-soft text-accent border border-accent/20',
    mint: 'bg-mint-soft text-mint',
    amber: 'bg-amber-soft text-amber',
    rose: 'bg-rose-soft text-rose',
    violet: 'bg-violet-soft text-violet',
  } as const
  return (
    <span
      className={cx(
        'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
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
  if (ratio === null) return null
  const width = Math.min(100, Math.max(0, ratio * 100))
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-subtle', className)}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${width}%`, background: color ?? 'var(--color-accent)' }}
      />
    </div>
  )
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        '-mx-4 min-h-[calc(100dvh-var(--tab-bar-height))] bg-bg px-4',
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
      <p className="text-[15px] leading-relaxed text-ink-2">{children}</p>
      {hint ? <div className="mt-1 text-[13px] text-ink-3">{hint}</div> : null}
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
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-line-strong bg-bg text-ink hover:bg-subtle',
        className,
      )}
    >
      {children}
    </button>
  )
}
