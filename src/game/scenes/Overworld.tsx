/**
 * The Isle of Learning — overworld map connecting Basecamp and the three regions.
 * The art reacts to progress: the gorge bridge, library windows and the
 * field-station dome change as chapters are completed.
 */
import { Birds, Bush, Campfire, Cloud, Crystal, Flag, Flowers, House, Lighthouse, Pine, Rock, ScrollPickup, Tent, Tree, Waves } from '@/components/game/art'
import type { SceneGraph } from '@/core/world/graph'

export const OVERWORLD_SIZE = { width: 1800, height: 1150 }

export const OVERWORLD_GRAPH: SceneGraph = {
  nodes: [
    { id: 'camp', x: 900, y: 965 },
    { id: 'cross', x: 900, y: 735 },
    { id: 'words', x: 455, y: 670 },
    { id: 'numbers', x: 1290, y: 715 },
    { id: 'discovery', x: 900, y: 420 },
    { id: 'lighthouse', x: 270, y: 905 },
    { id: 'grove', x: 610, y: 430 },
    { id: 'falls', x: 1545, y: 950 },
  ],
  edges: [
    { a: 'camp', b: 'cross', via: [{ x: 930, y: 850 }] },
    { a: 'cross', b: 'words', via: [{ x: 720, y: 770 }, { x: 570, y: 700 }] },
    { a: 'cross', b: 'numbers', via: [{ x: 1080, y: 780 }, { x: 1190, y: 730 }] },
    { a: 'cross', b: 'discovery', via: [{ x: 850, y: 600 }, { x: 930, y: 500 }] },
    { a: 'camp', b: 'lighthouse', via: [{ x: 680, y: 1010 }, { x: 430, y: 990 }] },
    { a: 'camp', b: 'falls', via: [{ x: 1150, y: 1020 }, { x: 1400, y: 1000 }] },
    { a: 'words', b: 'grove', via: [{ x: 500, y: 540 }] },
    { a: 'grove', b: 'discovery', via: [{ x: 760, y: 410 }] },
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
      <defs>
        <linearGradient id="ow-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
        <radialGradient id="ow-grass" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#bbf7d0" />
          <stop offset="1" stopColor="#4ade80" />
        </radialGradient>
      </defs>
      <rect width="1800" height="1150" fill="url(#ow-sea)" />
      {[
        [120, 120],
        [1500, 80],
        [80, 600],
        [1700, 520],
        [300, 1100],
        [1300, 1110],
        [1650, 1060],
        [700, 60],
      ].map(([x, y], i) => (
        <Waves key={i} x={x} y={y} w={140} />
      ))}
      {/* Island */}
      <path
        d="M200 300 C300 120 700 90 900 110 C1150 80 1500 130 1620 300 C1740 470 1720 800 1600 960 C1460 1090 1100 1090 900 1070 C650 1100 300 1080 190 930 C70 780 90 470 200 300 Z"
        fill="#fde68a"
      />
      <path
        d="M200 300 C300 120 700 90 900 110 C1150 80 1500 130 1620 300 C1740 470 1720 800 1600 960 C1460 1090 1100 1090 900 1070 C650 1100 300 1080 190 930 C70 780 90 470 200 300 Z"
        fill="url(#ow-grass)"
        transform="translate(48 34) scale(0.946)"
      />
      {/* Region tints */}
      <ellipse cx="430" cy="580" rx="290" ry="230" fill="#c4b5fd" opacity="0.45" />
      <ellipse cx="1390" cy="610" rx="300" ry="250" fill="#fdba74" opacity="0.5" />
      <ellipse cx="900" cy="270" rx="340" ry="160" fill="#5eead4" opacity="0.4" />
      <ellipse cx="900" cy="920" rx="240" ry="120" fill="#fef08a" opacity="0.55" />

      {/* --- Frontier of Discovery (north) --- */}
      {[
        [690, 250],
        [740, 200],
        [800, 170],
        [1010, 175],
        [1070, 215],
        [1120, 260],
        [660, 320],
        [1150, 330],
      ].map(([x, y], i) => (
        <Pine key={i} x={x} y={y} s={0.9 + (i % 3) * 0.1} color={i % 2 ? '#15803d' : '#166534'} />
      ))}
      <g transform="translate(900 330)">
        <rect x="-90" y="-8" width="180" height="16" rx="6" fill="#0f766e" />
        <path d="M-80 -8 A80 80 0 0 1 80 -8 Z" fill={p.stationPowered ? '#99f6e4' : '#ccfbf1'} stroke="#14b8a6" strokeWidth="6" />
        <path d="M-40 -60 L-40 -8 M0 -88 L0 -8 M40 -60 L40 -8" stroke="#14b8a6" strokeWidth="3" opacity="0.6" />
        {p.stationPowered && <circle className="twinkle" cx="0" cy="-50" r="14" fill="#fde047" opacity="0.7" />}
        {!p.discoveryOpen && (
          <g>
            <rect x="-120" y="20" width="240" height="14" rx="4" fill="#78350f" />
            <path d="M-110 20 L-110 -10 M110 20 L110 -10" stroke="#78350f" strokeWidth="8" />
          </g>
        )}
      </g>
      <g transform="translate(1085 300)">
        <rect x="-8" y="-90" width="16" height="90" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        <g className="sway" style={{ transformOrigin: '0px -90px' }}>
          <path d="M0 -90 L-6 -150 L6 -150 Z M0 -90 L54 -96 L54 -84 Z M0 -90 L6 -30 L-6 -30 Z M0 -90 L-54 -84 L-54 -96 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
        </g>
      </g>
      <Crystal x={760} y={320} s={1} />
      <Crystal x={1040} y={360} s={0.8} color="#a78bfa" />

      {/* --- Kingdom of Words (west) --- */}
      <g transform="translate(410 600)">
        <ellipse cx="0" cy="6" rx="150" ry="18" fill="#0b1f3a" opacity="0.15" />
        <rect x="-100" y="-130" width="200" height="130" fill="#ede9fe" stroke="#6366f1" strokeWidth="5" />
        <rect x="-140" y="-180" width="54" height="180" fill="#ddd6fe" stroke="#6366f1" strokeWidth="5" />
        <rect x="86" y="-180" width="54" height="180" fill="#ddd6fe" stroke="#6366f1" strokeWidth="5" />
        <path d="M-146 -178 L-113 -228 L-80 -178 Z M80 -178 L113 -228 L146 -178 Z" fill="#6366f1" />
        <path d="M-110 -128 L0 -190 L110 -128 Z" fill="#818cf8" />
        <path d="M-24 0 L-24 -54 A24 24 0 0 1 24 -54 L24 0 Z" fill="#4338ca" />
        {[-72, -40, 40, 72].map((x, i) => (
          <rect key={x} x={x - 10} y="-104" width="20" height="26" rx="10" fill={i < p.libraryLit ? '#fde047' : '#c7d2fe'} stroke="#6366f1" strokeWidth="2" />
        ))}
        <Flag x={-113} y={-226} color="#f97316" s={0.8} />
        <Flag x={113} y={-226} color="#22c55e" s={0.8} />
      </g>
      <House x={250} y={720} roof="#8b5cf6" lit={p.libraryLit > 1} s={0.75} />
      <House x={580} y={760} roof="#a78bfa" lit={p.libraryLit > 2} s={0.7} />
      <Flowers x={300} y={500} />
      <Flowers x={560} y={580} />

      {/* --- Realm of Numbers (east) --- */}
      <g>
        <path d="M1250 560 L1360 360 L1440 480 L1520 330 L1650 560 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="6" strokeLinejoin="round" />
        <path d="M1340 400 L1360 360 L1382 400 Z M1500 370 L1520 330 L1542 370 Z" fill="#fff" />
        <path d="M1300 560 L1420 470 L1560 560 Z" fill="#fdba74" opacity="0.7" />
        {/* Gorge and river */}
        <path d="M1390 560 C1420 620 1460 650 1470 700 C1480 760 1520 820 1545 900" fill="none" stroke="#7c2d12" strokeWidth="58" strokeLinecap="round" opacity="0.55" />
        <path d="M1390 560 C1420 620 1460 650 1470 700 C1480 760 1520 820 1545 900" fill="none" stroke="#38bdf8" strokeWidth="18" strokeLinecap="round" />
        <path className="water-flow" d="M1390 560 C1420 620 1460 650 1470 700 C1480 760 1520 820 1545 900" fill="none" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" />
        {/* Bridge */}
        <g transform="translate(1455 660)">
          <path d="M-60 -6 L60 -6" stroke="#78350f" strokeWidth="4" />
          {p.bridgeFixed ? (
            <>
              {[-50, -30, -10, 10, 30, 50].map((x) => (
                <rect key={x} x={x - 8} y="-4" width="16" height="12" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
              ))}
              <path d="M-60 -6 Q0 18 60 -6" fill="none" stroke="#78350f" strokeWidth="3" />
            </>
          ) : (
            <>
              <rect x="-58" y="-4" width="16" height="12" fill="#b45309" />
              <rect x="44" y="-4" width="16" height="12" fill="#b45309" />
              <rect x="-40" y="4" width="14" height="10" fill="#b45309" transform="rotate(35 -33 9)" />
            </>
          )}
        </g>
        {!p.bridgeFixed && <Cloud x={1450} y={300} s={0.9} dark />}
      </g>
      <Rock x={1230} y={820} />
      <Rock x={1650} y={700} s={0.8} color="#cbd5e1" />
      {/* Waterfall */}
      <g transform="translate(1560 900)">
        <rect x="-20" y="0" width="40" height="70" fill="#7dd3fc" />
        <path className="water-flow" d="M-12 0 L-12 70 M0 0 L0 70 M12 0 L12 70" stroke="#fff" strokeWidth="3" />
        <ellipse cx="0" cy="74" rx="40" ry="10" fill="#e0f2fe" />
      </g>

      {/* --- Basecamp (south) --- */}
      <Tent x={815} y={930} color="#f97316" />
      <Tent x={995} y={935} color="#14b8a6" s={0.9} />
      <Campfire x={905} y={1010} />
      <Flag x={1060} y={980} color="#0ea5e9" />
      <Bush x={720} y={980} />
      <Bush x={1090} y={1040} color="#16a34a" />

      {/* Lighthouse and grove */}
      <Rock x={250} y={950} s={1.4} color="#64748b" />
      <Lighthouse x={225} y={890} />
      <Tree x={600} y={380} s={1.6} color="#15803d" />
      <ScrollPickup x={330} y={905} found={p.factsFound.has('fact-lighthouse')} s={0.9} />
      <ScrollPickup x={665} y={430} found={p.factsFound.has('fact-grove')} s={0.9} />
      <ScrollPickup x={1600} y={950} found={p.factsFound.has('fact-falls')} s={0.9} />

      {/* Scatter */}
      {[
        [700, 640],
        [1110, 620],
        [760, 820],
        [1150, 900],
        [380, 820],
        [1250, 460],
      ].map(([x, y], i) => (
        <Tree key={i} x={x} y={y} s={0.75 + (i % 2) * 0.15} color={i % 2 ? '#16a34a' : '#22c55e'} />
      ))}
      <Bush x={980} y={640} />
      <Flowers x={820} y={660} />
      <Signpost x={960} y={740} />

      {/* Sky life */}
      <Cloud x={300} y={150} s={1.1} />
      <Cloud x={1250} y={170} />
      <Cloud x={700} y={1080} s={0.8} />
      <Birds x={520} y={210} />
      <Birds x={1180} y={420} />
    </g>
  )
}

function Signpost({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-3" y="-60" width="6" height="60" fill="#78350f" />
      <path d="M0 -58 L-46 -58 L-56 -50 L-46 -42 L0 -42 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />
      <path d="M0 -38 L46 -38 L56 -30 L46 -22 L0 -22 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />
      <path d="M-2 -78 L-2 -62 L28 -62 L36 -70 L28 -78 Z" fill="#fde68a" stroke="#92400e" strokeWidth="2" />
    </g>
  )
}
