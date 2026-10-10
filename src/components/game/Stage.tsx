import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AvatarFigure, CreatureFigure, type Mood } from '@/components/avatar/AvatarFigure'
import { cn } from '@/components/ui'
import { getCharacter } from '@/content/characters'
import type { AvatarConfig } from '@/core/avatar'
import type { ChallengeTheme } from './challenge/ChallengePanel'
import { ART } from '@/game/art'

export function themeForSubject(subject: string): ChallengeTheme {
  return subject === 'mathematics' ? 'numbers' : subject === 'english' ? 'words' : 'discovery'
}

/** Full-screen painted backdrop behind challenge screens. */
export function StageBackdrop({ theme }: { theme: ChallengeTheme }) {
  const src = { numbers: ART.stageNumbers, words: ART.stageWords, discovery: ART.stageDiscovery, boss: ART.stageBoss }[theme]
  return (
    <div className="fixed inset-0 -z-0" aria-hidden>
      <img src={src} alt="" className="size-full object-cover" draggable={false} />
      <div
        className={
          theme === 'boss'
            ? 'absolute inset-0 bg-gradient-to-b from-[#1e1b4b]/30 via-transparent to-[#1e1b4b]/40'
            : 'absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-black/15'
        }
      />
    </div>
  )
}

/** A physical progress track that builds up with each correct answer. */
export function ProgressTrack({ theme, filled, total, caption }: { theme: ChallengeTheme; filled: number; total: number; caption: ReactNode }) {
  const f = Math.min(filled, total)
  const w = total * 52 + 70
  return (
    <div
      className="mx-auto mb-4 w-fit max-w-full rounded-3xl border-[3px] border-white bg-white/80 px-4 py-2 shadow-soft backdrop-blur"
      role="img"
      aria-label={typeof caption === 'string' ? caption : undefined}
    >
      <div className="text-center text-sm font-bold text-ink-soft">{caption}</div>
      <svg viewBox={`0 0 ${w} 64`} className="mx-auto h-14 max-w-full" style={{ width: w }} aria-hidden>
        {theme === 'numbers' && (
          <>
            <path d={`M0 30 L35 30 L35 64 L0 64 Z M${w - 35} 30 L${w} 30 L${w} 64 L${w - 35} 64 Z`} fill="#ea580c" />
            <path d={`M35 22 Q${w / 2} 44 ${w - 35} 22`} fill="none" stroke="#78350f" strokeWidth="3" />
          </>
        )}
        {Array.from({ length: total }, (_, i) => {
          const x = 35 + i * 52 + 4
          const on = i < f
          return (
            <AnimatePresence key={i}>
              {theme === 'numbers' &&
                (on ? (
                  <motion.rect
                    key="on"
                    x={x}
                    y={30}
                    width="44"
                    height="14"
                    rx="3"
                    fill="#b45309"
                    stroke="#78350f"
                    strokeWidth="2"
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  />
                ) : (
                  <rect key="off" x={x} y={30} width="44" height="14" rx="3" fill="none" stroke="#78350f" strokeWidth="2" strokeDasharray="5 4" opacity="0.5" />
                ))}
              {theme === 'words' &&
                (on ? (
                  <motion.g key="on" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
                    <rect x={x + 6} y={8} width="32" height="48" rx="3" fill={['#6366f1', '#f43f5e', '#f97316', '#22c55e', '#0ea5e9'][i % 5]} stroke="#1e1b4b" strokeWidth="2" />
                    <path d={`M${x + 12} 18 L${x + 32} 18 M${x + 12} 46 L${x + 32} 46`} stroke="#fff" strokeWidth="2" opacity="0.7" />
                  </motion.g>
                ) : (
                  <rect key="off" x={x + 6} y={8} width="32" height="48" rx="3" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="5 4" opacity="0.5" />
                ))}
              {(theme === 'discovery' || theme === 'boss') &&
                (on ? (
                  <motion.g key="on" initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: `${x + 22}px 32px` }}>
                    <rect x={x + 8} y={6} width="28" height="52" rx="8" fill="#5eead4" stroke="#0f766e" strokeWidth="3" />
                    <path className="twinkle" d={`M${x + 24} 14 L${x + 16} 34 L${x + 24} 34 L${x + 18} 52`} stroke="#fde047" strokeWidth="3" fill="none" />
                  </motion.g>
                ) : (
                  <rect key="off" x={x + 8} y={6} width="28" height="52" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" strokeDasharray="5 4" />
                ))}
            </AnimatePresence>
          )
        })}
      </svg>
    </div>
  )
}

/** The mission giver and the explorer standing either side of the challenge (wide screens). */
export function StageCharacters({ npcId, avatar, npcMood, playerMood }: { npcId: string; avatar: AvatarConfig; npcMood: Mood; playerMood: Mood }) {
  const ch = getCharacter(npcId)
  return (
    <>
      <motion.div
        key={`npc-${npcMood}`}
        initial={{ y: npcMood === 'excited' ? 0 : 0 }}
        animate={npcMood === 'excited' ? { y: [0, -24, 0] } : { y: 0 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-none fixed bottom-0 left-[max(0px,calc(50%-46rem))] z-0 hidden h-[300px] w-[210px] xl:block"
        aria-hidden
      >
        {ch.creature ? (
          <CreatureFigure art={ch.creature} className="size-full sprite-outline-lg" />
        ) : ch.look ? (
          <AvatarFigure config={ch.look} mood={npcMood} className="size-full sprite-shadow" />
        ) : null}
      </motion.div>
      <motion.div
        key={`me-${playerMood}`}
        animate={playerMood === 'excited' ? { y: [0, -24, 0] } : playerMood === 'sad' ? { x: [0, -8, 8, 0] } : {}}
        transition={{ duration: 0.5 }}
        className={cn('pointer-events-none fixed right-[max(0px,calc(50%-46rem))] bottom-0 z-0 hidden h-[300px] w-[210px] xl:block')}
        aria-hidden
      >
        <div className="size-full" style={{ transform: 'scaleX(-1)' }}>
          <AvatarFigure config={avatar} mood={playerMood} className="size-full sprite-shadow" />
        </div>
      </motion.div>
    </>
  )
}
