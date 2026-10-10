import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useSpring, type AnimationPlaybackControls } from 'framer-motion'
import { Check, Lock, Star, Swords, X } from 'lucide-react'
import { usePrefs } from '@/app/context'
import { AvatarFigure, CreatureFigure } from '@/components/avatar/AvatarFigure'
import { cn } from '@/components/ui'
import { getCharacter } from '@/content/characters'
import type { AvatarConfig } from '@/core/avatar'
import { edgePathData, findPath, neighbourInDirection, pathPoints, polylineLength, type Direction, type SceneGraph } from '@/core/world/graph'
import { play } from '@/lib/sfx'
import { Pip, PipSays, type PipMood } from './Pip'

export type SceneNodeKind = 'gate' | 'mission' | 'boss' | 'check' | 'camp' | 'sign' | 'fact' | 'exit' | 'npc' | 'soon'

export interface SceneNode {
  id: string
  x: number
  y: number
  label: string
  sub?: string
  kind: SceneNodeKind
  state: 'locked' | 'available' | 'completed' | 'neutral'
  stars?: number
  lockedReason?: string
  /** What Pip (or a character) says when the explorer arrives. */
  say?: string
  sayMood?: PipMood
  action?: { label: string; run: () => void }
  /** Character standing at this location. */
  character?: string
  /** Height above the node point where the status marker floats. */
  markerY?: number
}

interface Props {
  width: number
  height: number
  graph: SceneGraph
  nodes: SceneNode[]
  background: ReactNode
  avatar: AvatarConfig
  startNodeId: string
  storageKey: string
  intro?: string
  hud?: ReactNode
  /** Vertical world units visible at once (zoom). */
  viewHeight?: number
}

const SPEED = 300 // world units per second

function loadNode(key: string, fallback: string, valid: Set<string>): string {
  try {
    const v = localStorage.getItem(`adulearn:pos:${key}`)
    return v && valid.has(v) ? v : fallback
  } catch {
    return fallback
  }
}
function saveNode(key: string, id: string) {
  try {
    localStorage.setItem(`adulearn:pos:${key}`, id)
  } catch {
    // ignore
  }
}

