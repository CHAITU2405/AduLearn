/** The Gorge of Balance — the Realm of Numbers region map. */
import { Birds, Bush, Campfire, Cloud, Flag, Pine, Rock, ScrollPickup, Signboard, Tent, Tree, Waves } from '@/components/game/art'
import type { RegionSceneDef } from './types'

const W = 1800
const H = 1100

export const numbersScene: RegionSceneDef = {
  regionId: 'numbers',
  width: W,
  height: H,
  entryId: 'entry',
  factId: 'fact-equals',
  places: {
    entry: { x: 140, y: 880, label: 'Trail to the Isle' },
    'math-diag': { x: 330, y: 760, label: 'Survey Stone' },
    'math-m1': { x: 470, y: 600, label: 'Plank Yard', character: 'ira' },
    'math-m2': { x: 640, y: 430, label: 'Rope Lift', character: 'ira' },
    'math-mini': { x: 690, y: 640, label: 'River Toll', character: 'gorm' },
    'math-m3': { x: 905, y: 600, label: 'Balance Scales' },
    'math-m4': { x: 1180, y: 470, label: 'Planning Tent', character: 'ira' },
    'math-boss': { x: 1440, y: 330, label: 'Storm Peak', character: 'golem' },
    'math-follow': { x: 1560, y: 760, label: 'Lookout Tower' },
    fact: { x: 1320, y: 900, label: 'Old Milestone' },
    soon: { x: 240, y: 520, label: 'Unexplored Canyon' },
  },
  edges: [
    { a: 'entry', b: 'math-diag' },
    { a: 'entry', b: 'soon', via: [{ x: 170, y: 700 }] },
    { a: 'math-diag', b: 'math-m1', via: [{ x: 420, y: 700 }] },
    { a: 'math-m1', b: 'math-m2', via: [{ x: 560, y: 500 }] },
    { a: 'math-m2', b: 'math-mini', via: [{ x: 700, y: 520 }] },
    { a: 'math-mini', b: 'math-m3', via: [{ x: 800, y: 620 }] },
    { a: 'math-m3', b: 'math-m4', via: [{ x: 1030, y: 590 }, { x: 1110, y: 520 }] },
    { a: 'math-m4', b: 'math-boss', via: [{ x: 1300, y: 420 }] },
    { a: 'math-boss', b: 'math-follow', via: [{ x: 1560, y: 520 }] },
    { a: 'math-m4', b: 'fact', via: [{ x: 1240, y: 700 }] },
  ],
  Background: ({ done, factFound }) => {
    const plankA = done.has('math-m1')
    const lift = done.has('math-m2')
    const gate = done.has('math-mini')
    const plankB = done.has('math-m3')
    const plankC = done.has('math-m4')
    const calm = done.has('math-boss')
    return (
      <g>
        <defs>
          <linearGradient id="nb-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={calm ? '#7dd3fc' : '#94a3b8'} />
            <stop offset="1" stopColor={calm ? '#fef3c7' : '#fde68a'} />
          </linearGradient>
          <linearGradient id="nb-cliff" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fdba74" />
            <stop offset="1" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#nb-sky)" />
        {calm && (
          <g opacity="0.55">
            {['#f43f5e', '#f97316', '#facc15', '#22c55e', '#0ea5e9', '#6366f1'].map((c, i) => (
              <path key={c} d={`M${1000 - i * 14} 380 A${420 + i * 14} ${300 + i * 14} 0 0 1 ${1880 + i * 14} 380`} fill="none" stroke={c} strokeWidth="14" />
            ))}
          </g>
        )}
        {/* Distant mesas */}
        <path d="M0 360 L120 260 L260 300 L380 210 L520 290 L700 230 L860 300 L1000 240 L1160 280 L1300 200 L1480 260 L1640 190 L1800 250 L1800 420 L0 420 Z" fill="#fb923c" opacity="0.45" />
        {/* Left plateau */}
        <path d="M0 380 C200 360 600 330 790 360 L800 1100 L0 1100 Z" fill="url(#nb-cliff)" />
        <path d="M0 380 C200 360 600 330 790 360 L790 400 C600 380 200 410 0 420 Z" fill="#86efac" />
        <path d="M0 410 C300 420 600 390 790 400 L790 1100 L0 1100 Z" fill="#fed7aa" />
        {/* Right plateau */}
        <path d="M1010 330 C1200 300 1600 250 1800 280 L1800 1100 L1000 1100 Z" fill="url(#nb-cliff)" />
        <path d="M1010 330 C1200 300 1600 250 1800 280 L1800 320 C1600 300 1200 350 1010 370 Z" fill="#86efac" />
        <path d="M1010 370 C1200 350 1600 300 1800 320 L1800 1100 L1000 1100 Z" fill="#fed7aa" />
        {/* Gorge */}
        <path d="M790 360 L800 1100 L1000 1100 L1010 330 C960 420 900 520 900 700 C900 520 850 420 790 360 Z" fill="#7c2d12" opacity="0.85" />
        <path d="M840 1100 C860 900 940 860 960 1100 Z" fill="#38bdf8" />
        <path className="water-flow" d="M870 1100 C880 960 930 940 940 1100" fill="none" stroke="#e0f2fe" strokeWidth="4" />
        {/* Bridge */}
        <g>
          <path d="M760 590 L1040 590" stroke="#78350f" strokeWidth="5" opacity="0.6" />
          <path d="M760 570 Q900 620 1040 570" fill="none" stroke="#78350f" strokeWidth="4" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
            const x = 765 + i * 23
            const built = i < 4 ? plankA : i < 8 ? plankB : plankC
            return built ? (
              <rect key={i} x={x} y={592} width="20" height="16" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
            ) : (
              <rect key={i} x={x} y={592} width="20" height="16" rx="2" fill="none" stroke="#78350f" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
            )
          })}
          {/* Toll gate */}
          <g transform="translate(745 600)">
            <rect x="-8" y="-70" width="16" height="70" fill="#64748b" />
            <rect x="-4" y="-66" width={gate ? 10 : 110} height="10" rx="3" fill="#f43f5e" transform={gate ? 'rotate(-80 0 -61)' : undefined} />
          </g>
        </g>
        {/* Rope lift */}
        <g transform="translate(700 380)">
          <rect x="-6" y="-120" width="12" height="120" fill="#78350f" />
          <rect x="-40" y="-130" width="80" height="12" rx="4" fill="#92400e" />
          <path d="M30 -118 L30 40" stroke="#a16207" strokeWidth="3" />
          <rect x="16" y={lift ? -60 : 30} width="30" height="26" rx="3" fill="#d97706" stroke="#78350f" strokeWidth="2" />
        </g>
        {/* Scales */}
        <g transform="translate(905 545)">
          <rect x="-4" y="-50" width="8" height="50" fill="#334155" />
          <g transform={plankB ? undefined : 'rotate(-10 0 -50)'}>
            <path d="M-50 -50 L50 -50" stroke="#334155" strokeWidth="5" />
            <path d="M-50 -50 L-62 -24 L-38 -24 Z M50 -50 L38 -24 L62 -24 Z" fill="#facc15" stroke="#a16207" strokeWidth="2" />
          </g>
        </g>
        <Tent x={1170} y={430} color="#f97316" />
        <Signboard x={1220} y={450} text="PLANS" />
        {/* Storm peak */}
        <g transform="translate(1440 300)">
          <path d="M-110 0 L0 -150 L110 0 Z" fill="#c2410c" />
          <path d="M-30 -110 L0 -150 L30 -110 Z" fill="#fff" />
        </g>
        {!calm ? (
          <g>
            <Cloud x={1400} y={130} s={1.4} dark />
            <Cloud x={1520} y={170} s={1.1} dark />
            <path className="twinkle" d="M1440 190 L1420 240 L1446 240 L1428 290" stroke="#facc15" strokeWidth="6" fill="none" strokeLinejoin="round" />
          </g>
        ) : (
          <Flag x={1440} y={152} color="#22c55e" s={1.2} />
        )}
        {/* Lookout tower */}
        <g transform="translate(1600 740)">
          <rect x="-24" y="-130" width="48" height="130" fill="#e2e8f0" stroke="#64748b" strokeWidth="3" />
          <path d="M-36 -130 L0 -170 L36 -130 Z" fill="#0ea5e9" />
          <rect x="-12" y="-110" width="24" height="18" rx="3" fill="#bae6fd" />
        </g>
        {/* Survey stone */}
        <g transform="translate(350 740)">
          <path d="M-26 0 L-20 -60 L20 -64 L26 0 Z" fill="#94a3b8" />
          <text x="0" y="-28" textAnchor="middle" fontSize="20" fontWeight="900" fill="#334155">
            =
          </text>
        </g>
        {/* Plank yard */}
        <g transform="translate(410 590)">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-40 + i * 3} y={-12 - i * 10} width="70" height="9" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
          ))}
        </g>
        <Campfire x={250} y={900} />
        <ScrollPickup x={1365} y={900} found={factFound} />
        <Signboard x={300} y={520} text="SOON" tilt={-8} />
        {[
          [120, 470],
          [560, 380],
          [80, 980],
          [600, 920],
          [1120, 360],
          [1700, 900],
          [1450, 1000],
        ].map(([x, y], i) => (
          <Tree key={i} x={x} y={y} s={0.8 + (i % 2) * 0.2} color={i % 2 ? '#16a34a' : '#65a30d'} />
        ))}
        <Pine x={1740} y={420} />
        <Rock x={520} y={980} />
        <Rock x={1180} y={980} s={1.2} />
        <Bush x={420} y={880} />
        <Bush x={1500} y={560} color="#65a30d" />
        <Birds x={400} y={150} />
        <Cloud x={300} y={120} />
        <Waves x={850} y={1080} w={100} />
      </g>
    )
  },
}
