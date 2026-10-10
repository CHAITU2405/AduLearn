import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Star } from 'lucide-react'
import { usePrefs } from '@/app/context'
import { cn } from '@/components/ui'

function useReduced() {
  const { prefs } = usePrefs()
  return prefs.motion === 'reduce' || (prefs.motion === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)
}

/** Coins fly from where the answer was checked to the HUD coin counter. */
export function CoinBurst({ count, from }: { count: number; from: DOMRect | null }) {
  const reduce = useReduced()
  const [target, setTarget] = useState<DOMRect | null>(null)
  useEffect(() => {
    setTarget(document.getElementById('hud-coins')?.getBoundingClientRect() ?? null)
  }, [])
  if (reduce || !from || !target) return null
  const sx = from.left + from.width / 2
  const sy = from.top + from.height / 2
  const tx = target.left + target.width / 2
  const ty = target.top + target.height / 2
  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const spread = (i - count / 2) * 26
        return (
          <motion.span
            key={i}
            className="absolute grid size-8 place-items-center rounded-full border-[3px] border-[#ca8a04] bg-sun font-display text-sm font-black text-[#92400e] shadow-lift"
            initial={{ x: sx - 16, y: sy - 16, scale: 0.4, opacity: 0 }}
            animate={{ x: [sx - 16, sx - 16 + spread, tx - 16], y: [sy - 16, sy - 90 - (i % 3) * 20, ty - 16], scale: [0.4, 1.1, 0.6], opacity: [0, 1, 1] }}
            transition={{ duration: 0.9, delay: i * 0.05, ease: 'easeInOut' }}
          >
            ¢
          </motion.span>
        )
      })}
    </div>
  )
}

const CONFETTI = ['#f43f5e', '#f97316', '#facc15', '#22c55e', '#0ea5e9', '#6366f1']

export function Confetti({ pieces = 60 }: { pieces?: number }) {
  const reduce = useReduced()
  if (reduce) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[65] overflow-hidden" aria-hidden>
      {Array.from({ length: pieces }, (_, i) => {
        const left = (i * 37) % 100
        const delay = (i % 10) * 0.08
        return (
          <motion.span
            key={i}
            className="absolute top-0 block h-3 w-2 rounded-sm"
            style={{ left: `${left}%`, background: CONFETTI[i % CONFETTI.length] }}
            initial={{ y: -20, rotate: 0, opacity: 1 }}
            animate={{ y: '105vh', rotate: 360 + i * 20, x: [0, (i % 2 ? 1 : -1) * 40, 0] }}
            transition={{ duration: 2.4 + (i % 5) * 0.3, delay, ease: 'easeIn' }}
          />
        )
      })}
    </div>
  )
}

/** Hearts with a pop animation when one is lost. */
export function HeartsBar({ lives, max, className }: { lives: number; max: number; className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-1 rounded-2xl border-[3px] border-white bg-white/90 px-3 py-1.5 shadow-soft', className)}
      role="img"
      aria-label={`${lives} of ${max} hearts left`}
    >
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className="relative size-7">
          <Heart className="absolute inset-0 size-7 text-[#e2e8f0]" aria-hidden strokeWidth={2.4} />
          <AnimatePresence>
            {i < lives && (
              <motion.span
                key="full"
                className="absolute inset-0"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: [1, 1.6, 0], rotate: [0, -20, 30], opacity: [1, 1, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Heart className="size-7 fill-coral text-coral-deep" aria-hidden strokeWidth={2.4} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      ))}
    </div>
  )
}

/** Stars popping in one by one (victory screens). */
export function StarReveal({ stars, size = 'size-16' }: { stars: number; size?: string }) {
  return (
    <div className="flex items-end justify-center gap-2" role="img" aria-label={`${stars} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: i === 2 ? 1.25 : 1, rotate: 0 }}
          transition={{ delay: 0.3 + i * 0.25, type: 'spring', stiffness: 260, damping: 14 }}
          className={i === 2 ? '-translate-y-3' : undefined}
        >
          <Star className={cn(size, i <= stars ? 'fill-sun text-[#ca8a04] drop-shadow' : 'fill-[#efe3c2] text-[#c4a670]')} strokeWidth={1.8} aria-hidden />
        </motion.span>
      ))}
    </div>
  )
}