export function WorldScene({ width, height, graph, nodes, background, avatar, startNodeId, storageKey, intro, hud, viewHeight = 820 }: Props) {
  const { prefs } = usePrefs()
  const reduce = prefs.motion === 'reduce' || (prefs.motion === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const initial = useMemo(() => loadNode(storageKey, startNodeId, new Set(nodes.map((n) => n.id))), [storageKey, startNodeId, nodes])
  const [current, setCurrent] = useState(initial)
  const [walking, setWalking] = useState(false)
  const [facing, setFacing] = useState<1 | -1>(1)
  const [card, setCard] = useState<string | null>(null)
  const [bubble, setBubble] = useState<{ text: string; mood: PipMood } | null>(intro ? { text: intro, mood: 'talking' } : null)
  const startPos = byId.get(initial) ?? nodes[0]
  const px = useMotionValue(startPos.x)
  const py = useMotionValue(startPos.y)
  const pipX = useSpring(px, { stiffness: 60, damping: 14 })
  const pipY = useSpring(py, { stiffness: 60, damping: 14 })
  const camX = useMotionValue(0)
  const camY = useMotionValue(0)
  const viewport = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1024, h: 700 })
  const anims = useRef<AnimationPlaybackControls[]>([])

  useLayoutEffect(() => {
    const el = viewport.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = useMemo(() => {
    let s = size.h / viewHeight
    if (width * s < size.w) s = size.w / width
    return Math.max(0.35, Math.min(1.4, s))
  }, [size, width, viewHeight])

  // Camera follows the explorer, clamped to the world edges.
  useEffect(() => {
    const clamp = (v: number, view: number, world: number) => {
      const max = world * scale - view
      return max <= 0 ? max / 2 : Math.min(max, Math.max(0, v * scale - view / 2))
    }
    const upd = () => {
      camX.set(-clamp(px.get(), size.w, width))
      camY.set(-clamp(py.get() - 60, size.h, height))
    }
    upd()
    const a = px.on('change', upd)
    const b = py.on('change', upd)
    let last = px.get()
    const c = px.on('change', (v) => {
      if (Math.abs(v - last) > 2) {
        setFacing(v > last ? 1 : -1)
        last = v
      }
    })
    return () => {
      a()
      b()
      c()
    }
  }, [px, py, camX, camY, scale, size, width, height])

  const blocked = useMemo(() => new Set(nodes.filter((n) => n.state === 'locked').map((n) => n.id)), [nodes])

  const arrive = useCallback(
    (id: string) => {
      const n = byId.get(id)
      setCurrent(id)
      saveNode(storageKey, id)
      setCard(id)
      if (n?.say) setBubble({ text: n.say, mood: n.sayMood ?? (n.state === 'locked' ? 'thinking' : 'talking') })
      play(n?.state === 'locked' ? 'locked' : 'tap')
    },
    [byId, storageKey],
  )

  const walkTo = useCallback(
    (target: string) => {
      if (walking) return
      if (target === current) {
        arrive(target)
        return
      }
      const path = findPath(graph, current, target, blocked)
      if (!path) {
        play('locked')
        setBubble({ text: 'That path is blocked for now. Finish the places along the way first!', mood: 'thinking' })
        return
      }
      const pts = pathPoints(graph, path)
      const dist = polylineLength(pts)
      const duration = reduce ? 0.15 : Math.max(0.25, dist / SPEED)
      const times = [0]
      let acc = 0
      for (let i = 1; i < pts.length; i++) {
        acc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
        times.push(dist ? acc / dist : 1)
      }
      setCard(null)
      setWalking(true)
      play('step')
      anims.current.forEach((a) => a.stop())
      const ax = animate(px, pts.map((p) => p.x), { duration, times, ease: 'linear' })
      const ay = animate(py, pts.map((p) => p.y), { duration, times, ease: 'linear' })
      anims.current = [ax, ay]
      void Promise.all([ax, ay]).then(() => {
        setWalking(false)
        arrive(target)
      })
    },
    [walking, current, graph, blocked, reduce, px, py, arrive],
  )

  useEffect(() => () => anims.current.forEach((a) => a.stop()), [])

  // Keyboard: arrows/WASD walk, Enter/E/Space interacts, Esc closes the card.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [role="dialog"], dialog')) return
      const dirs: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }
      const dir = dirs[e.key]
      if (dir) {
        const next = neighbourInDirection(graph, current, dir)
        if (next) {
          e.preventDefault()
          walkTo(next)
        }
      } else if ((e.key === 'Enter' || e.key === 'e' || e.key === ' ') && !t.closest('button, a')) {
        const n = byId.get(current)
        if (n?.action && n.state !== 'locked') {
          e.preventDefault()
          n.action.run()
        } else setCard(current)
      } else if (e.key === 'Escape') setCard(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [graph, current, walkTo, byId])

  const cardNode = card ? byId.get(card) : null
  const counter = Math.min(2, Math.max(1, 1 / scale))

  return (
    <div ref={viewport} className="relative h-dvh w-full overflow-hidden bg-[#7dd3fc] select-none" aria-label="Explorable map">
      <motion.div className="absolute top-0 left-0" style={{ x: camX, y: camY, width, height, scale, transformOrigin: '0 0' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute inset-0" aria-hidden>
          {background}
          {graph.edges.map((e) => (
            <g key={`${e.a}-${e.b}`}>
              <path d={edgePathData(graph, e.a, e.b)} fill="none" stroke="#fde68a" strokeWidth="26" strokeLinecap="round" opacity="0.9" />
              <path d={edgePathData(graph, e.a, e.b)} fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="2 18" strokeLinecap="round" opacity="0.8" />
            </g>
          ))}
        </svg>

        {nodes.map((n) => (
          <NodeMarker key={n.id} node={n} counter={counter} current={n.id === current} onClick={() => walkTo(n.id)} />
        ))}

        {/* Pip follows the explorer */}
        <motion.div className="pointer-events-none absolute top-0 left-0" style={{ x: pipX, y: pipY }}>
          <div className="pip-float absolute -top-[150px] left-[22px] size-[54px]">
            <Pip mood={walking ? 'happy' : 'idle'} className="size-full" />
          </div>
        </motion.div>
        {/* The explorer */}
        <motion.div className="pointer-events-none absolute top-0 left-0 z-10" style={{ x: px, y: py }}>
          <div className="absolute -top-[118px] -left-[40px] h-[120px] w-[80px]" style={{ transform: `scaleX(${facing})` }}>
            <AvatarFigure config={avatar} walking={walking} className="size-full drop-shadow" />
          </div>
        </motion.div>
      </motion.div>

      {hud}

      {/* Pip's speech */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 max-w-[min(92vw,26rem)]">
        {bubble && (
          <div className="pointer-events-auto">
            <PipSays
              mood={bubble.mood}
              size="sm"
              actions={
                <button type="button" onClick={() => setBubble(null)} className="text-xs font-bold text-ink-muted underline">
                  Got it
                </button>
              }
            >
              {bubble.text}
            </PipSays>
          </div>
        )}
      </div>

      {/* Location card */}
      {cardNode && !walking && (
        <motion.div
          key={cardNode.id}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute right-4 bottom-4 z-30 w-[min(92vw,22rem)] rounded-3xl border-4 border-white bg-white/95 p-4 shadow-lift backdrop-blur"
          role="region"
          aria-label={cardNode.label}
        >
          <button type="button" onClick={() => setCard(null)} className="absolute top-2 right-2 rounded-full p-1.5 text-ink-muted hover:bg-paper" aria-label="Close">
            <X className="size-4" aria-hidden />
          </button>
          <p className="text-xs font-bold tracking-wide text-ink-muted uppercase">{kindLabel(cardNode.kind)}</p>
          <p className="pr-6 font-display text-2xl leading-tight font-bold">{cardNode.label}</p>
          {cardNode.sub && <p className="mt-1 text-sm text-ink-soft">{cardNode.sub}</p>}
          {cardNode.stars !== undefined && cardNode.state === 'completed' && <StarRow stars={cardNode.stars} className="mt-2" />}
          {cardNode.state === 'locked' ? (
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-paper p-3 text-sm font-semibold text-ink-soft">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden /> {cardNode.lockedReason ?? 'Locked for now.'}
            </p>
          ) : (
            cardNode.action && (
              <button type="button" className={cn('btn-game mt-4 w-full', cardNode.kind === 'boss' ? 'coral' : cardNode.state === 'completed' ? 'light' : 'orange')} onClick={() => cardNode.action!.run()}>
                {cardNode.kind === 'boss' && <Swords className="size-5" aria-hidden />}
                {cardNode.action.label}
              </button>
            )
          )}
          <p className="mt-2 hidden text-center text-xs text-ink-muted sm:block">Arrow keys to walk · Enter to {cardNode.action ? 'enter' : 'look'}</p>
        </motion.div>
      )}
    </div>
  )
}

function kindLabel(k: SceneNodeKind): string {
  return { gate: 'Region gate', mission: 'Mission', boss: 'Boss challenge', check: 'Knowledge check', camp: 'Basecamp', sign: 'Signpost', fact: 'Hidden scroll', exit: 'Path', npc: 'Character', soon: 'Coming soon' }[k]
}

export function StarRow({ stars, className, size = 'size-6' }: { stars: number; className?: string; size?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${stars} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <Star key={i} className={cn(size, i <= stars ? 'fill-sun text-[#ca8a04]' : 'fill-[#e2e8f0] text-[#cbd5e1]')} aria-hidden />
      ))}
    </span>
  )
}

