import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, Backpack, Check, Coins, Crown, Lock, Map as MapIcon, RotateCcw, ScrollText, Shirt, Sparkles, Star, Swords, TrendingUp, Undo2 } from 'lucide-react'
import { useRequiredProfile } from '@/app/context'
import { AvatarFigure } from '@/components/avatar/AvatarFigure'
import { Confetti } from '@/components/game/challenge/effects'
import { GameHud, useGameStats } from '@/components/game/GameHud'
import { Pip, PipSays } from '@/components/game/Pip'
import { cn, ProgressBar, Spinner } from '@/components/ui'
import { BOSSES, CHAPTERS, MISSIONS, REGIONS } from '@/content'
import { FACTS } from '@/content/facts'
import type { AvatarConfig } from '@/core/avatar'
import { explorerRank, isWearing, takeOffItem, tryOnItem, WARDROBE, wearItem, type WardrobeItem } from '@/core/game/economy'
import type { RewardKind } from '@/core/game/rewards'
import { useRewards } from '@/data/hooks'
import { profileRepo, walletRepo } from '@/data/repositories'
import { ART } from '@/game/art'
import { play } from '@/lib/sfx'

type Tab = 'wardrobe' | 'badges' | 'scrolls' | 'journey'

const TABS: { id: Tab; label: string; icon: typeof Shirt }[] = [
  { id: 'wardrobe', label: 'Wardrobe', icon: Shirt },
  { id: 'badges', label: 'Badges', icon: Award },
  { id: 'scrolls', label: 'Scrolls', icon: ScrollText },
  { id: 'journey', label: 'Journey', icon: MapIcon },
]

