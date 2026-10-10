import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Info, Play, Sparkles, UserRoundCog, Users } from 'lucide-react'
import { useProfile } from '@/app/context'
import { AvatarFigure } from '@/components/avatar/AvatarFigure'
import { Logo } from '@/components/brand/Logo'
import { PipSays } from '@/components/game/Pip'
import { useProfiles } from '@/data/hooks'
import { ART } from '@/game/art'
import { play } from '@/lib/sfx'

/** Game title screen: painted key art, logo, new adventure and save slots. */
export function WelcomePage() {
  const profiles = useProfiles() ?? []
  const { selectProfile } = useProfile()
  const navigate = useNavigate()

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <img src={ART.titleArt} alt="" aria-hidden className="absolute inset-0 size-full object-cover" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1f3a]/70 via-[#0b1f3a]/25 to-transparent" aria-hidden />
      <main id="main" className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col justify-center gap-6 px-4 py-10 sm:px-8">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-fit rounded-3xl border-4 border-white bg-white/95 px-5 py-3 shadow-lift">
          <Logo className="[&_span.text-2xl]:text-4xl [&>span:first-child]:size-14 [&>span:first-child]:text-3xl" />
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-xl font-display text-5xl leading-tight font-bold text-white text-outline sm:text-6xl"
        >
          Learn by going on an adventure.
        </motion.h1>
        <p className="max-w-lg text-lg font-semibold text-white/95 text-outline">
          Explore the Isle of Learning, help its people, defeat storm bosses — and master Class 8 English, Maths and Science along the way.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/start" onClick={() => play('open')} className="btn-game orange !min-h-16 !px-8 !text-2xl">
            <Sparkles className="size-7" aria-hidden /> New adventure
          </Link>
        </div>

        {profiles.length > 0 && (
          <section aria-labelledby="slots" className="max-w-3xl">
            <h2 id="slots" className="mb-2 flex items-center gap-2 font-display text-xl font-bold text-white text-outline">
              <Play className="size-5" aria-hidden /> Continue your journey
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((p, i) => (
                <motion.li key={p.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.05 }}>
                  <button
                    type="button"
                    onClick={async () => {
                      play('open')
                      await selectProfile(p.id)
                      navigate('/world')
                    }}
                    className="group flex w-full items-center gap-3 rounded-3xl border-4 border-white bg-white/95 p-2 pr-4 text-left shadow-lift transition-transform hover:-translate-y-1"
                  >
                    <span className="size-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-b from-brand-soft to-white">
                      <AvatarFigure config={p.avatar} variant="portrait" className="size-full" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-xl font-bold">{p.nickname}</span>
                      <span className="text-sm text-ink-muted">Last played {new Date(p.lastActiveAt).toLocaleDateString()}</span>
                      {p.demo && <span className="block text-xs font-bold text-orange-deep">Demo data</span>}
                    </span>
                    <Play className="ml-auto size-6 shrink-0 text-orange transition-transform group-hover:scale-125" aria-hidden />
                  </button>
                </motion.li>
              ))}
            </ul>
          </section>
        )}

        <nav aria-label="More" className="flex flex-wrap gap-2">
          <Link to="/teacher" className="btn-game light !min-h-10 !px-4 !text-base">
            <Users className="size-4" aria-hidden /> Teacher view
          </Link>
          <Link to="/settings" className="btn-game light !min-h-10 !px-4 !text-base">
            <UserRoundCog className="size-4" aria-hidden /> Settings & data
          </Link>
          <Link to="/about" className="btn-game light !min-h-10 !px-4 !text-base">
            <Info className="size-4" aria-hidden /> About
          </Link>
        </nav>
        <p className="max-w-xl text-sm font-semibold text-white/90 text-outline">
          Progress is saved in this browser on this device only — no account needed. Clearing browser data removes it; export a copy from Settings.
        </p>
      </main>
      <div className="pointer-events-none absolute right-4 bottom-4 z-10 hidden md:block">
        <PipSays mood="happy">Hi, I’m Pip! Ready for an adventure?</PipSays>
      </div>
      <p className="absolute right-4 bottom-1 z-10 text-xs font-semibold text-white/80 text-outline md:hidden">Team Spidey</p>
      <p className="absolute bottom-1 left-4 z-10 hidden text-xs font-semibold text-white/80 text-outline md:block">AduLearn · made by Team Spidey</p>
    </div>
  )
}
