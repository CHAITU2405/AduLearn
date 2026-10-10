import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Coins } from 'lucide-react'
import { Pip, type PipMood } from './Pip'
import { Confetti, StarReveal } from './challenge/effects'

/** Victory / defeat card shown over the stage. */
export function OutcomeCard({
  kind,
  title,
  subtitle,
  stars,
  coins,
  children,
  actions,
  pipLine,
}: {
  kind: 'victory' | 'defeat'
  title: string
  subtitle?: string
  stars?: number
  coins?: number
  children?: ReactNode
  actions: ReactNode
  pipLine?: string
}) {
  const mood: PipMood = kind === 'victory' ? 'cheer' : 'sad'
  return (
    <>
      {kind === 'victory' && <Confetti />}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className={`panel-game relative overflow-visible ${kind === 'victory' ? 'theme-numbers' : 'theme-boss'}`}
      >
        <div className={`rounded-t-[1.3rem] px-6 pt-8 pb-5 text-center ${kind === 'victory' ? 'bg-gradient-to-b from-[#fde68a] to-[#fff7ed]' : 'bg-gradient-to-b from-[#cbd5e1] to-[#f8fafc]'}`}>
          <div className="pip-float absolute -top-12 left-1/2 size-24 -translate-x-1/2">
            <Pip mood={mood} className="size-full" />
          </div>
          <h2 className="mt-6 font-display text-4xl font-bold sm:text-5xl">{title}</h2>
          {subtitle && <p className="mt-1 text-lg text-ink-soft">{subtitle}</p>}
          {stars !== undefined && stars > 0 && (
            <div className="mt-4">
              <StarReveal stars={stars} />
            </div>
          )}
          {coins !== undefined && coins > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sun px-4 py-1 font-display text-lg font-bold text-[#422006]">
              <Coins className="size-5" aria-hidden /> +{coins} coins earned
            </p>
          )}
          {pipLine && <p className="mx-auto mt-3 max-w-md rounded-2xl bg-white/80 px-4 py-2 font-semibold">Pip: “{pipLine}”</p>}
        </div>
        {children && <div className="px-6 py-5">{children}</div>}
        <div className="flex flex-wrap justify-center gap-3 border-t-[3px] border-black/10 px-6 py-5">{actions}</div>
      </motion.div>
    </>
  )
}
