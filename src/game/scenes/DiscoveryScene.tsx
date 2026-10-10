/** Field Station Alpha — Frontier of Discovery region map (painted art + progress layer). */
import { Cloud, Flag, ScrollPickup, Signboard } from '@/components/game/art'
import { ART, at, MAP_SIZE } from '@/game/art'
import type { RegionSceneDef } from './types'

const P = {
  entry: at(300, 642),
  'sci-diag': at(420, 762),
  'sci-m1': at(322, 452),
  'sci-m2': at(650, 310),
  'sci-m3': at(890, 445),
  'sci-boss': at(1050, 362),
  'sci-follow': at(962, 692),
  fact: at(650, 702),
  soon: at(92, 480),
}

export const discoveryScene: RegionSceneDef = {
  regionId: 'discovery',
  ...MAP_SIZE,
  entryId: 'entry',
  factId: 'fact-cell',
  places: {
    entry: { ...P.entry, label: 'Jeep Track' },
    'sci-diag': { ...P['sci-diag'], label: 'Field Notebook' },
    'sci-m1': { ...P['sci-m1'], label: 'Microscope Tent', character: 'nova' },
    'sci-m2': { ...P['sci-m2'], label: 'Chemistry Hut', character: 'nova' },
    'sci-m3': { ...P['sci-m3'], label: 'Pressure Pad', character: 'nova' },
    'sci-boss': { ...P['sci-boss'], label: 'Weather Mast', character: 'cloud' },
    'sci-follow': { ...P['sci-follow'], label: 'Observatory' },
    fact: { ...P.fact, label: 'Crystal Cave' },
    soon: { ...P.soon, label: 'Deep Forest' },
  },
  edges: [
    { a: 'entry', b: 'sci-diag' },
    { a: 'entry', b: 'sci-m1', via: [at(390, 600), at(400, 500)] },
    { a: 'sci-m1', b: 'soon' },
    { a: 'sci-m1', b: 'sci-m2', via: [at(480, 330)] },
    { a: 'sci-m2', b: 'sci-m3', via: [at(780, 350)] },
    { a: 'sci-m2', b: 'sci-boss', via: [at(880, 290)] },
    { a: 'sci-m3', b: 'sci-boss' },
    { a: 'sci-boss', b: 'sci-follow', via: [at(1040, 540)] },
    { a: 'sci-m3', b: 'fact', via: [at(800, 560)] },
  ],
  Background: ({ done, factFound }) => (
    <g>
      <image href={ART.mapDiscovery} width={MAP_SIZE.width} height={MAP_SIZE.height} preserveAspectRatio="none" />
      {['sci-m1', 'sci-m2', 'sci-m3'].map((id) =>
        done.has(id) ? <circle key={id} className="twinkle" cx={P[id as keyof typeof P].x} cy={P[id as keyof typeof P].y - 90} r="18" fill="#fde047" opacity="0.6" /> : null,
      )}
      {!done.has('sci-boss') ? (
        <g>
          <Cloud x={P['sci-boss'].x + 30} y={P['sci-boss'].y - 270} s={1.4} dark />
          <path
            className="twinkle"
            d={`M${P['sci-boss'].x + 50} ${P['sci-boss'].y - 230} l-22 52 h28 l-18 52`}
            stroke="#facc15"
            strokeWidth="7"
            fill="none"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        <Flag x={P['sci-boss'].x + 90} y={P['sci-boss'].y - 40} color="#22c55e" s={1.4} />
      )}
      <Signboard x={P.soon.x + 80} y={P.soon.y + 10} text="SOON" tilt={-6} />
      <ScrollPickup x={P.fact.x - 80} y={P.fact.y} found={factFound} />
    </g>
  ),
}
