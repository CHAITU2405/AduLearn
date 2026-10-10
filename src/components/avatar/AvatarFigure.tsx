import type { AvatarConfig } from '@/core/avatar'
import type { CreatureArt } from '@/content/characters'

/** Darken (amt < 0) or lighten (amt > 0) a hex colour. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))))
  const r = ch(n >> 16)
  const g = ch((n >> 8) & 0xff)
  const b = ch(n & 0xff)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export type Mood = 'happy' | 'excited' | 'sad' | 'thinking' | 'surprised'

interface Props {
  config: AvatarConfig
  variant?: 'full' | 'portrait'
  className?: string
  title?: string
  mood?: Mood
  walking?: boolean
}

function Face({ mood }: { mood: Mood }) {
  const ink = '#0b1f3a'
  const eyeY = mood === 'thinking' ? 52 : 55
  return (
    <g>
      {mood === 'sad' && <path d="M43 45 L54 48 M77 45 L66 48" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />}
      {mood === 'surprised' && <path d="M43 44 Q48 41 54 44 M66 44 Q72 41 77 44" stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />}
      <g className="avatar-blink">
        {mood === 'excited' ? (
          <>
            <path d="M44 56 Q49 49 54 56" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M66 56 Q71 49 76 56" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="49" cy={eyeY} rx="3.6" ry={mood === 'surprised' ? 4.6 : 4} fill={ink} />
            <ellipse cx="71" cy={eyeY} rx="3.6" ry={mood === 'surprised' ? 4.6 : 4} fill={ink} />
            <circle cx="50.2" cy={eyeY - 1.4} r="1.2" fill="#fff" />
            <circle cx="72.2" cy={eyeY - 1.4} r="1.2" fill="#fff" />
          </>
        )}
      </g>
      <circle cx="42" cy="65" r="4.5" fill="#fb7185" opacity="0.38" />
      <circle cx="78" cy="65" r="4.5" fill="#fb7185" opacity="0.38" />
      {mood === 'happy' && <path d="M52 66 Q60 73 68 66" fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />}
      {mood === 'excited' && <path d="M51 64 Q60 77 69 64 Z" fill="#7f1d1d" stroke={ink} strokeWidth="2" strokeLinejoin="round" />}
      {mood === 'sad' && <path d="M53 70 Q60 64 67 70" fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />}
      {mood === 'thinking' && <path d="M54 68 L66 66" fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />}
      {mood === 'surprised' && <ellipse cx="60" cy="68" rx="4" ry="5" fill="#7f1d1d" stroke={ink} strokeWidth="2" />}
    </g>
  )
}

/** SVG avatar used for the player and story characters. Full variant is a walkable sprite. */
export function AvatarFigure({ config: c, variant = 'full', className, title, mood = 'happy', walking = false }: Props) {
  const viewBox = variant === 'portrait' ? '16 8 88 88' : '0 0 120 180'
  const hairDark = shade(c.hairColor, -0.25)
  const outfitDark = shade(c.outfitColor, -0.25)
  const packDark = shade(c.backpackColor, -0.3)
  const pants = '#24324d'
  const skinDark = shade(c.skin, -0.12)
  return (
    <svg viewBox={viewBox} className={`${className ?? ''} ${walking ? 'is-walking' : ''}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} overflow="visible">
      {variant === 'full' && <ellipse cx="60" cy="174" rx="30" ry="6" fill="#0b1f3a" opacity="0.18" />}
      {/* Cape behind everything */}
      {c.outfit === 'cape' && <path className="avatar-cape" d="M34 94 L86 94 L98 160 Q60 170 22 160 Z" fill={shade(c.outfitColor, -0.15)} />}
      {/* Backpacks */}
      {c.backpack === 'classic' || c.backpack === 'explorer' ? (
        <g>
          <rect x="24" y="96" width="72" height="48" rx="14" fill={c.backpackColor} />
          {c.backpack === 'explorer' && (
            <>
              <rect x="30" y="86" width="60" height="13" rx="6.5" fill={packDark} />
              <rect x="16" y="108" width="11" height="24" rx="5" fill={packDark} />
              <rect x="93" y="108" width="11" height="24" rx="5" fill={packDark} />
            </>
          )}
        </g>
      ) : null}
      {c.backpack === 'jetpack' && (
        <g>
          <rect x="22" y="94" width="20" height="46" rx="9" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          <rect x="78" y="94" width="20" height="46" rx="9" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          <g className="avatar-flame">
            <path d="M26 140 L32 158 L38 140 Z" fill="#f97316" />
            <path d="M82 140 L88 158 L94 140 Z" fill="#f97316" />
            <path d="M29 140 L32 150 L35 140 Z" fill="#fde047" />
            <path d="M85 140 L88 150 L91 140 Z" fill="#fde047" />
          </g>
        </g>
      )}
      {(c.hairStyle === 'long' || c.hairStyle === 'braid') && <path d="M31 50 C29 84 36 100 44 104 L76 104 C84 100 91 84 89 50 Z" fill={c.hairColor} />}
      {c.hairStyle === 'braid' && (
        <g fill={hairDark}>
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={85 + (i % 2 ? 2 : 0)} cy={94 + i * 10} r="6" />
          ))}
        </g>
      )}
      {/* Legs */}
      {variant === 'full' && (
        <g>
          <g className="avatar-leg-l">
            <rect x="45" y="134" width="13" height="32" rx="6" fill={pants} />
            <ellipse cx="50" cy="167" rx="9" ry="5" fill="#0b1f3a" />
          </g>
          <g className="avatar-leg-r">
            <rect x="62" y="134" width="13" height="32" rx="6" fill={pants} />
            <ellipse cx="70" cy="167" rx="9" ry="5" fill="#0b1f3a" />
          </g>
        </g>
      )}
      {c.outfit === 'hoodie' && <path d="M38 94 C40 78 80 78 82 94 Z" fill={outfitDark} />}
      {/* Arms */}
      <g className="avatar-arm-l">
        <rect x="24" y="96" width="13" height="36" rx="6.5" fill={c.outfit === 'cape' ? shade(c.outfitColor, 0.2) : c.outfitColor} />
        <circle cx="30.5" cy="134" r="6" fill={c.skin} />
      </g>
      <g className="avatar-arm-r">
        <rect x="83" y="96" width="13" height="36" rx="6.5" fill={c.outfit === 'cape' ? shade(c.outfitColor, 0.2) : c.outfitColor} />
        <circle cx="89.5" cy="134" r="6" fill={c.skin} />
      </g>
      {/* Torso */}
      <path d={variant === 'full' ? 'M33 142 C31 112 40 92 60 90 C80 92 89 112 87 142 Z' : 'M26 160 C26 118 38 92 60 90 C82 92 94 118 94 160 Z'} fill={c.outfit === 'cape' ? shade(c.outfitColor, 0.2) : c.outfitColor} />
      {c.outfit === 'kurta' && (
        <g>
          <path d="M60 92 L60 130" stroke={outfitDark} strokeWidth="2.5" />
          {[102, 112, 122].map((y) => (
            <circle key={y} cx="60" cy={y} r="1.8" fill="#fff" opacity="0.9" />
          ))}
          <path d="M35 136 L85 136" stroke={shade(c.outfitColor, 0.35)} strokeWidth="4" />
        </g>
      )}
      {c.outfit === 'jacket' && (
        <g>
          <path d="M50 92 L60 122 L70 92 Z" fill="#f8fafc" />
          <path d="M50 92 L56 116 L44 104 Z M70 92 L64 116 L76 104 Z" fill={outfitDark} />
          <rect x="38" y="122" width="13" height="9" rx="3" fill={outfitDark} />
          <rect x="69" y="122" width="13" height="9" rx="3" fill={outfitDark} />
        </g>
      )}
      {c.outfit === 'hoodie' && (
        <g>
          <path d="M45 126 Q60 120 75 126 L73 138 Q60 135 47 138 Z" fill={outfitDark} />
          <path d="M55 94 L54 108 M65 94 L66 108" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {c.outfit === 'tee' && <path d="M48 92 Q60 102 72 92" fill="none" stroke={outfitDark} strokeWidth="3" strokeLinecap="round" />}
      {c.outfit === 'cape' && <path d="M40 92 Q60 104 80 92 L78 98 Q60 110 42 98 Z" fill="#facc15" />}
      {(c.backpack === 'classic' || c.backpack === 'explorer') && (
        <g stroke={packDark} strokeWidth="5" strokeLinecap="round">
          <path d="M43 96 L40 136" />
          <path d="M77 96 L80 136" />
        </g>
      )}
      {/* Head */}
      <rect x="52" y="72" width="16" height="16" rx="6" fill={skinDark} />
      {c.accessory === 'scarf' && (
        <g>
          <path d="M42 84 Q60 96 78 84 L80 92 Q60 104 40 92 Z" fill={c.backpackColor} />
          <rect x="66" y="90" width="9" height="20" rx="3" fill={packDark} />
        </g>
      )}
      <circle cx="60" cy="52" r="28" fill={c.skin} />
      <circle cx="32" cy="56" r="5" fill={c.skin} />
      <circle cx="88" cy="56" r="5" fill={c.skin} />
      <Face mood={mood} />
      {/* Hair (front) */}
      {c.hairStyle === 'curly' ? (
        <g fill={c.hairColor}>
          {[
            [34, 44],
            [40, 33],
            [51, 26],
            [62, 24],
            [73, 27],
            [82, 35],
            [86, 46],
            [46, 37],
            [67, 33],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="9.5" />
          ))}
        </g>
      ) : c.hairStyle === 'spiky' ? (
        <path d="M32 52 L35 30 L44 37 L48 20 L56 31 L62 16 L68 31 L77 20 L79 37 L87 30 L88 52 C80 41 70 37 60 37 C50 37 40 41 32 52 Z" fill={c.hairColor} />
      ) : (
        <path d="M32 52 C30 26 47 20 62 20 C79 20 92 31 88 52 C81 39 71 35 60 36 C47 36 39 42 32 52 Z" fill={c.hairColor} />
      )}
      {c.hairStyle === 'bun' && <circle cx="60" cy="18" r="10" fill={c.hairColor} />}
      {/* Accessories */}
      {c.accessory === 'glasses' && (
        <g fill="none" stroke="#0b1f3a" strokeWidth="2.2">
          <circle cx="49" cy="55" r="7.5" />
          <circle cx="71" cy="55" r="7.5" />
          <path d="M56.5 55 L63.5 55" />
        </g>
      )}
      {c.accessory === 'headband' && <path d="M33 43 Q60 30 87 43" fill="none" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />}
      {c.accessory === 'cap' && (
        <g>
          <path d="M33 43 C33 20 87 20 87 43 Z" fill={outfitDark} />
          <path d="M60 41 L97 45 Q99 49 93 49 L60 47 Z" fill={shade(c.outfitColor, -0.4)} />
          <circle cx="60" cy="24" r="2.5" fill={shade(c.outfitColor, 0.4)} />
        </g>
      )}
      {c.accessory === 'explorer-hat' && (
        <g>
          <ellipse cx="60" cy="38" rx="42" ry="9" fill="#a16207" />
          <path d="M38 38 C38 16 82 16 82 38 Z" fill="#ca8a04" />
          <rect x="38" y="31" width="44" height="6" fill="#7c2d12" />
        </g>
      )}
      {c.accessory === 'headphones' && (
        <g>
          <path d="M30 54 C28 18 92 18 90 54" fill="none" stroke="#334155" strokeWidth="5" />
          <rect x="24" y="48" width="12" height="18" rx="5" fill="#f43f5e" />
          <rect x="84" y="48" width="12" height="18" rx="5" fill="#f43f5e" />
        </g>
      )}
      {c.accessory === 'flower' && (
        <g>
          <path d="M33 40 Q60 26 87 40" fill="none" stroke="#16a34a" strokeWidth="4" />
          {[
            [36, 39, '#f472b6'],
            [48, 32, '#facc15'],
            [60, 30, '#fb7185'],
            [72, 32, '#a78bfa'],
            [84, 39, '#facc15'],
          ].map(([x, y, col]) => (
            <g key={`${x}`}>
              <circle cx={Number(x)} cy={Number(y)} r="5" fill={String(col)} />
              <circle cx={Number(x)} cy={Number(y)} r="1.8" fill="#fff7ed" />
            </g>
          ))}
        </g>
      )}
      {c.accessory === 'crown' && (
        <g>
          <path d="M40 30 L44 12 L52 24 L60 8 L68 24 L76 12 L80 30 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="60" cy="22" r="3" fill="#f43f5e" />
          <circle cx="47" cy="25" r="2" fill="#0ea5e9" />
          <circle cx="73" cy="25" r="2" fill="#22c55e" />
        </g>
      )}
    </svg>
  )
}

/** Illustrated creatures for bosses and characters. */
export function CreatureFigure({ art, className, title, hurt = false }: { art: CreatureArt; className?: string; title?: string; hurt?: boolean }) {
  const common = { className, role: title ? 'img' : undefined, 'aria-label': title, 'aria-hidden': title ? undefined : true }
  switch (art) {
    case 'gorm':
      return (
        <svg viewBox="0 0 120 120" {...common}>
          <ellipse cx="60" cy="112" rx="40" ry="6" fill="#0b1f3a" opacity="0.12" />
          <path d="M18 110 C14 60 30 22 60 22 C90 22 106 60 102 110 Z" fill="#94a3b8" />
          <path d="M30 40 C40 30 52 34 50 44 M78 30 C88 32 92 42 86 48" stroke="#64748b" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="30" r="7" fill="#4ade80" opacity="0.8" />
          <circle cx="84" cy="26" r="5" fill="#4ade80" opacity="0.8" />
          <ellipse cx="46" cy="58" rx="6" ry={hurt ? 2 : 7} fill="#0b1f3a" />
          <ellipse cx="74" cy="58" rx="6" ry={hurt ? 2 : 7} fill="#0b1f3a" />
          <path d="M38 50 L54 54 M82 50 L66 54" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          <path d="M40 78 Q60 92 80 78" fill="#475569" />
          <path d="M46 80 L48 86 L52 81 M68 81 L72 86 L74 80" fill="#f8fafc" />
        </svg>
      )
    case 'golem':
      return (
        <svg viewBox="0 0 120 120" {...common}>
          <ellipse cx="60" cy="114" rx="42" ry="5" fill="#0b1f3a" opacity="0.15" />
          <path d="M60 4 L52 22 L62 22 L54 38" stroke="#facc15" strokeWidth="4" fill="none" strokeLinejoin="round" opacity={hurt ? 0.3 : 1} />
          <rect x="28" y="34" width="64" height="52" rx="16" fill="#334155" />
          <rect x="10" y="44" width="22" height="40" rx="10" fill="#475569" />
          <rect x="88" y="44" width="22" height="40" rx="10" fill="#475569" />
          <rect x="34" y="84" width="20" height="28" rx="8" fill="#475569" />
          <rect x="66" y="84" width="20" height="28" rx="8" fill="#475569" />
          <path d="M40 46 L80 46" stroke="#1e293b" strokeWidth="3" />
          <circle cx="48" cy="58" r="6" fill={hurt ? '#94a3b8' : '#38bdf8'} />
          <circle cx="72" cy="58" r="6" fill={hurt ? '#94a3b8' : '#38bdf8'} />
          <path d="M46 74 L52 70 L58 74 L64 70 L70 74" stroke="#38bdf8" strokeWidth="3" fill="none" opacity={hurt ? 0.4 : 1} />
          <path d="M30 30 C36 18 50 16 56 24 C64 12 84 16 88 30 Z" fill="#64748b" />
        </svg>
      )
    case 'owl':
      return (
        <svg viewBox="0 0 120 120" {...common}>
          <ellipse cx="60" cy="114" rx="34" ry="5" fill="#0b1f3a" opacity="0.12" />
          <path d="M26 104 C20 60 30 22 60 22 C90 22 100 60 94 104 Z" fill="#a16207" />
          <path d="M30 26 L40 10 L48 26 M90 26 L80 10 L72 26" fill="#854d0e" />
          <path d="M40 66 C40 96 80 96 80 66 C80 80 40 80 40 66 Z" fill="#fde68a" />
          <circle cx="45" cy="50" r="14" fill="#fef3c7" />
          <circle cx="75" cy="50" r="14" fill="#fef3c7" />
          <circle cx="45" cy="50" r={hurt ? 3 : 7} fill="#0b1f3a" />
          <circle cx="75" cy="50" r={hurt ? 3 : 7} fill="#0b1f3a" />
          <path d="M55 60 L60 70 L65 60 Z" fill="#f97316" />
          <rect x="36" y="92" width="48" height="14" rx="3" fill="#6366f1" />
          <path d="M60 92 L60 106" stroke="#eef2ff" strokeWidth="2" />
        </svg>
      )
    case 'cloud':
      return (
        <svg viewBox="0 0 120 120" {...common}>
          <path d="M54 82 L46 100 L56 100 L50 116" stroke="#facc15" strokeWidth="4" fill="none" strokeLinejoin="round" opacity={hurt ? 0.3 : 1} />
          <path d="M28 80 C10 80 10 54 30 54 C30 32 58 26 66 44 C74 30 100 36 96 56 C112 58 110 80 94 80 Z" fill="#cbd5e1" />
          <path d="M28 80 C10 80 10 54 30 54" fill="none" stroke="#94a3b8" strokeWidth="3" />
          <circle cx="50" cy="62" r={hurt ? 2 : 5} fill="#0b1f3a" />
          <circle cx="72" cy="62" r={hurt ? 2 : 5} fill="#0b1f3a" />
          <path d={hurt ? 'M52 74 Q61 70 70 74' : 'M52 72 Q61 78 70 72'} stroke="#0b1f3a" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      )
  }
}
