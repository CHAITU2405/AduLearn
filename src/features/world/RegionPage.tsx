import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { motion } from 'framer-motion'
import { Dumbbell, Sparkles, X } from 'lucide-react'
import { useRequiredProfile } from '@/app/context'
import { useFactScroll } from '@/components/game/FactScroll'
import { GameHud, useGameStats } from '@/components/game/GameHud'
import { WorldScene, type SceneNode } from '@/components/game/WorldScene'
import { Notice, Pill, ProgressBar, Spinner } from '@/components/ui'
import { chapterNodeStates, CHAPTERS, getBoss, getChapter, getConcept, getMission, getRegion } from '@/content'
import { getCharacter } from '@/content/characters'
import type { Chapter, ChapterNode } from '@/core/content/types'
import type { NodeState } from '@/core/game/progression'
import { BAND_LABELS, explainMastery, masteryBand } from '@/core/learning/mastery'
import { useMastery, useSnapshot } from '@/data/hooks'
import { REGION_SCENES } from '@/game/scenes'

function nodeTitle(chapter: Chapter, n: ChapterNode): string {
  if (n.kind === 'mission') return getMission(n.id)?.title ?? n.id
  if (n.kind === 'boss') return getBoss(n.id)?.title ?? n.id
  return n.assessment === 'diagnostic' ? 'Starting check' : `Follow-up check: ${chapter.title}`
}

/** Explorable region map built from the chapter's real progression state. */
export function RegionPage() {
  const { regionId = '' } = useParams()
  const profile = useRequiredProfile()
  const snapshot = useSnapshot(profile.id)
  const stats = useGameStats(profile.id)
  const navigate = useNavigate()
  const { read, modal } = useFactScroll(profile.id)
  const [skillsOpen, setSkillsOpen] = useState(false)
  const region = getRegion(regionId)
  const scene = REGION_SCENES[regionId]
  const chapter = CHAPTERS.find((c) => c.regionId === regionId && c.status === 'playable')
  const planned = CHAPTERS.find((c) => c.regionId === regionId && c.status === 'planned')

  const nodes = useMemo<SceneNode[] | null>(() => {
    if (!snapshot || !stats || !scene || !chapter || !region) return null
    const states = chapterNodeStates(chapter, snapshot)
    const out: SceneNode[] = []
    const place = (id: string) => scene.places[id]
    out.push({
      id: 'entry',
      ...place('entry'),
      kind: 'exit',
      state: 'neutral',
      action: { label: 'Back to the Isle', run: () => navigate('/world') },
    })
    const lockedReason = (n: ChapterNode, st: Record<string, NodeState>) => {
      const pending = n.requires.filter((r) => st[r] !== 'completed' && !chapter.nodes.find((x) => x.id === r && x.kind === 'assessment' && x.optional))
      return pending.length
        ? `Complete ${pending
            .map((id) =>
              nodeTitle(
                chapter,
                chapter.nodes.find((x) => x.id === id)!,
              ),
            )
            .join(' and ')} first.`
        : 'Locked for now.'
    }
    for (const n of chapter.nodes) {
      const p = place(n.id)
      if (!p) continue
      const state = states[n.id]
      const title = nodeTitle(chapter, n)
      let sub = ''
      let say: string | undefined
      let action: SceneNode['action']
      let stars: number | undefined
      if (n.kind === 'mission') {
        const m = getMission(n.id)!
        sub = `${m.title} — ${m.summary}`
        stars = stats.missionStars.get(n.id)
        say = state === 'available' ? `${getCharacter(m.characterId).name} needs your help here: ${m.summary}` : undefined
        action = { label: state === 'completed' ? 'Play again' : 'Start mission', run: () => navigate(`/mission/${n.id}`) }
      } else if (n.kind === 'boss') {
        const b = getBoss(n.id)!
        sub = `${b.tier === 'chapter' ? 'Chapter boss' : 'Mini-boss'}: ${b.bossName}`
        stars = stats.bossStars.get(n.id)
        say = state === 'available' ? `Careful… ${b.bossName} is here. Use everything you’ve learned!` : undefined
        action = { label: state === 'completed' ? 'Battle again' : 'Face the boss', run: () => navigate(`/boss/${n.id}`) }
      } else {
        sub = n.assessment === 'diagnostic' ? 'Optional: show what you already know. No hearts to lose.' : 'Compare with your starting check.'
        say = state === 'available' && n.assessment === 'followup' ? 'You beat the boss! Try the follow-up check to see how much you’ve grown.' : undefined
        action = { label: state === 'completed' ? 'Retake check' : 'Take the check', run: () => navigate(`/assessment/${chapter.id}/${n.assessment}`) }
      }
      out.push({
        id: n.id,
        ...p,
        label: p.label,
        sub: `${title !== p.label ? `${title}. ` : ''}${sub.replace(`${title} — `, '')}`,
        kind: n.kind === 'assessment' ? 'check' : n.kind,
        state,
        stars,
        lockedReason: lockedReason(n, states),
        say,
        action,
        character: state === 'locked' ? undefined : p.character,
      })
    }
    const factFound = stats.wallet.facts.includes(scene.factId)
    out.push({
      id: 'fact',
      ...place('fact'),
      kind: 'fact',
      state: factFound ? 'completed' : 'available',
      sub: factFound ? 'You have read this scroll.' : 'A scroll is glowing here…',
      say: factFound ? undefined : 'A hidden scroll! Let’s read it.',
      sayMood: 'happy',
      action: { label: factFound ? 'Read again' : 'Read the scroll', run: () => void read(scene.factId) },
    })
    if (planned) {
      out.push({ id: 'soon', ...place('soon'), kind: 'soon', state: 'locked', sub: planned.subtitle, lockedReason: planned.curriculum.note })
    }
    return out
  }, [snapshot, stats, scene, chapter, region, planned, navigate, read])

  if (!region || !scene || !chapter) return <Navigate to="/world" replace />
  if (!snapshot || !nodes || !stats) return <Spinner label="Entering the region" />
  const done = new Set(
    Object.entries(chapterNodeStates(chapter, snapshot))
      .filter(([, s]) => s === 'completed')
      .map(([id]) => id),
  )
  const regionLocked = chapter.nodes.every((n) => chapterNodeStates(chapter, snapshot)[n.id] === 'locked')
  const Bg = scene.Background
  const firstVisit = done.size === 0

  return (
    <>
      <h1 className="sr-only">{region.name}</h1>
      <WorldScene
        width={scene.width}
        height={scene.height}
        graph={{ nodes: nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })), edges: scene.edges }}
        nodes={nodes}
        background={<Bg done={done} factFound={stats.wallet.facts.includes(scene.factId)} />}
        avatar={profile.avatar}
        startNodeId={scene.entryId}
        storageKey={`region:${region.id}:${profile.id}`}
        intro={
          regionLocked
            ? 'This region is still sealed. Complete a mission in another region first!'
            : firstVisit
              ? `Welcome to ${region.name}! Places with a yellow “!” are ready to play. Walk over and tap to begin.`
              : undefined
        }
        hud={
          <GameHud
            profile={profile}
            title={region.name}
            back={{ to: '/world', label: 'Isle map' }}
            center={
              <button type="button" className="btn-game violet !min-h-11 !px-4 !text-base" onClick={() => setSkillsOpen(true)}>
                <Sparkles className="size-5" aria-hidden /> Skills
              </button>
            }
          />
        }
      />
      {skillsOpen && <SkillsDrawer chapter={chapter} profileId={profile.id} onClose={() => setSkillsOpen(false)} />}
      {modal}
    </>
  )
}

