import { cn } from '@/components/ui'

/**
 * Uses the supplied AduLearn logo when it exists in src/assets/brand/.
 * Resolved at build time, so a missing file causes no network 404.
 */
const found = import.meta.glob('/src/assets/brand/adulearn-logo.{png,svg,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const LOGO_URL: string | undefined = Object.values(found)[0]

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  if (LOGO_URL) {
    return <img src={LOGO_URL} alt="AduLearn — Adventure Education Learning" className={cn('h-10 w-auto', className)} />
  }
  // Placeholder wordmark (drop the real logo into src/assets/brand/ to replace this).
  return (
    <span className={cn('inline-flex items-center gap-2', className)} aria-label="AduLearn — Adventure Education Learning" role="img">
      <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-brand font-display text-xl font-bold text-white shadow-soft">
        A
      </span>
      <span aria-hidden className="flex flex-col leading-none">
        <span className="font-display text-2xl font-bold tracking-tight text-ink">
          Adu<span className="text-orange">Learn</span>
        </span>
        {!compact && <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Adventure Education Learning</span>}
      </span>
    </span>
  )
}
