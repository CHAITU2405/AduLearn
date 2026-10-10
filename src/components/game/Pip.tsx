import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/components/ui'

export type PipMood = 'idle' | 'happy' | 'cheer' | 'sad' | 'thinking' | 'talking'

/** Pip the Spark — the explorer's companion mascot. */
export function Pip({ mood = 'idle', className, title = 'Pip' }: { mood?: PipMood; className?: string; title?: string }) {
  const ink = '#3b1d0a'
  const eyes =
    mood === 'cheer' ? (
      <>
        <path d="M40 58 Q46 50 52 58" stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M68 58 Q74 50 80 58" stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <g className="pip-blink">
        <ellipse cx="46" cy={mood === 'thinking' ? 54 : 57} rx="7" ry={mood === 'sad' ? 7 : 8.5} fill={ink} />
        <ellipse cx="74" cy={mood === 'thinking' ? 54 : 57} rx="7" ry={mood === 'sad' ? 7 : 8.5} fill={ink} />
        <circle cx="48.5" cy={mood === 'thinking' ? 51 : 54} r="2.6" fill="#fff" />
        <circle cx="76.5" cy={mood === 'thinking' ? 51 : 54} r="2.6" fill="#fff" />
      </g>
    )
  const mouth = {
    idle: <path d="M53 71 Q60 76 67 71" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />,
    happy: <path d="M51 69 Q60 79 69 69" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />,
    cheer: <path d="M50 67 Q60 84 70 67 Z" fill="#9a3412" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />,
    sad: <path d="M53 76 Q60 70 67 76" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />,
    thinking: <path d="M54 73 L65 71" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />,
    talking: <ellipse className="pip-talk" cx="60" cy="72" rx="5" ry="4" fill="#9a3412" stroke={ink} strokeWidth="2" />,
  }[mood]
  return (
    <svg viewBox="0 0 120 120" className={cn('overflow-visible', className)} role="img" aria-label={title}>
      <defs>
        <radialGradient id="pip-body" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff7c2" />
          <stop offset="0.45" stopColor="#fde047" />
          <stop offset="1" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id="pip-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fde047" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="62" r="58" fill="url(#pip-glow)" className="pip-glow" />
      <g className="pip-wing-l">
        <ellipse cx="22" cy="52" rx="20" ry="12" fill="#a5f3fc" opacity="0.85" stroke="#22d3ee" strokeWidth="2" />
      </g>
      <g className="pip-wing-r">
        <ellipse cx="98" cy="52" rx="20" ry="12" fill="#a5f3fc" opacity="0.85" stroke="#22d3ee" strokeWidth="2" />
      </g>
      <path d="M60 30 Q56 16 64 8" stroke="#b45309" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M64 1 L66.5 6 L72 6.6 L68 10.3 L69 15.8 L64 13.2 L59 15.8 L60 10.3 L56 6.6 L61.5 6 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="1.2" />
      <circle cx="60" cy="62" r="34" fill="url(#pip-body)" stroke="#d97706" strokeWidth="2" />
      <ellipse cx="48" cy="44" rx="9" ry="5" fill="#fff" opacity="0.55" transform="rotate(-25 48 44)" />
      {eyes}
      <circle cx="38" cy="69" r="5" fill="#fb7185" opacity="0.5" />
      <circle cx="82" cy="69" r="5" fill="#fb7185" opacity="0.5" />
      {mouth}
      {mood === 'thinking' && <circle cx="92" cy="30" r="5" fill="#fff" stroke="#d97706" strokeWidth="2" />}
      {mood === 'cheer' && (
        <g fill="#facc15">
          <path d="M14 18 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" />
          <path d="M100 16 l2 5 5 .6 -4 3.4 1 5 -4 -2.3 -4 2.3 1 -5 -4 -3.4 5 -.6z" />
        </g>
      )}
    </svg>
  )
}

/** Pip with a speech bubble. Bubble text is announced politely to screen readers. */
export function PipSays({
  children,
  mood = 'talking',
  className,
  side = 'right',
  size = 'md',
  actions,
}: {
  children: ReactNode
  mood?: PipMood
  className?: string
  side?: 'left' | 'right'
  size?: 'sm' | 'md'
  actions?: ReactNode
}) {
  return (
    <div className={cn('flex items-end gap-2', side === 'left' && 'flex-row-reverse', className)}>
      <motion.div className={cn('shrink-0 pip-float', size === 'sm' ? 'size-14' : 'size-20')} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Pip mood={mood} className="size-full" />
      </motion.div>
      <AnimatePresence mode="popLayout">
        {children && (
          <motion.div
            key={typeof children === 'string' ? children : 'bubble'}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'relative mb-4 max-w-sm rounded-2xl border-[3px] border-[#f59e0b] bg-[#fffbeb] px-4 py-3 text-ink shadow-lift',
              side === 'right' ? 'rounded-bl-sm' : 'rounded-br-sm',
            )}
            aria-live="polite"
          >
            <div className="text-[15px] leading-snug font-semibold">{children}</div>
            {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
