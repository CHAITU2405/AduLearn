/**
 * The Isle of Learning — overworld map. A painted island illustration with an
 * interactive SVG layer on top (gates, scrolls, weather and progress cues).
 */
import { Barrier, Birds, Cloud, Flag, ScrollPickup } from '@/components/game/art'
import type { SceneGraph } from '@/core/world/graph'
import { ART, at, MAP_SIZE } from '@/game/art'

export const OVERWORLD_SIZE = MAP_SIZE

const P = {
  camp: at(650, 640),
  cross: at(600, 470),
  words: at(360, 420),
  numbers: at(790, 430),
  discovery: at(640, 262),
  lighthouse: at(360, 652),
  grove: at(222, 322),
  falls: at(930, 600),
}

export const OVERWORLD_GRAPH: SceneGraph = {
  nodes: Object.entries(P).map(([id, p]) => ({ id, ...p })),
  edges: [
    { a: 'camp', b: 'cross' },
    { a: 'cross', b: 'words', via: [at(480, 470)] },
    { a: 'cross', b: 'numbers', via: [at(700, 470)] },
    { a: 'cross', b: 'discovery', via: [at(620, 345)] },
    { a: 'camp', b: 'lighthouse', via: [at(470, 650)] },
    { a: 'camp', b: 'falls', via: [at(800, 562), at(895, 585)] },
    { a: 'words', b: 'grove', via: [at(272, 362)] },
  ],
}

export interface OverworldProgress {
  bridgeFixed: boolean
  libraryLit: number
  stationPowered: boolean
  discoveryOpen: boolean
  factsFound: ReadonlySet<string>
}

export function OverworldBackground({ p }: { p: OverworldProgress }) {
  return (
    <g>
      <image href={ART.mapWorld} width={MAP_SIZE.width} height={MAP_SIZE.height} preserveAspectRatio="none" />
      {/* Progress cues */}
      {p.bridgeFixed && <Flag x={1540} y={420} color="#22c55e" s={1.2} />}
      {p.libraryLit >= 4 && <Flag x={470} y={300} color="#facc15" s={1.2} />}
      {p.stationPowered && <circle className="twinkle" cx={911} cy={250} r="36" fill="#fde047" opacity="0.5" />}
      {!p.discoveryOpen && <Barrier x={P.discovery.x} y={P.discovery.y + 40} s={1.6} />}
      <ScrollPickup x={P.lighthouse.x + 70} y={P.lighthouse.y} found={p.factsFound.has('fact-lighthouse')} />
      <ScrollPickup x={P.grove.x + 70} y={P.grove.y} found={p.factsFound.has('fact-grove')} />
      <ScrollPickup x={P.falls.x - 70} y={P.falls.y} found={p.factsFound.has('fact-falls')} />
      {/* Ambient life */}
      <g opacity="0.75">
        <Cloud x={260} y={120} s={1.1} />
        <Cloud x={1300} y={90} s={0.9} />
      </g>
      <Birds x={720} y={160} />
      <Birds x={1500} y={760} />
    </g>
  )
}
