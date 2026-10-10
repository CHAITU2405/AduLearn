import type { AvatarConfig } from '@/core/avatar'
import { AvatarFigure } from '@/components/avatar/AvatarFigure'

/** Illustrated landscape: a winding path climbing towards a summit flag. */
export function HeroScene({ avatar, className }: { avatar?: AvatarConfig; className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 480 320" className="h-auto w-full" role="img" aria-label="An explorer climbing a winding path towards a mountain summit">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bae6fd" />
            <stop offset="1" stopColor="#f0f9ff" />
          </linearGradient>
        </defs>
        <rect width="480" height="320" rx="32" fill="url(#sky)" />
        <circle cx="390" cy="70" r="34" fill="#fde047" />
        <g className="animate-drift" fill="#fff" opacity="0.9">
          <ellipse cx="90" cy="60" rx="40" ry="14" />
          <ellipse cx="120" cy="52" rx="26" ry="14" />
          <ellipse cx="300" cy="44" rx="30" ry="10" />
        </g>
        <path d="M0 230 L120 110 L200 180 L290 70 L400 190 L480 140 L480 320 L0 320 Z" fill="#7dd3fc" opacity="0.55" />
        <path d="M250 110 L290 70 L330 112 L310 104 L290 118 L270 104 Z" fill="#fff" />
        <path d="M290 70 L290 36" stroke="#0b1f3a" strokeWidth="3" />
        <path d="M290 36 L318 44 L290 54 Z" fill="#f97316" />
        <path d="M0 260 Q120 200 240 240 T480 220 L480 320 L0 320 Z" fill="#86efac" />
        <path d="M0 290 Q140 250 260 280 T480 270 L480 320 L0 320 Z" fill="#4ade80" />
        <path d="M60 320 C120 280 170 270 210 240 C250 210 240 170 280 140 C300 124 296 100 290 76" fill="none" stroke="#fde68a" strokeWidth="14" strokeLinecap="round" />
        <path
          d="M60 320 C120 280 170 270 210 240 C250 210 240 170 280 140 C300 124 296 100 290 76"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="6 10"
          strokeLinecap="round"
        />
        {/* Learning landmarks along the path */}
        <g>
          <rect x="120" y="248" width="26" height="20" rx="3" fill="#6366f1" />
          <path d="M133 248 L133 268" stroke="#eef2ff" strokeWidth="2" />
          <circle cx="262" cy="190" r="13" fill="#f97316" />
          <text x="262" y="195" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">
            π
          </text>
          <path d="M318 150 l10 -18 l10 18 z" fill="#14b8a6" />
          <circle cx="328" cy="152" r="9" fill="#14b8a6" />
        </g>
        <g fill="#16a34a">
          <circle cx="40" cy="250" r="16" />
          <circle cx="420" cy="236" r="18" />
          <circle cx="450" cy="250" r="12" />
        </g>
        {avatar && (
          <foreignObject x="176" y="168" width="64" height="86">
            <AvatarFigure config={avatar} className="h-full w-full" />
          </foreignObject>
        )}
      </svg>
    </div>
  )
}