/** Backpack: wardrobe shop, earned badges, found scrolls and journey stars. */
export function BackpackPage() {
  const profile = useRequiredProfile()
  const stats = useGameStats(profile.id)
  const [tab, setTab] = useState<Tab>('wardrobe')
  const [trying, setTrying] = useState<WardrobeItem | null>(null)
  const preview: AvatarConfig = trying ? tryOnItem(profile.avatar, trying) : profile.avatar

  if (!stats) return <Spinner label="Opening your backpack" />
  const rank = explorerRank(stats.totalStars)

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <img src={ART.titleArt} alt="" aria-hidden className="fixed inset-0 size-full scale-105 object-cover blur-[4px]" draggable={false} />
      <div className="fixed inset-0 bg-[#0b1f3a]/45" aria-hidden />
      <GameHud profile={profile} title="Backpack" back={{ to: '/world', label: 'Isle map' }} />
      <main id="main" className="relative z-10 mx-auto grid w-full max-w-6xl gap-5 px-3 pt-24 pb-12 sm:px-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <h1 className="sr-only">Backpack</h1>

        {/* Explorer preview */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="panel-game theme-numbers overflow-hidden">
            <div className="relative bg-gradient-to-b from-[#bae6fd] to-[#fef3c7] px-4 pt-4 pb-2">
              <svg viewBox="0 0 200 50" className="absolute inset-x-0 bottom-0 w-full" aria-hidden>
                <path d="M0 34 Q50 14 100 28 T200 24 V50 H0 Z" fill="#86efac" />
              </svg>
              <div className="pip-float absolute top-3 right-3 size-14">
                <Pip mood={trying ? 'happy' : 'idle'} className="size-full sprite-outline" />
              </div>
              <motion.div
                key={trying?.id ?? 'current'}
                initial={{ scale: 0.92, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative mx-auto h-40 w-28 sm:h-60 sm:w-44"
              >
                <AvatarFigure config={preview} className="size-full sprite-shadow" title={`${profile.nickname}${trying ? ` trying on the ${trying.name}` : ''}`} />
              </motion.div>
            </div>
            <div className="px-4 pt-3 pb-4">
              <p className="font-display text-2xl font-bold">{profile.nickname}</p>
              <p className="flex items-center gap-1.5 text-sm font-bold text-brand-deep">
                <Crown className="size-4" aria-hidden /> {rank.title}
              </p>
              {rank.next !== null && (
                <div className="mt-2">
                  <ProgressBar value={stats.totalStars} max={rank.next} label="Progress to the next rank" tone="orange" />
                  <p className="mt-1 text-xs text-ink-muted">
                    {rank.next - stats.totalStars} more star{rank.next - stats.totalStars === 1 ? '' : 's'} to the next rank
                  </p>
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-[#fef3c7] p-2 text-center">
                  <p className="flex items-center justify-center gap-1 font-display text-2xl font-bold text-[#92400e]">
                    <Coins className="size-5" aria-hidden /> {stats.wallet.coins}
                  </p>
                  <p className="text-xs font-bold text-[#92400e]/80">coins</p>
                </div>
                <div className="rounded-2xl bg-white p-2 text-center shadow-soft">
                  <p className="flex items-center justify-center gap-1 font-display text-2xl font-bold">
                    <Star className="size-5 fill-sun text-[#ca8a04]" aria-hidden /> {stats.totalStars}
                  </p>
                  <p className="text-xs font-bold text-ink-muted">stars</p>
                </div>
              </div>
              {trying && (
                <button type="button" className="btn-game light mt-3 w-full !min-h-10 !text-base" onClick={() => setTrying(null)}>
                  <Undo2 className="size-4" aria-hidden /> Stop trying on
                </button>
              )}
              <Link to="/settings" className="mt-2 block text-center text-sm font-bold text-brand-deep hover:underline">
                Change hair, colours and outfit
              </Link>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div role="tablist" aria-label="Backpack sections" className="mb-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                onClick={() => {
                  play('tap')
                  setTab(t.id)
                }}
                className={cn('btn-game !min-h-11 !px-4 !text-base', tab === t.id ? 'orange' : 'light')}
              >
                <t.icon className="size-5" aria-hidden /> {t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === 'wardrobe' && (
              <Wardrobe avatar={profile.avatar} profileId={profile.id} coins={stats.wallet.coins} owned={stats.wallet.owned} trying={trying} onTry={setTrying} />
            )}
            {tab === 'badges' && <Badges profileId={profile.id} />}
            {tab === 'scrolls' && <Scrolls found={stats.wallet.facts} />}
            {tab === 'journey' && <Journey missionStars={stats.missionStars} bossStars={stats.bossStars} totalEarned={stats.wallet.totalEarned} />}
          </div>
        </section>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Wardrobe shop
// ---------------------------------------------------------------------------

function Wardrobe({
  avatar,
  profileId,
  coins,
  owned,
  trying,
  onTry,
}: {
  avatar: AvatarConfig
  profileId: string
  coins: number
  owned: string[]
  trying: WardrobeItem | null
  onTry: (i: WardrobeItem | null) => void
}) {
  const [confirm, setConfirm] = useState<WardrobeItem | null>(null)
  const [celebrate, setCelebrate] = useState<WardrobeItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function buy(item: WardrobeItem) {
    setConfirm(null)
    const res = await walletRepo.buy(profileId, item.id)
    if (!res.ok) {
      setError(
        res.reason === 'not-enough-coins' ? 'Not enough coins yet — keep exploring!' : res.reason === 'already-owned' ? 'You already own this.' : 'That item is not available.',
      )
      play('locked')
      return
    }
    const worn = wearItem(avatar, item, res.owned)
    if (worn) await profileRepo.update(profileId, { avatar: worn })
    play('win')
    onTry(null)
    setCelebrate(item)
  }

  async function wear(item: WardrobeItem) {
    const worn = wearItem(avatar, item, owned)
    if (!worn) return
    play('star')
    await profileRepo.update(profileId, { avatar: worn })
    onTry(null)
  }

  async function takeOff(item: WardrobeItem) {
    play('tap')
    await profileRepo.update(profileId, { avatar: takeOffItem(avatar, item) })
  }

  return (
    <div>
      <PipSays mood="happy" size="sm" className="mb-4">
        Tap an item to try it on. Coins come from solving challenges and finding hidden scrolls — prices never change, and there are no surprise boxes!
      </PipSays>
      {error && (
        <p role="alert" className="mb-3 rounded-2xl bg-coral-soft px-4 py-2 font-semibold text-coral-deep">
          {error}
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {WARDROBE.map((item) => {
          const isOwned = owned.includes(item.id)
          const wearing = isWearing(avatar, item)
          const isTrying = trying?.id === item.id
          const short = Math.max(0, item.price - coins)
          const portrait = item.field === 'accessory'
          return (
            <li key={item.id} data-item={item.id} className={cn('panel-game theme-words flex flex-col overflow-hidden', isTrying && 'ring-4 ring-sun')}>
              <button
                type="button"
                onClick={() => {
                  play('tap')
                  onTry(isTrying ? null : item)
                }}
                aria-pressed={isTrying}
                aria-label={`Try on the ${item.name}`}
                className="relative grid h-36 place-items-center bg-gradient-to-b from-[#e0e7ff] to-[#f5f3ff]"
              >
                <span className={cn('overflow-hidden', portrait ? 'size-28' : 'h-32 w-24')}>
                  <AvatarFigure config={tryOnItem(avatar, item)} variant={portrait ? 'portrait' : 'full'} className="size-full sprite-shadow" />
                </span>
                {wearing && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-leaf px-2.5 py-1 text-xs font-bold text-white">
                    <Check className="size-3.5" aria-hidden /> Wearing
                  </span>
                )}
                {isOwned && !wearing && <span className="absolute top-2 left-2 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-leaf-deep">Owned</span>}
                {isTrying && <span className="absolute top-2 right-2 rounded-full bg-sun px-2.5 py-1 text-xs font-bold text-[#422006]">Trying on</span>}
              </button>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <p className="font-display text-xl font-bold">{item.name}</p>
                <p className="text-sm text-ink-soft">{item.description}</p>
                <div className="mt-auto pt-3">
                  {wearing ? (
                    <button type="button" className="btn-game light w-full !min-h-11 !text-base" onClick={() => void takeOff(item)}>
                      <RotateCcw className="size-4" aria-hidden /> Take off
                    </button>
                  ) : isOwned ? (
                    <button type="button" className="btn-game green w-full !min-h-11 !text-base" onClick={() => void wear(item)}>
                      <Shirt className="size-4" aria-hidden /> Wear
                    </button>
                  ) : (
                    <>
                      <button type="button" className="btn-game yellow w-full !min-h-11 !text-base" disabled={short > 0} onClick={() => setConfirm(item)}>
                        <Coins className="size-4" aria-hidden /> Buy for {item.price}
                      </button>
                      {short > 0 && (
                        <p className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-ink-muted">
                          <Lock className="size-3" aria-hidden /> {short} more coins needed
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <AnimatePresence>
        {confirm && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-labelledby="buy-title" onClick={() => setConfirm(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="panel-game theme-numbers w-[min(92vw,26rem)] p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto h-36 w-28">
                <AvatarFigure config={tryOnItem(avatar, confirm)} className="size-full sprite-shadow" />
              </div>
              <h2 id="buy-title" className="mt-2 text-2xl font-bold">
                Buy the {confirm.name}?
              </h2>
              <p className="mt-1 text-ink-soft">
                It costs <strong>{confirm.price} coins</strong>. You’ll have {coins - confirm.price} left, and you’ll put it on straight away.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button type="button" className="btn-game light" onClick={() => setConfirm(null)}>
                  Not now
                </button>
                <button type="button" className="btn-game orange" onClick={() => void buy(confirm)} autoFocus>
                  <Coins className="size-5" aria-hidden /> Buy it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {celebrate && (
        <>
          <Confetti pieces={40} />
          <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="new-look" onClick={() => setCelebrate(null)}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              className="panel-game theme-numbers w-[min(92vw,24rem)] p-6 text-center"
            >
              <Sparkles className="mx-auto size-10 text-[#ca8a04]" aria-hidden />
              <h2 id="new-look" className="mt-1 text-3xl font-bold">
                New look!
              </h2>
              <p className="mt-1 text-ink-soft">You’re now wearing the {celebrate.name}.</p>
              <button type="button" className="btn-game green mt-5" onClick={() => setCelebrate(null)} autoFocus>
                Looking good!
              </button>
            </motion.div>
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Badges, scrolls and journey
// ---------------------------------------------------------------------------

const BADGE_STYLE: Record<RewardKind, { icon: typeof Award; color: string }> = {
  'mission-complete': { icon: Award, color: '#f97316' },
  'boss-defeated': { icon: Swords, color: '#6366f1' },
  'chapter-complete': { icon: Crown, color: '#ca8a04' },
  'concept-secure': { icon: Sparkles, color: '#14b8a6' },
  'misconception-corrected': { icon: RotateCcw, color: '#f43f5e' },
  'assessment-improved': { icon: TrendingUp, color: '#16a34a' },
}

function Badges({ profileId }: { profileId: string }) {
  const rewards = useRewards(profileId)
  if (!rewards) return <Spinner />
  if (rewards.length === 0) {
    return <PipSays mood="thinking">No badges yet! You earn them by finishing missions, beating bosses, fixing mistakes and showing you really understand a skill.</PipSays>
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rewards.map((r, i) => {
        const style = BADGE_STYLE[r.kind]
        return (
          <motion.li
            key={r.id}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: Math.min(i, 10) * 0.04 }}
            className="flex items-center gap-3 rounded-3xl border-4 border-white bg-white/95 p-3 shadow-lift"
          >
            <span
              className="grid size-14 shrink-0 place-items-center rounded-full border-4 border-white text-white shadow-[0_4px_0_rgb(0_0_0/0.2)]"
              style={{ background: style.color }}
            >
              <style.icon className="size-7" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg leading-tight font-bold">{r.title}</span>
              <span className="block text-sm text-ink-soft">{r.description}</span>
              <span className="text-xs text-ink-muted">{new Date(r.earnedAt).toLocaleDateString()}</span>
            </span>
          </motion.li>
        )
      })}
    </ul>
  )
}

function Scrolls({ found }: { found: string[] }) {
  return (
    <div>
      <p className="mb-3 font-display text-lg font-bold text-white text-outline">
        {found.length} of {FACTS.length} hidden scrolls found
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {FACTS.map((f) => {
          const has = found.includes(f.id)
          return (
            <li key={f.id} className={cn('relative rounded-[1.5rem] border-[5px] p-5', has ? 'border-[#a16207] bg-[#fef3c7]' : 'border-white/70 bg-white/60')}>
              {has ? (
                <>
                  <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#a16207] uppercase">
                    <ScrollText className="size-4" aria-hidden /> {f.where}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-[#422006]">{f.title}</h3>
                  <p className="mt-1 text-[#422006]">{f.text}</p>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2 font-display text-xl font-bold text-ink-soft">
                    <Lock className="size-5" aria-hidden /> Undiscovered scroll
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">Hint: look around {f.where}.</p>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Journey({ missionStars, bossStars, totalEarned }: { missionStars: Map<string, number>; bossStars: Map<string, number>; totalEarned: number }) {
  const rows = useMemo(
    () =>
      REGIONS.map((r) => {
        const chapterIds = CHAPTERS.filter((c) => c.regionId === r.id && c.status === 'playable').map((c) => c.id)
        const missions = MISSIONS.filter((m) => chapterIds.includes(m.chapterId))
        const bosses = BOSSES.filter((b) => chapterIds.includes(b.chapterId))
        const earned = missions.reduce((a, m) => a + (missionStars.get(m.id) ?? 0), 0) + bosses.reduce((a, b) => a + (bossStars.get(b.id) ?? 0), 0)
        return { region: r, earned, max: (missions.length + bosses.length) * 3 }
      }),
    [missionStars, bossStars],
  )
  return (
    <div className="flex flex-col gap-3">
      {rows.map(({ region, earned, max }) => (
        <div key={region.id} className="flex flex-col gap-2 rounded-3xl border-4 border-white bg-white/95 p-4 shadow-lift sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: region.theme.primary }}>
            <Backpack className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold">{region.name}</p>
            <ProgressBar value={earned} max={max} label={`${region.name} stars`} tone="orange" className="mt-1" />
          </div>
          <p className="flex items-center gap-1 font-display text-xl font-bold">
            <Star className="size-5 fill-sun text-[#ca8a04]" aria-hidden /> {earned}/{max}
          </p>
          <Link to={`/region/${region.id}`} className="btn-game light !min-h-10 !px-4 !text-base">
            Go
          </Link>
        </div>
      ))}
      <p className="font-semibold text-white text-outline">Total coins earned on your journey: {totalEarned}</p>
    </div>
  )
}
