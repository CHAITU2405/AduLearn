import { forwardRef, useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { CheckCircle2, Circle, Heart, Info, Lock, TriangleAlert, X } from 'lucide-react'
import type { NodeState } from '@/core/game/progression'

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warm'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-deep shadow-soft',
  warm: 'bg-orange text-white hover:bg-orange-deep shadow-soft',
  success: 'bg-leaf-deep text-white hover:bg-[#166534] shadow-soft',
  secondary: 'bg-white text-ink border-2 border-line hover:border-brand hover:text-brand-deep',
  ghost: 'text-ink-soft hover:bg-brand-soft hover:text-brand-deep',
  danger: 'bg-coral-deep text-white hover:bg-[#9f1239] shadow-soft',
}
const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-sm gap-1.5',
  md: 'min-h-11 px-5 text-base gap-2',
  lg: 'min-h-14 px-7 text-lg gap-2.5',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cn(
    'inline-flex items-center justify-center rounded-full font-bold transition-colors duration-150 select-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
    extra,
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>(
  ({ variant = 'primary', size = 'md', className, type = 'button', ...rest }, ref) => <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest} />,
)
Button.displayName = 'Button'

export function LinkButton({ variant = 'primary', size = 'md', className, ...rest }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />
}

export function Card({ className, children, as: Tag = 'div' }: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article' | 'li' }) {
  return <Tag className={cn('rounded-[var(--radius-card)] bg-card shadow-soft border border-line/70', className)}>{children}</Tag>
}

export function Pill({
  children,
  tone = 'brand',
  className,
}: {
  children: ReactNode
  tone?: 'brand' | 'leaf' | 'coral' | 'sun' | 'muted' | 'violet' | 'orange'
  className?: string
}) {
  const tones = {
    brand: 'bg-brand-soft text-brand-deep',
    leaf: 'bg-leaf-soft text-leaf-deep',
    coral: 'bg-coral-soft text-coral-deep',
    sun: 'bg-sun-soft text-[#854d0e]',
    muted: 'bg-[#eef2f7] text-ink-soft',
    violet: 'bg-[#eef2ff] text-[#4338ca]',
    orange: 'bg-[#fff7ed] text-orange-deep',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold', tones[tone], className)}>{children}</span>
}

export function ProgressBar({
  value,
  max,
  label,
  tone = 'brand',
  className,
}: {
  value: number
  max: number
  label: string
  tone?: 'brand' | 'leaf' | 'orange' | 'coral' | 'violet' | 'teal'
  className?: string
}) {
  const pct = max > 0 ? Math.round((Math.min(value, max) / max) * 100) : 0
  const tones = { brand: 'bg-brand', leaf: 'bg-leaf', orange: 'bg-orange', coral: 'bg-coral', violet: 'bg-violet', teal: 'bg-teal' }
  return (
    <div
      className={cn('w-full', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-valuetext={`${Math.min(value, max)} of ${max}`}
    >
      <div className="h-3 w-full overflow-hidden rounded-full bg-[#e6eef7]">
        <div className={cn('h-full rounded-full transition-[width] duration-500', tones[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Hearts({ lives, max }: { lives: number; max: number }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${lives} of ${max} hearts left`}>
      {Array.from({ length: max }, (_, i) => (
        <Heart key={i} aria-hidden className={cn('size-6 transition-transform', i < lives ? 'fill-coral text-coral' : 'text-[#cbd5e1]')} strokeWidth={2.2} />
      ))}
    </div>
  )
}

export function StateBadge({ state }: { state: NodeState }) {
  if (state === 'completed')
    return (
      <Pill tone="leaf">
        <CheckCircle2 className="size-3.5" aria-hidden /> Completed
      </Pill>
    )
  if (state === 'available')
    return (
      <Pill tone="brand">
        <Circle className="size-3.5" aria-hidden /> Available
      </Pill>
    )
  return (
    <Pill tone="muted">
      <Lock className="size-3.5" aria-hidden /> Locked
    </Pill>
  )
}

export function Notice({ tone = 'info', title, children, className }: { tone?: 'info' | 'warn' | 'error' | 'success'; title?: string; children: ReactNode; className?: string }) {
  const styles = {
    info: 'bg-brand-soft border-[#bae6fd] text-ink',
    warn: 'bg-sun-soft border-[#fde68a] text-ink',
    error: 'bg-coral-soft border-[#fecdd3] text-ink',
    success: 'bg-leaf-soft border-[#bbf7d0] text-ink',
  }
  const Icon = tone === 'info' || tone === 'success' ? Info : TriangleAlert
  return (
    <div className={cn('flex gap-3 rounded-2xl border p-4 text-sm', styles[tone], className)} role={tone === 'error' ? 'alert' : undefined}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-bold">{title}</p>}
        <div className="text-ink-soft">{children}</div>
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-line bg-white/60 px-6 py-10 text-center">
      {icon && <div className="text-ink-muted">{icon}</div>}
      <p className="font-display text-xl font-bold">{title}</p>
      {children && <div className="max-w-md text-ink-soft">{children}</div>}
      {action}
    </div>
  )
}

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-sm font-bold uppercase tracking-wide text-brand-deep">{eyebrow}</p>}
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {children && <div className="mt-2 max-w-2xl text-ink-soft">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-ink-muted" role="status">
      <span className="size-6 animate-spin rounded-full border-[3px] border-brand/30 border-t-brand" aria-hidden />
      <span>{label}…</span>
    </div>
  )
}

/** Accessible modal built on the native <dialog> element (focus trap + Esc). */
export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal()
      else d.setAttribute('open', '')
    } else if (!open && d.open) {
      if (typeof d.close === 'function') d.close()
      else d.removeAttribute('open')
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      className="m-auto w-[min(92vw,32rem)] rounded-3xl border border-line bg-white p-0 text-ink shadow-lift"
    >
      {open && (
        <div className="p-6">
          <div className="mb-3 flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-2xl font-bold">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="rounded-full p-1.5 text-ink-muted hover:bg-brand-soft" aria-label="Close">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="text-ink-soft">{children}</div>
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = true,
}: {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
