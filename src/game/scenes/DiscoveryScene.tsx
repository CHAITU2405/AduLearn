/** Field Station Alpha — the Frontier of Discovery region map. */
import { Birds, Bush, Cloud, Crystal, Flowers, Pine, Rock, ScrollPickup, Signboard, Tent, Tree } from '@/components/game/art'
import type { RegionSceneDef } from './types'

const W = 1800
const H = 1100

export const discoveryScene: RegionSceneDef = {
  regionId: 'discovery',
  width: W,
  height: H,
  entryId: 'entry',
  factId: 'fact-cell',
  places: {
    entry: { x: 140, y: 880, label: 'Jeep Track' },
    'sci-diag': { x: 330, y: 740, label: 'Field Notebook' },
    'sci-m1': { x: 560, y: 560, label: 'Microscope Tent', character: 'nova' },
    'sci-m2': { x: 900, y: 430, label: 'Chemistry Hut', character: 'nova' },
    'sci-m3': { x: 1240, y: 590, label: 'Pressure Pad', character: 'nova' },
    'sci-boss': { x: 1480, y: 320, label: 'Weather Mast', character: 'cloud' },
    'sci-follow': { x: 1580, y: 790, label: 'Observatory' },
    fact: { x: 900, y: 860, label: 'Crystal Cave' },
    soon: { x: 250, y: 480, label: 'Deep Forest' },
  },
  edges: [
    { a: 'entry', b: 'sci-diag' },
    { a: 'entry', b: 'soon', via: [{ x: 160, y: 660 }] },
    { a: 'sci-diag', b: 'sci-m1', via: [{ x: 440, y: 660 }] },
    { a: 'sci-diag', b: 'fact', via: [{ x: 600, y: 860 }] },
    { a: 'fact', b: 'sci-m3', via: [{ x: 1100, y: 800 }] },
    { a: 'sci-m1', b: 'sci-m2', via: [{ x: 720, y: 460 }] },
    { a: 'sci-m2', b: 'sci-m3', via: [{ x: 1080, y: 480 }] },
    { a: 'sci-m2', b: 'sci-boss', via: [{ x: 1200, y: 330 }] },
    { a: 'sci-m3', b: 'sci-boss', via: [{ x: 1380, y: 470 }] },
    { a: 'sci-boss', b: 'sci-follow', via: [{ x: 1620, y: 560 }] },
  ],
  Background: ({ done, factFound }) => {
    const bio = done.has('sci-m1')
    const chem = done.has('sci-m2')
    const phys = done.has('sci-m3')
    const calm = done.has('sci-boss')
    const cable = (on: boolean) => (on ? '#facc15' : '#64748b')
    return (
      <g>
        <defs>
          <linearGradient id="ds-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={calm ? '#5eead4' : '#94a3b8'} />
            <stop offset="1" stopColor="#ecfeff" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#ds-sky)" />
        <path d="M0 340 L150 240 L300 320 L460 220 L640 310 L820 230 L1000 300 L1200 210 L1400 290 L1600 200 L1800 270 L1800 460 L0 460 Z" fill="#14b8a6" opacity="0.35" />
        <path d="M0 400 C400 360 900 400 1300 350 C1600 320 1700 350 1800 340 L1800 1100 L0 1100 Z" fill="#a7f3d0" />
        <path d="M0 480 C600 440 1200 480 1800 430 L1800 1100 L0 1100 Z" fill="#6ee7b7" />
        {/* Power cables between stations */}
        <path d="M560 470 Q730 400 900 360" fill="none" stroke={cable(bio)} strokeWidth="5" className={bio ? 'twinkle' : undefined} />
        <path d="M900 360 Q1070 420 1240 500" fill="none" stroke={cable(chem)} strokeWidth="5" className={chem ? 'twinkle' : undefined} />
        <path d="M1240 500 Q1360 380 1480 200" fill="none" stroke={cable(phys)} strokeWidth="5" className={phys ? 'twinkle' : undefined} />
        {/* Microscope tent */}
        <Tent x={560} y={540} color="#22c55e" s={1.3} />
        <g transform="translate(630 540)">
          <rect x="-6" y="-40" width="12" height="40" fill="#334155" />
          <rect x="-16" y="-6" width="32" height="6" fill="#334155" />
          <circle cx="0" cy="-46" r="9" fill={bio ? '#86efac' : '#cbd5e1'} stroke="#334155" strokeWidth="3" />
        </g>
        {/* Chemistry hut */}
        <g transform="translate(900 410)">
          <rect x="-80" y="-90" width="160" height="90" fill="#ccfbf1" stroke="#0f766e" strokeWidth="5" />
          <path d="M-96 -88 L0 -140 L96 -88 Z" fill="#0d9488" />
          <rect x="-20" y="-50" width="40" height="50" fill="#115e59" />
          {[
            [-56, '#f43f5e'],
            [52, '#3b82f6'],
          ].map(([x, c]) => (
            <g key={String(x)} transform={`translate(${x} -60)`}>
              <path d="M-8 -16 L8 -16 L8 -6 L16 14 L-16 14 L-8 -6 Z" fill="#fff" stroke="#0f766e" strokeWidth="2" />
              <path d="M-13 8 L13 8 L16 14 L-16 14 Z" fill={chem ? String(c) : '#cbd5e1'} />
            </g>
          ))}
        </g>
        {/* Pressure pad */}
        <g transform="translate(1240 590)">
          <ellipse cx="0" cy="0" rx="90" ry="26" fill="#fde68a" stroke="#a16207" strokeWidth="3" />
          <rect x={phys ? -50 : -20} y={phys ? -26 : -36} width={phys ? 100 : 40} height={phys ? 22 : 34} rx="4" fill="#14b8a6" stroke="#0f766e" strokeWidth="3" />
        </g>
        {/* Weather mast */}
        <g transform="translate(1480 320)">
          <path d="M-40 0 L0 -220 L40 0 Z M-28 -60 L28 -60 M-18 -120 L18 -120" fill="none" stroke="#475569" strokeWidth="7" />
          <circle cx="0" cy="-226" r="10" fill={calm ? '#facc15' : '#ef4444'} className="twinkle" />
        </g>
        {!calm && (
          <g>
            <Cloud x={1460} y={110} s={1.3} dark />
            <path className="twinkle" d="M1500 160 L1480 210 L1506 210 L1490 260" stroke="#facc15" strokeWidth="6" fill="none" />
          </g>
        )}
        {/* Observatory */}
        <g transform="translate(1600 780)">
          <rect x="-60" y="-80" width="120" height="80" fill="#f1f5f9" stroke="#475569" strokeWidth="4" />
          <path d="M-64 -80 A64 64 0 0 1 64 -80 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="4" />
          <rect x="10" y="-150" width="16" height="50" fill="#334155" transform="rotate(30 18 -100)" />
        </g>
        {/* Field notebook stump */}
        <g transform="translate(340 730)">
          <ellipse cx="0" cy="0" rx="34" ry="12" fill="#a16207" />
          <rect x="-34" y="-34" width="68" height="34" fill="#92400e" />
          <ellipse cx="0" cy="-34" rx="34" ry="12" fill="#d97706" />
          <rect x="-16" y="-48" width="32" height="20" fill="#fff" stroke="#0f766e" strokeWidth="2" transform="rotate(-8 0 -38)" />
        </g>
        {/* Crystal cave */}
        <g transform="translate(900 860)">
          <path d="M-110 0 C-100 -110 100 -110 110 0 Z" fill="#64748b" />
          <path d="M-50 0 C-46 -54 46 -54 50 0 Z" fill="#1e293b" />
          <Crystal x={-20} y={0} s={0.8} />
          <Crystal x={22} y={0} s={0.7} color="#a78bfa" />
        </g>
        <ScrollPickup x={960} y={870} found={factFound} />
        <Signboard x={300} y={490} text="SOON" tilt={-6} />
        {[
          [100, 430],
          [190, 380],
          [700, 330],
          [1060, 300],
          [1700, 450],
          [1760, 980],
          [80, 1000],
          [1300, 960],
        ].map(([x, y], i) => (
          <Pine key={i} x={x} y={y} s={0.9 + (i % 3) * 0.12} color={i % 2 ? '#15803d' : '#166534'} />
        ))}
        <Tree x={480} y={900} />
        <Tree x={1150} y={800} color="#16a34a" />
        <Rock x={720} y={720} />
        <Rock x={1420} y={960} s={1.2} />
        <Bush x={1000} y={640} />
        <Flowers x={420} y={620} />
        <Flowers x={1380} y={700} />
        <Cloud x={500} y={130} />
        <Birds x={900} y={170} />
      </g>
    )
  },
}
