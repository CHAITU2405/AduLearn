import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AvatarFigure, CreatureFigure, type Mood } from '@/components/avatar/AvatarFigure'
import { Birds, Cloud, House, Pine, Tent, Tree } from '@/components/game/art'
import { cn } from '@/components/ui'
import { getCharacter } from '@/content/characters'
import type { AvatarConfig } from '@/core/avatar'
import type { ChallengeTheme } from './challenge/ChallengePanel'

export function themeForSubject(subject: string): ChallengeTheme {
  return subject === 'mathematics' ? 'numbers' : subject === 'english' ? 'words' : 'discovery'
}

/** Full-screen illustrated backdrop behind challenge screens. */
export function StageBackdrop({ theme }: { theme: ChallengeTheme }) {
  const skies: Record<ChallengeTheme, [string, string]> = {
    numbers: ['#fdba74', '#fef3c7'],
    words: ['#a5b4fc', '#eef2ff'],
    discovery: ['#5eead4', '#ecfeff'],
    boss: ['#1e1b4b', '#475569'],
  }
  const [a, b] = skies[theme]
  return (
    <svg className="fixed inset-0 -z-0 size-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id={`stage-${theme}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#stage-${theme})`} />
      {theme === 'numbers' && (
        <g>
          <path d="M0 520 L140 420 L300 470 L460 380 L640 460 L820 400 L1000 470 L1180 380 L1360 450 L1600 400 L1600 900 L0 900 Z" fill="#fb923c" opacity="0.5" />
          <path d="M0 640 C300 610 500 620 640 660 L660 900 L0 900 Z" fill="#ea580c" />
          <path d="M0 640 C300 610 500 620 640 660 L640 680 C500 640 300 640 0 670 Z" fill="#86efac" />
          <path d="M960 660 C1100 620 1300 610 1600 640 L1600 900 L940 900 Z" fill="#ea580c" />
          <path d="M960 660 C1100 620 1300 610 1600 640 L1600 670 C1300 640 1100 650 960 680 Z" fill="#86efac" />
          <path d="M700 900 C740 800 860 800 900 900 Z" fill="#38bdf8" />
          <Cloud x={300} y={150} s={1.2} />
          <Cloud x={1250} y={200} />
          <Birds x={900} y={160} />
          <Tree x={150} y={660} s={1.2} />
          <Tent x={1420} y={650} />
        </g>
      )}
      {theme === 'words' && (
        <g>
          <path d="M0 560 C400 500 800 540 1200 500 C1400 480 1500 500 1600 490 L1600 900 L0 900 Z" fill="#c4b5fd" opacity="0.7" />
          <path d="M0 680 C500 650 1100 680 1600 650 L1600 900 L0 900 Z" fill="#86efac" />
          {[100, 260, 1260, 1440].map((x, i) => (
            <House key={x} x={x} y={690} roof={['#8b5cf6', '#f97316', '#0ea5e9', '#6366f1'][i]} lit s={1.3} />
          ))}
          <path d="M0 140 Q400 220 800 140 T1600 140" fill="none" stroke="#475569" strokeWidth="2" />
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d={`M${50 + i * 100} ${150 + Math.sin(i) * 30} l14 26 l14 -26 z`} fill={['#f43f5e', '#facc15', '#22c55e', '#0ea5e9'][i % 4]} />
          ))}
          <Cloud x={700} y={260} />
          <Tree x={400} y={700} />
          <Tree x={1150} y={700} color="#22c55e" />
        </g>
      )}
      {theme === 'discovery' && (
        <g>
          <path d="M0 520 L160 420 L320 500 L480 400 L660 480 L840 410 L1020 480 L1200 400 L1380 470 L1600 410 L1600 900 L0 900 Z" fill="#14b8a6" opacity="0.35" />
          <path d="M0 680 C500 640 1100 690 1600 650 L1600 900 L0 900 Z" fill="#6ee7b7" />
          {[80, 180, 280, 1320, 1420, 1520].map((x, i) => (
            <Pine key={x} x={x} y={690 + (i % 2) * 20} s={1.3} />
          ))}
          <g transform="translate(1180 660)">
            <path d="M-90 0 A90 90 0 0 1 90 0 Z" fill="#ccfbf1" stroke="#14b8a6" strokeWidth="6" />
          </g>
          <Cloud x={500} y={180} />
          <Birds x={1000} y={200} />
        </g>
      )}
      {theme === 'boss' && (
        <g>
          <Cloud x={300} y={140} s={1.6} dark />
          <Cloud x={1200} y={120} s={1.8} dark />
          <Cloud x={800} y={80} s={1.2} dark />
          <path className="twinkle" d="M1180 180 L1150 260 L1190 260 L1160 340" stroke="#facc15" strokeWidth="8" fill="none" strokeLinejoin="round" />
          <path className="twinkle" d="M320 200 L300 250 L326 250 L306 300" stroke="#facc15" strokeWidth="6" fill="none" />
          <ellipse cx="800" cy="860" rx="900" ry="200" fill="#334155" />
          <ellipse cx="800" cy="840" rx="620" ry="110" fill="#475569" />
          {[200, 420, 1180, 1400].map((x) => (
            <path key={x} d={`M${x - 30} 760 L${x - 18} 640 L${x + 18} 640 L${x + 30} 760 Z`} fill="#64748b" stroke="#1e293b" strokeWidth="4" />
          ))}
        </g>
      )}
    </svg>
  )
}

/** A physical progress track that builds up with each correct answer. */
export function ProgressTrack({ theme, filled, total, caption }: { theme: ChallengeTheme; filled: number; total: number; caption: ReactNode }) {
  const f = Math.min(filled, total)
  const w = total * 52 + 70
  return (
    <div className="mx-auto mb-4 w-fit max-w-full rounded-3xl border-[3px] border-white bg-white/80 px-4 py-2 shadow-soft backdrop-blur" role="img" aria-label={typeof caption === 'string' ? caption : undefined}>
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
                  <motion.rect key="on" x={x} y={30} width="44" height="14" rx="3" fill="#b45309" stroke="#78350f" strokeWidth="2" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} />
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
      <motion.div key={`npc-${npcMood}`} initial={{ y: npcMood === 'excited' ? 0 : 0 }} animate={npcMood === 'excited' ? { y: [0, -24, 0] } : { y: 0 }} transition={{ duration: 0.5 }} className="pointer-events-none fixed bottom-0 left-[max(0px,calc(50%-46rem))] z-0 hidden h-[300px] w-[210px] xl:block" aria-hidden>
        {ch.creature ? <CreatureFigure art={ch.creature} className="size-full" /> : ch.look ? <AvatarFigure config={ch.look} mood={npcMood} className="size-full drop-shadow-xl" /> : null}
      </motion.div>
      <motion.div key={`me-${playerMood}`} animate={playerMood === 'excited' ? { y: [0, -24, 0] } : playerMood === 'sad' ? { x: [0, -8, 8, 0] } : {}} transition={{ duration: 0.5 }} className={cn('pointer-events-none fixed right-[max(0px,calc(50%-46rem))] bottom-0 z-0 hidden h-[300px] w-[210px] xl:block')} aria-hidden>
        <div className="size-full" style={{ transform: 'scaleX(-1)' }}>
          <AvatarFigure config={avatar} mood={playerMood} className="size-full drop-shadow-xl" />
        </div>
      </motion.div>
    </>
  )
}