function NodeMarker({ node: n, counter, current, onClick }: { node: SceneNode; counter: number; current: boolean; onClick: () => void }) {
  const ch = n.character ? getCharacter(n.character) : null
  const markerY = n.markerY ?? 130
  const ring = n.state === 'completed' ? '#22c55e' : n.state === 'available' ? '#facc15' : n.state === 'locked' ? '#94a3b8' : '#38bdf8'
  return (
    <div className="absolute" style={{ left: n.x, top: n.y }}>
      <svg className="pointer-events-none absolute -top-[22px] -left-[60px]" width="120" height="44" aria-hidden>
        <ellipse cx="60" cy="22" rx="52" ry="16" fill={ring} opacity={current ? 0.55 : 0.32} />
        <ellipse cx="60" cy="22" rx="52" ry="16" fill="none" stroke={ring} strokeWidth="4" strokeDasharray={n.state === 'available' ? '10 8' : undefined} className={n.state === 'available' ? 'water-flow' : undefined} />
      </svg>
      {ch && (
        <div className="pointer-events-none absolute -top-[110px] left-[38px] h-[110px] w-[74px]">
          {ch.creature ? <CreatureFigure art={ch.creature} className="size-full" /> : ch.look ? <AvatarFigure config={ch.look} className="size-full" /> : null}
        </div>
      )}
      {/* Status marker */}
      <div className="pointer-events-none absolute -translate-x-1/2" style={{ top: -markerY, transform: `translateX(-50%) scale(${counter})`, transformOrigin: 'bottom center' }}>
        {n.state === 'available' && (n.kind === 'mission' || n.kind === 'boss' || n.kind === 'check' || n.kind === 'gate') && (
          <div className="bounce-marker grid size-10 place-items-center rounded-full border-[3px] border-white bg-sun font-display text-2xl font-black text-[#7c2d12] shadow-lift">
            {n.kind === 'boss' ? <Swords className="size-5" aria-hidden /> : '!'}
          </div>
        )}
        {n.state === 'completed' && n.stars !== undefined && (
          <div className="rounded-full border-[3px] border-white bg-white/95 px-1.5 py-0.5 shadow-lift">
            <StarRow stars={n.stars} size="size-4" />
          </div>
        )}
        {n.state === 'completed' && n.stars === undefined && n.kind !== 'fact' && (
          <div className="grid size-9 place-items-center rounded-full border-[3px] border-white bg-leaf text-white shadow-lift">
            <Check className="size-5" aria-hidden strokeWidth={3} />
          </div>
        )}
        {n.state === 'locked' && (
          <div className="grid size-9 place-items-center rounded-full border-[3px] border-white bg-[#64748b] text-white shadow-lift">
            <Lock className="size-4" aria-hidden />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClick}
        className="absolute -top-[120px] -left-[64px] h-[150px] w-[128px] cursor-pointer rounded-3xl focus-visible:outline-[5px] focus-visible:outline-brand"
        aria-label={`${n.label}${n.state === 'locked' ? ' (locked)' : n.state === 'completed' ? ' (completed)' : n.state === 'available' ? ' (available)' : ''}`}
        data-node={n.id}
      />
      <div className="pointer-events-none absolute top-[18px] left-0" style={{ transform: `translateX(-50%) scale(${counter})`, transformOrigin: 'top center' }}>
        <span
          className={cn(
            'block rounded-full border-2 px-3 py-0.5 font-display text-[15px] font-bold whitespace-nowrap shadow-soft',
            n.state === 'locked' ? 'border-[#cbd5e1] bg-[#f1f5f9] text-ink-muted' : 'border-white bg-white text-ink',
          )}
        >
          {n.label}
        </span>
      </div>
    </div>
  )
}
