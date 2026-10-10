/** Lexton — Kingdom of Words region map (painted art + progress layer). */
import { Flag, ScrollPickup, Signboard } from '@/components/game/art'
import { ART, at, MAP_SIZE } from '@/game/art'
import type { RegionSceneDef } from './types'

const P = {
  entry: at(300, 800),
  'eng-diag': at(150, 792),
  'eng-m1': at(400, 640),
  'eng-m2': at(700, 300),
  'eng-m3': at(860, 500),
  'eng-boss': at(1050, 300),
  'eng-follow': at(980, 732),
  fact: at(700, 662),
  soon: at(520, 140),
}

export const wordsScene: RegionSceneDef = {
  regionId: 'words',
  ...MAP_SIZE,
  entryId: 'entry',
  factId: 'fact-alphabet',
  places: {
    entry: { ...P.entry, label: 'Town Gate' },
    'eng-diag': { ...P['eng-diag'], label: 'Notice Board' },
    'eng-m1': { ...P['eng-m1'], label: 'Signboard Street', character: 'lexa' },
    'eng-m2': { ...P['eng-m2'], label: 'Scroll Workshop', character: 'lexa' },
    'eng-m3': { ...P['eng-m3'], label: 'Reading Tower', character: 'lexa' },
    'eng-boss': { ...P['eng-boss'], label: 'The Grand Library', character: 'owl' },
    'eng-follow': { ...P['eng-follow'], label: 'Balcony House' },
    fact: { ...P.fact, label: 'Wishing Fountain' },
    soon: { ...P.soon, label: 'Quiet Lane' },
  },
  edges: [
    { a: 'entry', b: 'eng-diag' },
    { a: 'entry', b: 'eng-m1', via: [at(330, 690)] },
    { a: 'eng-diag', b: 'eng-m1', via: [at(250, 690)] },
    { a: 'eng-m1', b: 'fact' },
    { a: 'eng-m1', b: 'eng-m2', via: [at(560, 450)] },
    { a: 'eng-m2', b: 'soon', via: [at(620, 220)] },
    { a: 'eng-m2', b: 'eng-m3', via: [at(800, 380)] },
    { a: 'eng-m3', b: 'eng-boss', via: [at(980, 380)] },
    { a: 'eng-boss', b: 'eng-follow', via: [at(1040, 520)] },
  ],
  Background: ({ done, factFound }) => {
    const fixed = done.has('eng-m1')
    return (
      <g>
        <image href={ART.mapWords} width={MAP_SIZE.width} height={MAP_SIZE.height} preserveAspectRatio="none" />
        <Signboard x={P['eng-m1'].x - 110} y={P['eng-m1'].y + 20} text={fixed ? 'MARKET' : 'MAKRET'} tilt={fixed ? 0 : -14} s={1.3} />
        {done.has('eng-boss') && <Flag x={P['eng-boss'].x + 150} y={P['eng-boss'].y - 120} color="#facc15" s={1.4} />}
        {['eng-m1', 'eng-m2', 'eng-m3'].map((id) =>
          done.has(id) ? <circle key={id} className="twinkle" cx={P[id as keyof typeof P].x} cy={P[id as keyof typeof P].y - 90} r="18" fill="#fde047" opacity="0.6" /> : null,
        )}
        <Signboard x={P.soon.x + 80} y={P.soon.y + 10} text="SOON" tilt={6} />
        <ScrollPickup x={P.fact.x + 80} y={P.fact.y} found={factFound} />
      </g>
    )
  },
}
