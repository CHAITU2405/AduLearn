import type { ReactNode } from 'react'
import type { ChallengeTheme } from './challenge/ChallengePanel'
import { StageBackdrop } from './Stage'

/** Full-screen game stage: illustrated backdrop, HUD, optional characters, centred content. */
export function GameScreen({
  theme,
  hud,
  characters,
  children,
  bottom,
}: {
  theme: ChallengeTheme
  hud: ReactNode
  characters?: ReactNode
  children: ReactNode
  bottom?: ReactNode
}) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <StageBackdrop theme={theme} />
      {characters}
      {hud}
      <main id="main" className="relative z-10 mx-auto w-full max-w-3xl px-3 pt-24 pb-16 sm:px-4">
        {children}
      </main>
      {bottom && <div className="fixed inset-x-0 bottom-0 z-20">{bottom}</div>}
    </div>
  )
}

export function MissionBanner({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto mt-4 w-fit max-w-full rounded-[1.75rem] border-[5px] border-white bg-ink/85 px-8 py-5 text-center text-white shadow-lift backdrop-blur">
      <p className="text-sm font-bold tracking-[0.2em] text-sun uppercase">{eyebrow}</p>
      <h1 className="font-display text-4xl font-bold sm:text-5xl">{title}</h1>
      {subtitle && <p className="mt-1 text-white/80">{subtitle}</p>}
    </div>
  )
}
