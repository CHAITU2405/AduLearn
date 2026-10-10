import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { animate, motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Backpack, Coins, Map as MapIcon, Settings, Star, Volume2, VolumeX } from 'lucide-react'
import { usePrefs } from '@/app/context'
import { AvatarFigure } from '@/components/avatar/AvatarFigure'
import { cn } from '@/components/ui'
import type { ProfileRecord } from '@/data/db'
import { bossRepo, progressRepo, walletRepo } from '@/data/repositories'
import { explorerRank } from '@/core/game/economy'

export function useGameStats(profileId: string) {
  return useLiveQuery(async () => {
    const [wallet, missions, bosses] = await Promise.all([walletRepo.get(profileId), progressRepo.forProfile(profileId), bossRepo.forProfile(profileId)])
    const missionStars = new Map(missions.map((m) => [m.missionId, m.bestStars ?? (m.status === 'completed' ? 1 : 0)]))
    const bossStarsMap = new Map<string, number>()
    for (const b of bosses) if (b.passed) bossStarsMap.set(b.bossId, Math.max(bossStarsMap.get(b.bossId) ?? 0, b.stars ?? 1))
    const totalStars = [...missionStars.values(), ...bossStarsMap.values()].reduce((a, b) => a + b, 0)
    return { wallet, missionStars, bossStars: bossStarsMap, totalStars }
  }, [profileId])
}

function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    const c = animate(prev.current, value, { duration: 0.6, onUpdate: (v) => setShown(Math.round(v)) })
    prev.current = value
    return () => c.stop()
  }, [value])
  return <>{shown}</>
}

const iconBtn = 'grid size-11 place-items-center rounded-2xl border-[3px] border-white bg-white/90 text-ink shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-white'

export function GameHud({ profile, title, back, center, compact = false }: { profile: ProfileRecord; title?: string; back?: { to: string; label: string }; center?: ReactNode; compact?: boolean }) {
  const stats = useGameStats(profile.id)
  const { prefs, setPrefs } = usePrefs()
  const rank = explorerRank(stats?.totalStars ?? 0)
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3 sm:p-4">
      <div className="pointer-events-auto flex min-w-0 items-center gap-2">
        {back ? (
          <Link to={back.to} className={cn(iconBtn, 'w-auto gap-1 px-3 font-display font-bold')} aria-label={back.label}>
            <ArrowLeft className="size-5" aria-hidden /> <span className="hidden sm:inline">{back.label}</span>
          </Link>
        ) : (
          <Link to="/backpack" className="flex items-center gap-2 rounded-2xl border-[3px] border-white bg-white/90 py-1 pr-3 pl-1 shadow-soft" aria-label={`${profile.nickname}, ${rank.title}. Open backpack`}>
            <span className="size-10 overflow-hidden rounded-xl bg-brand-soft">
              <AvatarFigure config={profile.avatar} variant="portrait" className="size-full" />
            </span>
            <span className="hidden min-w-0 leading-tight sm:block">
              <span className="block max-w-32 truncate font-display font-bold">{profile.nickname}</span>
              <span className="block text-xs font-bold text-brand-deep">{rank.title}</span>
            </span>
          </Link>
        )}
        {title && !compact && (
          <span className="hidden rounded-2xl border-[3px] border-white bg-ink/80 px-4 py-2 font-display text-lg font-bold text-white shadow-soft md:block">{title}</span>
        )}
      </div>
      {center && <div className="pointer-events-auto">{center}</div>}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
        <motion.span id="hud-coins" className="flex h-11 items-center gap-1.5 rounded-2xl border-[3px] border-white bg-[#fef3c7] px-3 font-display text-lg font-bold text-[#92400e] shadow-soft" aria-label={`${stats?.wallet.coins ?? 0} coins`}>
          <Coins className="size-5 text-[#ca8a04]" aria-hidden /> <AnimatedNumber value={stats?.wallet.coins ?? 0} />
        </motion.span>
        <span className="hidden h-11 items-center gap-1.5 rounded-2xl border-[3px] border-white bg-white/90 px-3 font-display text-lg font-bold shadow-soft sm:flex" aria-label={`${stats?.totalStars ?? 0} stars`}>
          <Star className="size-5 fill-sun text-[#ca8a04]" aria-hidden /> {stats?.totalStars ?? 0}
        </span>
        {!compact && (
          <>
            <Link to="/world" className={cn(iconBtn, 'hidden sm:grid')} aria-label="World map">
              <MapIcon className="size-5" aria-hidden />
            </Link>
            <Link to="/backpack" className={iconBtn} aria-label="Backpack">
              <Backpack className="size-5" aria-hidden />
            </Link>
            <Link to="/progress" className={cn(iconBtn, 'hidden sm:grid')} aria-label="Journal (my progress)">
              <BookOpen className="size-5" aria-hidden />
            </Link>
          </>
        )}
        <button type="button" className={iconBtn} onClick={() => setPrefs((p) => ({ ...p, sound: !p.sound }))} aria-label={prefs.sound ? 'Mute sound' : 'Turn sound on'} aria-pressed={prefs.sound}>
          {prefs.sound ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
        </button>
        {!compact && (
          <Link to="/settings" className={iconBtn} aria-label="Settings">
            <Settings className="size-5" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  )
}
