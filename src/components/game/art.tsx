/**
 * Scene art kit: small SVG building blocks (all <g> elements positioned with
 * x/y and an optional scale) used to compose the explorable maps.
 */
import type { ReactNode } from 'react'

type P = { x: number; y: number; s?: number }
const T = ({ x, y, s = 1, children, className }: P & { children: ReactNode; className?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className={className}>{children}</g>
  </g>
)

export function Tree({ color = '#16a34a', ...p }: P & { color?: string }) {
  return (
    <T {...p} className="sway">
      <ellipse cx="0" cy="4" rx="26" ry="7" fill="#0b1f3a" opacity="0.12" />
      <rect x="-5" y="-30" width="10" height="34" rx="4" fill="#92400e" />
      <circle cx="0" cy="-52" r="30" fill={color} />
      <circle cx="-16" cy="-38" r="18" fill={color} />
      <circle cx="17" cy="-40" r="18" fill={color} />
      <circle cx="-8" cy="-62" r="12" fill="#fff" opacity="0.14" />
    </T>
  )
}

export function Pine({ color = '#15803d', ...p }: P & { color?: string }) {
  return (
    <T {...p} className="sway">
      <ellipse cx="0" cy="3" rx="20" ry="6" fill="#0b1f3a" opacity="0.12" />
      <rect x="-4" y="-14" width="8" height="17" fill="#78350f" />
      <path d="M0 -86 L22 -46 L12 -46 L28 -14 L-28 -14 L-12 -46 L-22 -46 Z" fill={color} />
      <path d="M0 -86 L8 -70 L-4 -64 Z" fill="#fff" opacity="0.15" />
    </T>
  )
}

export function Bush({ color = '#22c55e', ...p }: P & { color?: string }) {
  return (
    <T {...p}>
      <circle cx="-12" cy="-8" r="12" fill={color} />
      <circle cx="4" cy="-12" r="15" fill={color} />
      <circle cx="18" cy="-6" r="10" fill={color} />
    </T>
  )
}

export function Rock({ color = '#94a3b8', ...p }: P & { color?: string }) {
  return (
    <T {...p}>
      <path d="M-28 0 L-20 -22 L2 -30 L24 -18 L30 0 Z" fill={color} />
      <path d="M-20 -22 L2 -30 L-4 -12 Z" fill="#fff" opacity="0.2" />
    </T>
  )
}

export function Flowers(p: P) {
  const cols = ['#f472b6', '#facc15', '#fb7185', '#a78bfa', '#fff']
  return (
    <T {...p}>
      {[-24, -10, 6, 20, -2].map((dx, i) => (
        <g key={i} transform={`translate(${dx} ${(i % 2) * 8})`}>
          <path d="M0 0 L0 -10" stroke="#16a34a" strokeWidth="2" />
          <circle cx="0" cy="-12" r="4" fill={cols[i]} />
        </g>
      ))}
    </T>
  )
}

export function Cloud({ x, y, s = 1, dark = false }: P & { dark?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="drift-slow">
        <ellipse cx="0" cy="0" rx="60" ry="22" fill={dark ? '#475569' : '#fff'} opacity={dark ? 0.95 : 0.92} />
        <ellipse cx="-30" cy="-12" rx="34" ry="22" fill={dark ? '#475569' : '#fff'} opacity={dark ? 0.95 : 0.92} />
        <ellipse cx="26" cy="-18" rx="38" ry="26" fill={dark ? '#334155' : '#fff'} opacity={dark ? 0.95 : 0.92} />
      </g>
    </g>
  )
}

export function Birds({ x, y }: P) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="drift-slow">
        {[0, 34, 18].map((dx, i) => (
          <path key={i} d={`M${dx - 10} ${i * 12} q10 -10 10 0 q0 -10 10 0`} fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
        ))}
      </g>
    </g>
  )
}

export function Tent({ color = '#f97316', ...p }: P & { color?: string }) {
  return (
    <T {...p}>
      <ellipse cx="0" cy="2" rx="48" ry="9" fill="#0b1f3a" opacity="0.14" />
      <path d="M-44 0 L0 -62 L44 0 Z" fill={color} />
      <path d="M0 -62 L18 0 L-18 0 Z" fill="#0b1f3a" opacity="0.25" />
      <path d="M0 -62 L0 -76" stroke="#7c2d12" strokeWidth="3" />
      <path d="M0 -76 L18 -70 L0 -64 Z" fill="#facc15" />
    </T>
  )
}

export function Campfire(p: P) {
  return (
    <T {...p}>
      <ellipse cx="0" cy="2" rx="26" ry="6" fill="#0b1f3a" opacity="0.15" />
      <path d="M-20 0 L20 -6 M-20 -6 L20 0" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
      <g className="avatar-flame">
        <path d="M-12 -4 Q-14 -26 0 -38 Q14 -26 12 -4 Z" fill="#f97316" />
        <path d="M-6 -4 Q-6 -18 0 -26 Q6 -18 6 -4 Z" fill="#fde047" />
      </g>
      <circle className="smoke" cx="0" cy="-44" r="7" fill="#cbd5e1" />
    </T>
  )
}