/** Concept progress for the region's chapter, with practice shortcuts. */
function SkillsDrawer({ chapter, profileId, onClose }: { chapter: Chapter; profileId: string; onClose: () => void }) {
  const mastery = useMastery(profileId)
  return (
    <div className="fixed inset-0 z-40 bg-ink/40" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="skills-title">
      <motion.aside
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        className="absolute top-0 right-0 h-full w-[min(92vw,24rem)] overflow-y-auto border-l-4 border-white bg-[#f5f3ff] p-5 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute top-3 right-3 rounded-full p-2 hover:bg-white" aria-label="Close">
          <X className="size-5" aria-hidden />
        </button>
        <h2 id="skills-title" className="text-2xl font-bold">
          Your skills
        </h2>
        <p className="mt-1 text-sm text-ink-soft">{getChapter(chapter.id)?.title} · estimates from your answers, not grades.</p>
        <Notice tone="warn" className="mt-3">
          Illustrative sample content — not yet checked against the official AP SSC Class 8 textbook.
        </Notice>
        {!mastery ? (
          <Spinner />
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {chapter.conceptIds.map((id) => {
              const m = mastery[id]
              const band = masteryBand(m)
              return (
                <li key={id} className="rounded-2xl border-2 border-white bg-white p-3 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold">{getConcept(id)?.name}</p>
                    <Pill tone={band === 'secure' ? 'leaf' : band === 'developing' ? 'brand' : band === 'exploring' ? 'orange' : 'muted'}>{BAND_LABELS[band]}</Pill>
                  </div>
                  <ProgressBar value={Math.round((m?.estimate ?? 0) * 100)} max={100} label={`${getConcept(id)?.name} estimate`} tone="violet" className="mt-2" />
                  <p className="mt-1 text-xs text-ink-muted">{explainMastery(m)}</p>
                  {m && m.evidence > 0 && (
                    <Link
                      to={`/practice/${chapter.id}?concept=${encodeURIComponent(id)}`}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#4338ca] hover:underline"
                    >
                      <Dumbbell className="size-4" aria-hidden /> Train at the practice ground
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </motion.aside>
    </div>
  )
}
