import { Link } from 'react-router'
import { CheckCircle2, Lock } from 'lucide-react'
import { AvatarFigure } from '@/components/avatar/AvatarFigure'
import { cn } from '@/components/ui'
import type { AvatarConfig } from '@/core/avatar'
import type { Region } from '@/core/content/types'
import type { NodeState } from '@/core/game/progression'

const POSITIONS: Record<string, { left: string; top: string }> = {
  words: { left: '20%', top: '60%' },
  numbers: { left: '79%', top: '67%' },
  discovery: { left: '50%', top: '32%' },
}

/** Illustrated, interactive world map. Region markers are real links. */
export function WorldMap({ regions, states, avatar }: { regions: Region[]; states: Record<string, NodeState>; avatar: AvatarConfig }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2rem] border-4 border-white shadow-lift">
      <svg viewBox="0 0 800 500" className="absolute inset-0 size-full" aria-hidden preserveAspectRatio="xMidYMid slice">
        <rect width="800" height="500" fill="#7dd3fc" />
        <path d="M60 120 C120 40 300 20 420 40 C560 20 720 60 760 160 C800 260 760 420 640 460 C500 500 280 490 160 450 C40 410 0 220 60 120 Z" fill="#bbf7d0" />
        <path d="M80 140 C140 70 300 50 420 64 C550 50 700 90 735 170 C770 260 730 400 630 435 C500 470 290 465 175 430 C70 395 30 230 80 140 Z" fill="#86efac" />
        {/* Discovery: forest and lab dome */}
        <g>
          {[
            [300, 110],
            [330, 90],
            [470, 90],
            [500, 112],
            [360, 70],
            [440, 72],
          ].map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 3} y={y} width="6" height="16" fill="#92400e" />
              <circle cx={x} cy={y - 4} r="16" fill={i % 2 ? '#16a34a' : '#15803d'} />
            </g>
          ))}
          <path d="M370 120 A30 30 0 0 1 430 120 Z" fill="#ccfbf1" stroke="#14b8a6" strokeWidth="4" />
          <rect x="366" y="118" width="68" height="10" rx="3" fill="#14b8a6" />
        </g>
        {/* Words: castle library */}
        <g>
          <rect x="110" y="190" width="100" height="70" fill="#c7d2fe" stroke="#6366f1" strokeWidth="4" />
          <rect x="100" y="170" width="26" height="90" fill="#a5b4fc" stroke="#6366f1" strokeWidth="4" />
          <rect x="194" y="170" width="26" height="90" fill="#a5b4fc" stroke="#6366f1" strokeWidth="4" />
          <path d="M98 172 L113 150 L128 172 Z M192 172 L207 150 L222 172 Z" fill="#6366f1" />
          <path d="M146 260 L146 228 A14 14 0 0 1 174 228 L174 260 Z" fill="#4338ca" />
          <rect x="128" y="200" width="16" height="12" rx="2" fill="#fde68a" />
          <rect x="176" y="200" width="16" height="12" rx="2" fill="#fde68a" />
        </g>
        {/* Numbers: mountains and bridge */}
        <g>
          <path d="M540 280 L600 170 L650 250 L690 190 L740 280 Z" fill="#fdba74" stroke="#f97316" strokeWidth="4" strokeLinejoin="round" />
          <path d="M588 192 L600 170 L612 192 Z" fill="#fff" />
          <path d="M560 300 Q630 270 700 300" fill="none" stroke="#9a3412" strokeWidth="6" />
          {[575, 600, 625, 650, 675].map((x) => (
            <line key={x} x1={x} y1={291} x2={x} y2={300} stroke="#9a3412" strokeWidth="3" />
          ))}
        </g>
        {/* River */}
        <path d="M800 330 C700 340 640 320 560 350 C480 380 420 360 380 400 C350 430 360 470 340 500" fill="none" stroke="#38bdf8" strokeWidth="18" strokeLinecap="round" />
        {/* Trails from basecamp */}
        <g fill="none" stroke="#fde68a" strokeWidth="10" strokeLinecap="round" strokeDasharray="1 16">
          <path d="M400 380 C320 360 230 330 170 270" />
          <path d="M400 380 C480 370 560 340 620 300" />
          <path d="M400 380 C400 300 400 220 400 140" />
        </g>
        {/* Basecamp */}
        <path d="M370 395 L400 350 L430 395 Z" fill="#f97316" />
        <path d="M400 350 L400 395" stroke="#c2410c" strokeWidth="3" />
        <g className="animate-drift" fill="#fff" opacity="0.85">
          <ellipse cx="120" cy="70" rx="40" ry="12" />
          <ellipse cx="660" cy="60" rx="46" ry="12" />
        </g>
      </svg>

      <div className="absolute left-1/2 top-[70%] w-[8%] -translate-x-1/2 -translate-y-1/2" aria-hidden>
        <AvatarFigure config={avatar} className="animate-float h-auto w-full drop-shadow" />
      </div>

      {regions.map((r) => {
        const state = states[r.id] ?? 'locked'
        const pos = POSITIONS[r.id] ?? { left: '50%', top: '50%' }
        const inner = (
          <>
            <span className="flex items-center gap-1.5 font-display text-sm font-bold leading-tight sm:text-lg">
              {state === 'locked' && <Lock className="size-4 shrink-0" aria-hidden />}
              {state === 'completed' && <CheckCircle2 className="size-4 shrink-0 text-leaf-deep" aria-hidden />}
              {r.name}
            </span>
            <span className="hidden text-xs font-bold text-ink-muted sm:block">
              {r.subjectLabel} · {state === 'locked' ? 'Locked' : state === 'completed' ? 'Completed' : 'Open'}
            </span>
          </>
        )
        const cls = cn(
          'absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 bg-white/95 px-2 py-1 text-center shadow-soft transition-transform sm:px-4 sm:py-2',
          state === 'locked' ? 'cursor-not-allowed border-line text-ink-muted' : 'border-white hover:-translate-y-[55%] hover:shadow-lift',
        )
        return state === 'locked' ? (
          <div key={r.id} className={cls} style={{ ...pos, borderColor: undefined }} aria-label={`${r.name} (${r.subjectLabel}) — locked`}>
            {inner}
          </div>
        ) : (
          <Link
            key={r.id}
            to={`/region/${r.id}`}
            className={cls}
            style={{ ...pos, boxShadow: `0 0 0 4px ${r.theme.primary}33` }}
            aria-label={`${r.name} (${r.subjectLabel}) — ${state === 'completed' ? 'completed' : 'open'}`}
          >
            {inner}
          </Link>
        )
      })}
    </div>
  )
}