export function House({ roof = '#6366f1', wall = '#fef3c7', lit = false, ...p }: P & { roof?: string; wall?: string; lit?: boolean }) {
  return (
    <T {...p}>
      <ellipse cx="0" cy="2" rx="48" ry="8" fill="#0b1f3a" opacity="0.14" />
      <rect x="-38" y="-52" width="76" height="52" rx="4" fill={wall} stroke="#78350f" strokeWidth="2" />
      <path d="M-48 -50 L0 -88 L48 -50 Z" fill={roof} />
      <rect x="-9" y="-28" width="18" height="28" rx="8" fill="#92400e" />
      <rect x="-30" y="-42" width="14" height="12" rx="2" fill={lit ? '#fde047' : '#bfdbfe'} stroke="#78350f" strokeWidth="1.5" />
      <rect x="16" y="-42" width="14" height="12" rx="2" fill={lit ? '#fde047' : '#bfdbfe'} stroke="#78350f" strokeWidth="1.5" />
      <rect x="18" y="-82" width="10" height="20" fill="#78350f" />
    </T>
  )
}

export function Signboard({ text, tilt = 0, ...p }: P & { text?: string; tilt?: number }) {
  return (
    <T {...p}>
      <rect x="-3" y="-40" width="6" height="40" fill="#78350f" />
      <g transform={`rotate(${tilt} 0 -44)`}>
        <rect x="-34" y="-62" width="68" height="26" rx="5" fill="#fbbf24" stroke="#92400e" strokeWidth="3" />
        {text && (
          <text x="0" y="-44" textAnchor="middle" fontSize="12" fontWeight="800" fill="#422006" fontFamily="Nunito Variable, sans-serif">
            {text}
          </text>
        )}
      </g>
    </T>
  )
}

export function Crystal({ color = '#22d3ee', ...p }: P & { color?: string }) {
  return (
    <T {...p}>
      <path d="M0 0 L-12 -20 L0 -46 L12 -20 Z" fill={color} />
      <path d="M0 -46 L12 -20 L0 0 Z" fill="#fff" opacity="0.3" />
      <path d="M-18 0 L-24 -14 L-16 -28 L-10 -14 Z" fill={color} opacity="0.8" />
      <circle className="twinkle" cx="4" cy="-38" r="2.5" fill="#fff" />
    </T>
  )
}

export function Waves({ x, y, w = 200 }: P & { w?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity="0.6">
      <path
        className="water-flow"
        d={`M0 0 q12 -6 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0`}
        transform={`scale(${w / 192} 1)`}
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  )
}

export function Flag({ color = '#f43f5e', ...p }: P & { color?: string }) {
  return (
    <T {...p}>
      <path d="M0 0 L0 -54" stroke="#334155" strokeWidth="3" />
      <path className="sway" d="M0 -54 L30 -46 L0 -36 Z" fill={color} />
    </T>
  )
}

export function Lighthouse(p: P) {
  return (
    <T {...p}>
      <path d="M-22 0 L-14 -110 L14 -110 L22 0 Z" fill="#fff" stroke="#334155" strokeWidth="2" />
      <path d="M-19 -30 L19 -30 L17 -52 L-17 -52 Z M-15 -74 L15 -74 L13.5 -94 L-13.5 -94 Z" fill="#ef4444" />
      <rect x="-16" y="-128" width="32" height="18" rx="3" fill="#fde047" className="twinkle" />
      <path d="M-20 -128 L0 -146 L20 -128 Z" fill="#334155" />
    </T>
  )
}

export function Fountain(p: P) {
  return (
    <T {...p}>
      <ellipse cx="0" cy="0" rx="46" ry="14" fill="#94a3b8" />
      <ellipse cx="0" cy="-4" rx="38" ry="10" fill="#7dd3fc" />
      <rect x="-5" y="-40" width="10" height="36" fill="#94a3b8" />
      <path className="twinkle" d="M0 -42 Q-18 -60 -26 -10 M0 -42 Q18 -60 26 -10" fill="none" stroke="#bae6fd" strokeWidth="3" />
    </T>
  )
}

/** Rope barrier with padlock shown in front of locked locations. */
export function Barrier(p: P) {
  return (
    <T {...p}>
      <rect x="-32" y="-28" width="6" height="28" fill="#78350f" />
      <rect x="26" y="-28" width="6" height="28" fill="#78350f" />
      <path d="M-29 -22 Q0 -8 29 -22" stroke="#b45309" strokeWidth="4" fill="none" />
      <rect x="-8" y="-20" width="16" height="13" rx="3" fill="#64748b" />
      <path d="M-5 -20 L-5 -25 Q0 -31 5 -25 L5 -20" stroke="#64748b" strokeWidth="3" fill="none" />
    </T>
  )
}

/** Glowing parchment scroll (collectible fact). */
export function ScrollPickup({ found, ...p }: P & { found: boolean }) {
  return (
    <T {...p}>
      {!found && <circle className="twinkle" cx="0" cy="-20" r="24" fill="#fde047" opacity="0.4" />}
      <g className={found ? undefined : 'bounce-marker'}>
        <rect x="-16" y="-32" width="32" height="22" rx="4" fill={found ? '#e7e5e4' : '#fef3c7'} stroke="#a16207" strokeWidth="2" />
        <circle cx="-16" cy="-21" r="5" fill="#d97706" />
        <circle cx="16" cy="-21" r="5" fill="#d97706" />
        <path d="M-9 -25 L9 -25 M-9 -19 L5 -19" stroke="#a16207" strokeWidth="2" />
      </g>
    </T>
  )
}

export function Sky({ w, h, from, to }: { w: number; h: number; from: string; to: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`sky-${from.slice(1)}-${to.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#sky-${from.slice(1)}-${to.slice(1)})`} />
    </>
  )
}
