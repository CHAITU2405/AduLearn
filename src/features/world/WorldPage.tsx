import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useRequiredProfile } from '@/app/context'
import { useFactScroll } from '@/components/game/FactScroll'
import { GameHud, useGameStats } from '@/components/game/GameHud'
import { WorldScene, type SceneNode } from '@/components/game/WorldScene'
import { Spinner } from '@/components/ui'
import { CHAPTERS, REGIONS } from '@/content'
import { chapterProgress, describeUnlock, regionState } from '@/core/game/progression'
import { useAttempts, useSnapshot } from '@/data/hooks'
import { OVERWORLD_GRAPH, OVERWORLD_SIZE, OverworldBackground } from '@/game/scenes/Overworld'

const FACT_SPOTS: Record<string, { factId: string; label: string }> = {
  lighthouse: { factId: 'fact-lighthouse', label: 'Old Lighthouse' },
  grove: { factId: 'fact-grove', label: 'Ancient Grove' },
  falls: { factId: 'fact-falls', label: 'Rainbow Falls' },
}

/** The explorable overworld: Basecamp, crossroads, region gates and hidden scrolls. */
export function WorldPage() {
  const profile = useRequiredProfile()
  const snapshot = useSnapshot(profile.id)
  const stats = useGameStats(profile.id)
  const attempts = useAttempts(profile.id)
  const navigate = useNavigate()
  const { read, modal } = useFactScroll(profile.id)

  const facts = useMemo(() => new Set(stats?.wallet.facts ?? []), [stats])
  const nodes = useMemo<SceneNode[] | null>(() => {
    if (!snapshot) return null
    const pos = new Map(OVERWORLD_GRAPH.nodes.map((n) => [n.id, n]))
    const at = (id: string) => ({ x: pos.get(id)!.x, y: pos.get(id)!.y })
    const out: SceneNode[] = [
      {
        id: 'camp',
        ...at('camp'),
        kind: 'camp',
        state: 'neutral',
        label: 'Basecamp',
        sub: 'Rest by the fire, check your backpack and change your look.',
        say: 'Home sweet camp! Your backpack has your badges, scrolls and the wardrobe.',
        action: { label: 'Open backpack', run: () => navigate('/backpack') },
      },
      {
        id: 'cross',
        ...at('cross'),
        kind: 'sign',
        state: 'neutral',
        label: 'Crossroads',
        say: 'West is the Kingdom of Words, east is the Realm of Numbers, and north is the Frontier of Discovery.',
      },
    ]
    for (const r of REGIONS) {
      const state = regionState(r, CHAPTERS, snapshot)
      const ch = CHAPTERS.filter((c) => c.regionId === r.id && c.status === 'playable')
      const p = ch.reduce(
        (a, c) => {
          const x = chapterProgress(c, snapshot)
          return { done: a.done + x.done, total: a.total + x.total }
        },
        { done: 0, total: 0 },
      )
      out.push({
        id: r.id,
        ...at(r.id),
        kind: 'gate',
        state: state === 'completed' ? 'completed' : state,
        label: r.name,
        sub: `${r.subjectLabel} · ${r.tagline} · ${p.done}/${p.total} stages`,
        lockedReason: `${describeUnlock(r)}.`,
        say: state === 'locked' ? `The ${r.name} is still sealed. ${describeUnlock(r)}!` : r.description,
        action: { label: state === 'completed' ? 'Revisit region' : 'Enter region', run: () => navigate(`/region/${r.id}`) },
      })
    }
    for (const [id, f] of Object.entries(FACT_SPOTS)) {
      const found = facts.has(f.factId)
      out.push({
        id,
        ...at(id),
        kind: 'fact',
        state: found ? 'completed' : 'available',
        label: f.label,
        sub: found ? 'You have read this scroll.' : 'Something is glowing here…',
        say: found ? undefined : 'Ooh, a hidden scroll! Want to read it?',
        sayMood: 'happy',
        action: { label: found ? 'Read again' : 'Read the scroll', run: () => void read(f.factId) },
      })
    }
    return out
  }, [snapshot, facts, navigate, read])

  if (!snapshot || !nodes || !attempts || !stats) return <Spinner label="Unrolling the map" />
  const progress = {
    bridgeFixed: snapshot.passedBossIds.has('math-boss'),
    libraryLit: ['eng-m1', 'eng-m2', 'eng-m3'].filter((m) => snapshot.completedMissionIds.has(m)).length + (snapshot.passedBossIds.has('eng-boss') ? 1 : 0),
    stationPowered: snapshot.passedBossIds.has('sci-boss'),
    discoveryOpen:
      regionState(
        REGIONS.find((r) => r.id === 'discovery')!,
        CHAPTERS,
        snapshot,
      ) !== 'locked',
    factsFound: facts,
  }
  const intro =
    attempts.length === 0 ? `Hi ${profile.nickname}, I’m Pip! Tap a place on the map — or use the arrow keys — to walk there. Let’s start with a region gate!` : undefined

  return (
    <>
      <h1 className="sr-only">The Isle of Learning — world map</h1>
      <WorldScene
        width={OVERWORLD_SIZE.width}
        height={OVERWORLD_SIZE.height}
        graph={OVERWORLD_GRAPH}
        nodes={nodes}
        background={<OverworldBackground p={progress} />}
        avatar={profile.avatar}
        startNodeId="camp"
        storageKey={`world:${profile.id}`}
        intro={intro}
        hud={<GameHud profile={profile} title="Isle of Learning" />}
        viewHeight={1180}
      />
      {modal}
    </>
  )
}
