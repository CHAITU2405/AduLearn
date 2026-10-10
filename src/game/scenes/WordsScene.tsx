/** Lexton — the Kingdom of Words region map. */
import { Birds, Bush, Cloud, Flag, Flowers, Fountain, House, ScrollPickup, Signboard, Tree } from '@/components/game/art'
import type { RegionSceneDef } from './types'

const W = 1800
const H = 1100

export const wordsScene: RegionSceneDef = {
  regionId: 'words',
  width: W,
  height: H,
  entryId: 'entry',
  factId: 'fact-alphabet',
  places: {
    entry: { x: 140, y: 900, label: 'Town Gate' },
    'eng-diag': { x: 340, y: 780, label: 'Notice Board' },
    'eng-m1': { x: 560, y: 640, label: 'Signboard Street', character: 'lexa' },
    'eng-m2': { x: 820, y: 500, label: 'Scroll Workshop', character: 'lexa' },
    'eng-m3': { x: 1120, y: 600, label: 'Reading Room', character: 'lexa' },
    'eng-boss': { x: 1400, y: 380, label: 'The Archive', character: 'owl' },
    'eng-follow': { x: 1580, y: 680, label: 'Library Balcony' },
    fact: { x: 860, y: 860, label: 'Wishing Fountain' },
    soon: { x: 280, y: 470, label: 'Quiet Lane' },
  },
  edges: [
    { a: 'entry', b: 'eng-diag' },
    { a: 'entry', b: 'soon', via: [{ x: 170, y: 640 }] },
    { a: 'eng-diag', b: 'eng-m1', via: [{ x: 460, y: 720 }] },
    { a: 'eng-m1', b: 'eng-m2', via: [{ x: 690, y: 560 }] },
    { a: 'eng-m2', b: 'eng-m3', via: [{ x: 980, y: 520 }] },
    { a: 'eng-m3', b: 'eng-boss', via: [{ x: 1260, y: 480 }] },
    { a: 'eng-boss', b: 'eng-follow', via: [{ x: 1540, y: 520 }] },
    { a: 'eng-m1', b: 'fact', via: [{ x: 700, y: 800 }] },
  ],
  Background: ({ done, factFound }) => {
    const signsFixed = done.has('eng-m1')
    const scrolls = done.has('eng-m2')
    const reading = done.has('eng-m3')
    const archive = done.has('eng-boss')
    const lit = ['eng-m1', 'eng-m2', 'eng-m3', 'eng-boss'].filter((id) => done.has(id)).length
    return (
      <g>
        <defs>
          <linearGradient id="wd-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a5b4fc" />
            <stop offset="1" stopColor="#e0e7ff" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#wd-sky)" />
        <path d="M0 330 C300 250 500 300 800 260 C1100 220 1400 290 1800 230 L1800 460 L0 460 Z" fill="#c4b5fd" opacity="0.7" />
        <path d="M0 390 C400 340 800 380 1200 330 C1500 300 1700 340 1800 330 L1800 1100 L0 1100 Z" fill="#bbf7d0" />
        <path d="M0 470 C500 430 1000 470 1800 420 L1800 1100 L0 1100 Z" fill="#86efac" />
        {/* Cobbled square */}
        <ellipse cx="860" cy="860" rx="230" ry="90" fill="#e7e5e4" />
        <ellipse cx="860" cy="860" rx="230" ry="90" fill="none" stroke="#d6d3d1" strokeWidth="4" strokeDasharray="10 10" />
        <Fountain x={860} y={850} />
        {/* Notice board */}
        <g transform="translate(345 760)">
          <rect x="-4" y="-70" width="8" height="70" fill="#78350f" />
          <rect x="-46" y="-110" width="92" height="56" rx="4" fill="#fde68a" stroke="#92400e" strokeWidth="4" />
          <rect x="-36" y="-100" width="30" height="20" fill="#fff" />
          <rect x="4" y="-96" width="30" height="26" fill="#fef3c7" />
        </g>
        {/* Signboard street */}
        <House x={500} y={600} roof="#8b5cf6" lit={lit > 0} />
        <House x={640} y={610} roof="#f97316" lit={lit > 0} s={0.9} />
        <Signboard x={470} y={680} text={signsFixed ? 'MARKET' : 'MAKRET'} tilt={signsFixed ? 0 : -14} />
        <Signboard x={600} y={690} text={signsFixed ? 'BAKERY' : 'BAEKRY'} tilt={signsFixed ? 0 : 12} />
        <Signboard x={720} y={660} text={signsFixed ? 'SCHOOL' : 'SCOHOL'} tilt={signsFixed ? 0 : -9} />
        {/* Scroll workshop */}
        <g transform="translate(830 470)">
          <House x={0} y={0} roof="#0ea5e9" lit={lit > 1} s={1.1} />
          <g transform="translate(-70 -10)">
            <rect x="-16" y="-24" width="32" height="20" rx="3" fill={scrolls ? '#fef3c7' : '#d6d3d1'} stroke="#a16207" strokeWidth="2" />
            <circle cx="-16" cy="-14" r="5" fill="#d97706" />
            <circle cx="16" cy="-14" r="5" fill="#d97706" />
          </g>
        </g>
        {/* Reading room tower */}
        <g transform="translate(1150 590)">
          <rect x="-45" y="-200" width="90" height="200" fill="#ede9fe" stroke="#6366f1" strokeWidth="5" />
          <path d="M-58 -198 L0 -262 L58 -198 Z" fill="#6366f1" />
          {[-150, -100, -50].map((y) => (
            <rect key={y} x="-14" y={y} width="28" height="30" rx="14" fill={reading ? '#fde047' : '#c7d2fe'} stroke="#6366f1" strokeWidth="2" />
          ))}
        </g>
        {/* Grand archive */}
        <g transform="translate(1400 360)">
          <ellipse cx="0" cy="6" rx="190" ry="20" fill="#0b1f3a" opacity="0.15" />
          <rect x="-160" y="-160" width="320" height="160" fill="#ede9fe" stroke="#4338ca" strokeWidth="6" />
          <path d="M-190 -158 L0 -260 L190 -158 Z" fill="#4f46e5" />
          {[-120, -60, 60, 120].map((x, i) => (
            <rect key={x} x={x - 14} y="-130" width="28" height="110" fill={i < lit ? '#fef08a' : '#c7d2fe'} stroke="#4338ca" strokeWidth="3" />
          ))}
          <path d="M-34 0 L-34 -80 A34 34 0 0 1 34 -80 L34 0 Z" fill={archive ? '#fde047' : '#312e81'} />
          {archive && <Flag x={0} y={-258} color="#facc15" s={1.1} />}
        </g>
        {/* Balcony */}
        <g transform="translate(1600 670)">
          <rect x="-60" y="-110" width="120" height="110" fill="#f5f3ff" stroke="#6366f1" strokeWidth="4" />
          <rect x="-70" y="-60" width="140" height="10" fill="#6366f1" />
          {[-50, -30, -10, 10, 30, 50].map((x) => (
            <rect key={x} x={x - 2} y="-50" width="4" height="22" fill="#6366f1" />
          ))}
        </g>
        <Signboard x={330} y={480} text="SOON" tilt={6} />
        <ScrollPickup x={920} y={870} found={factFound} />
        {[
          [120, 450],
          [220, 1000],
          [1000, 980],
          [1300, 860],
          [1720, 950],
          [1000, 300],
          [1700, 400],
        ].map(([x, y], i) => (
          <Tree key={i} x={x} y={y} s={0.8 + (i % 3) * 0.12} color={['#16a34a', '#22c55e', '#15803d'][i % 3]} />
        ))}
        <Flowers x={420} y={880} />
        <Flowers x={1250} y={700} />
        <Flowers x={1450} y={820} />
        <Bush x={700} y={980} />
        <Bush x={1520} y={560} />
        <Cloud x={420} y={140} />
        <Cloud x={1100} y={110} s={1.2} />
        <Birds x={700} y={180} />
      </g>
    )
  },
}
