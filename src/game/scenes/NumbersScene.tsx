/** The Gorge of Balance — Realm of Numbers region map (painted art + progress layer). */
import { Barrier, Cloud, Flag, ScrollPickup, Signboard } from '@/components/game/art'
import { ART, at, MAP_SIZE } from '@/game/art'
import type { RegionSceneDef } from './types'

const P = {
  entry: at(150, 700),
  'math-diag': at(362, 600),
  'math-m1': at(300, 392),
  'math-m2': at(445, 300),
  'math-mini': at(520, 448),
  'math-m3': at(772, 668),
  'math-m4': at(1002, 470),
  'math-boss': at(1010, 252),
  'math-follow': at(1062, 772),
  fact: at(880, 792),
  soon: at(112, 330),
}

export const numbersScene: RegionSceneDef = {
  regionId: 'numbers',
  ...MAP_SIZE,
  entryId: 'entry',
  factId: 'fact-equals',
  places: {
    entry: { ...P.entry, label: 'Trail to the Isle' },
    'math-diag': { ...P['math-diag'], label: 'Survey Stone' },
    'math-m1': { ...P['math-m1'], label: 'Plank Yard', character: 'ira' },
    'math-m2': { ...P['math-m2'], label: 'Rope Lift', character: 'ira' },
    'math-mini': { ...P['math-mini'], label: 'River Toll', character: 'gorm' },
    'math-m3': { ...P['math-m3'], label: 'Balance Scales' },
    'math-m4': { ...P['math-m4'], label: 'Planning Tent', character: 'ira' },
    'math-boss': { ...P['math-boss'], label: 'Storm Peak', character: 'golem' },
    'math-follow': { ...P['math-follow'], label: 'Lookout Tower' },
    fact: { ...P.fact, label: 'Old Milestone' },
    soon: { ...P.soon, label: 'Unexplored Canyon' },
  },
  edges: [
    { a: 'entry', b: 'math-diag' },
    { a: 'entry', b: 'soon', via: [at(90, 480)] },
    { a: 'math-diag', b: 'math-m1', via: [at(300, 480)] },
    { a: 'math-m1', b: 'math-m2', via: [at(380, 330)] },
    { a: 'math-m2', b: 'math-mini', via: [at(430, 400)] },
    { a: 'math-mini', b: 'math-m3', via: [at(650, 440), at(800, 440), at(860, 560)] },
    { a: 'math-m3', b: 'math-m4', via: [at(930, 580)] },
    { a: 'math-m4', b: 'math-boss', via: [at(920, 330)] },
    { a: 'math-m4', b: 'math-follow', via: [at(1095, 562)] },
    { a: 'math-m3', b: 'fact', via: [at(840, 760)] },
  ],
  Background: ({ done, factFound }) => (
    <g>
      <image href={ART.mapNumbers} width={MAP_SIZE.width} height={MAP_SIZE.height} preserveAspectRatio="none" />
      {!done.has('math-mini') && <Barrier x={P['math-mini'].x + 70} y={P['math-mini'].y + 10} s={1.4} />}
      {!done.has('math-boss') ? (
        <g>
          <Cloud x={P['math-boss'].x + 20} y={P['math-boss'].y - 230} s={1.5} dark />
          <Cloud x={P['math-boss'].x + 160} y={P['math-boss'].y - 200} s={1.1} dark />
          <path
            className="twinkle"
            d={`M${P['math-boss'].x + 40} ${P['math-boss'].y - 190} l-24 56 h30 l-20 56`}
            stroke="#facc15"
            strokeWidth="7"
            fill="none"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        <Flag x={P['math-boss'].x + 110} y={P['math-boss'].y - 60} color="#22c55e" s={1.4} />
      )}
      <Signboard x={P.soon.x + 70} y={P.soon.y + 10} text="SOON" tilt={-8} />
      <ScrollPickup x={P.fact.x + 70} y={P.fact.y} found={factFound} />
    </g>
  ),
}
