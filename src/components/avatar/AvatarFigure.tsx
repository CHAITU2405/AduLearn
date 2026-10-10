import { useId } from 'react'
import type { AvatarConfig } from '@/core/avatar'
import type { CreatureArt } from '@/content/characters'
import { CREATURE_ART } from '@/game/art'

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

/** Outline colour shared with the painted artwork's linework. */
const OL = '#3b2a1e'
const SW = 2.4
const line = { stroke: OL, strokeWidth: SW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

function Face({ mood, brow }: { mood: Mood; brow: string }) {
  const eyeY = mood === 'thinking' ? 56 : 59
  const brows = {
    happy: 'M42 48 Q47 45 53 47 M67 47 Q73 45 78 48',
    excited: 'M42 46 Q47 42 53 45 M67 45 Q73 42 78 46',
    sad: 'M42 50 Q48 47 53 45 M67 45 Q72 47 78 50',
    thinking: 'M42 47 Q47 45 53 47 M67 44 Q73 41 78 44',
    surprised: 'M42 44 Q47 40 53 43 M67 43 Q73 40 78 44',
  }[mood]
  const eye = (cx: number) =>
    mood === 'excited' ? (
      <path d={`M${cx - 5.5} ${eyeY + 1} Q${cx} ${eyeY - 7} ${cx + 5.5} ${eyeY + 1}`} fill="none" stroke={OL} strokeWidth="3" strokeLinecap="round" />
    ) : (
      <g>
        <ellipse cx={cx} cy={eyeY} rx="5.6" ry={mood === 'surprised' ? 7 : 6.4} fill="#fff" stroke={OL} strokeWidth="1.8" />
        <ellipse cx={cx + (mood === 'thinking' ? 1.2 : 0.4)} cy={eyeY + (mood === 'thinking' ? -1.4 : 0.8)} rx="3.6" ry="4.4" fill="#5b3a24" />
        <ellipse cx={cx + (mood === 'thinking' ? 1.2 : 0.4)} cy={eyeY + (mood === 'thinking' ? -1.4 : 0.8)} rx="2" ry="2.6" fill="#1c120b" />
        <circle cx={cx + 1.8} cy={eyeY - 1.6} r="1.5" fill="#fff" />
        <circle cx={cx - 1.4} cy={eyeY + 2.6} r="0.8" fill="#fff" opacity="0.8" />
      </g>
    )
  return (
    <g>
      <path d={brows} fill="none" stroke={brow} strokeWidth="2.6" strokeLinecap="round" />
      <g className="avatar-blink">
        {eye(48)}
        {eye(72)}
      </g>
      <ellipse cx="41" cy="69" rx="5.5" ry="3.4" fill="#fb7185" opacity="0.42" />
      <ellipse cx="79" cy="69" rx="5.5" ry="3.4" fill="#fb7185" opacity="0.42" />
      <path d="M58.5 65 Q60 67 61.5 65" fill="none" stroke={OL} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      {mood === 'happy' && <path d="M52 71 Q60 78 68 71" fill="none" stroke={OL} strokeWidth="2.6" strokeLinecap="round" />}
      {mood === 'excited' && (
        <g>
          <path d="M51 70 Q60 82 69 70 Z" fill="#9f1239" stroke={OL} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M55 75 Q60 79 65 75 Q60 73 55 75 Z" fill="#fb7185" />
        </g>
      )}
      {mood === 'sad' && <path d="M53 75 Q60 69 67 75" fill="none" stroke={OL} strokeWidth="2.6" strokeLinecap="round" />}
      {mood === 'thinking' && <path d="M54 73 Q61 74 66 71" fill="none" stroke={OL} strokeWidth="2.6" strokeLinecap="round" />}
      {mood === 'surprised' && <ellipse cx="60" cy="73" rx="4" ry="5" fill="#9f1239" stroke={OL} strokeWidth="2" />}
    </g>
  )
}

/** Front hair shapes (drawn over the head). */
function HairFront({ style, color, dark }: { style: AvatarConfig['hairStyle']; color: string; dark: string }) {
  const hl = <path d="M40 31 Q52 23 66 25" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.28" />
  if (style === 'curly') {
    const puffs = [
      [33, 47, 9],
      [36, 35, 10],
      [46, 26, 11],
      [59, 22, 11.5],
      [72, 25, 11],
      [83, 33, 10],
      [87, 46, 9],
      [53, 34, 8],
      [67, 33, 8],
    ]
    return (
      <g>
        {puffs.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={color} {...line} />
        ))}
        {puffs.slice(0, 7).map(([x, y], i) => (
          <circle key={`d${i}`} cx={x + 2} cy={y + 2} r="3" fill={dark} opacity="0.5" />
        ))}
        {hl}
      </g>
    )
  }
  if (style === 'spiky') {
    return (
      <g>
        <path d="M28 56 L30 34 L39 39 L42 20 L52 31 L60 13 L68 31 L78 20 L81 39 L90 34 L92 56 C86 44 76 39 60 39 C46 39 34 44 28 56 Z" fill={color} {...line} />
        <path d="M44 38 L48 27 M60 37 L60 22 M74 38 L72 27" stroke={dark} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        {hl}
      </g>
    )
  }
  // short, long, bun and braid share a swept fringe
  return (
    <g>
      <path d="M28 57 C25 31 41 17 61 17 C80 17 96 30 92 57 C88 46 82 40 72 38 C67 44 57 46 48 42 C40 44 33 49 28 57 Z" fill={color} {...line} />
      <path d="M48 42 C55 40 62 36 66 30 M72 38 C76 36 80 34 82 30" fill="none" stroke={dark} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      {(style === 'long' || style === 'braid') && (
        <>
          <path d="M29 50 C26 62 27 74 31 82 C34 72 34 60 35 50 Z" fill={color} {...line} />
          <path d="M91 50 C94 62 93 74 89 82 C86 72 86 60 85 50 Z" fill={color} {...line} />
        </>
      )}
      {style === 'bun' && (
        <g>
          <circle cx="60" cy="15" r="11" fill={color} {...line} />
          <path d="M53 13 Q60 8 67 13" fill="none" stroke={dark} strokeWidth="2" opacity="0.7" />
          <rect x="52" y="22" width="16" height="5" rx="2.5" fill="#f43f5e" {...line} strokeWidth={1.6} />
        </g>
      )}
      {hl}
    </g>
  )
}

/** SVG avatar used for the player and story characters. Full variant is a walkable sprite. */
export function AvatarFigure({ config: c, variant = 'full', className, title, mood = 'happy', walking = false }: Props) {
  const uid = useId().replace(/:/g, '')
  const viewBox = variant === 'portrait' ? '14 4 92 92' : '0 0 120 180'
  const hairDark = shade(c.hairColor, -0.3)
  const top = c.outfit === 'cape' ? shade(c.outfitColor, 0.25) : c.outfitColor
  const outfitDark = shade(c.outfitColor, -0.28)
  const packDark = shade(c.backpackColor, -0.3)
  const skinShade = shade(c.skin, -0.16)
  const pants = '#2b3a5c'
  const full = variant === 'full'
  return (
    <svg
      viewBox={viewBox}
      className={`${className ?? ''} ${walking ? 'is-walking' : ''}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      overflow={variant === 'portrait' ? 'hidden' : 'visible'}
    >
      <defs>
        <clipPath id={`head-${uid}`}>
          <circle cx="60" cy="56" r="32" />
        </clipPath>
        <clipPath id={`body-${uid}`}>
          <path d={full ? 'M34 142 C33 117 40 98 60 96 C80 98 87 117 86 142 Q60 148 34 142 Z' : 'M24 170 C24 122 38 98 60 96 C82 98 96 122 96 170 Z'} />
        </clipPath>
      </defs>
      {full && <ellipse cx="60" cy="173" rx="30" ry="6" fill="#000" opacity="0.2" />}

      {/* Behind the body: cape, backpack, long hair, hood */}
      {c.outfit === 'cape' && <path className="avatar-cape" d="M34 98 L86 98 L100 164 Q60 174 20 164 Z" fill={shade(c.outfitColor, -0.1)} {...line} />}
      {(c.backpack === 'classic' || c.backpack === 'explorer') && (
        <g>
          <rect x="23" y="100" width="74" height="46" rx="14" fill={c.backpackColor} {...line} />
          {c.backpack === 'explorer' && (
            <>
              <rect x="30" y="90" width="60" height="13" rx="6.5" fill={packDark} {...line} />
              <rect x="15" y="111" width="11" height="24" rx="5" fill={packDark} {...line} />
              <rect x="94" y="111" width="11" height="24" rx="5" fill={packDark} {...line} />
            </>
          )}
        </g>
      )}
      {c.backpack === 'jetpack' && (
        <g>
          <rect x="21" y="98" width="20" height="44" rx="9" fill="#cbd5e1" {...line} />
          <rect x="79" y="98" width="20" height="44" rx="9" fill="#cbd5e1" {...line} />
          <rect x="25" y="104" width="5" height="30" rx="2.5" fill="#fff" opacity="0.6" />
          <rect x="83" y="104" width="5" height="30" rx="2.5" fill="#fff" opacity="0.6" />
          <g className="avatar-flame">
            <path d="M25 142 L31 162 L37 142 Z" fill="#f97316" />
            <path d="M83 142 L89 162 L95 142 Z" fill="#f97316" />
            <path d="M28 142 L31 152 L34 142 Z" fill="#fde047" />
            <path d="M86 142 L89 152 L92 142 Z" fill="#fde047" />
          </g>
        </g>
      )}
      {(c.hairStyle === 'long' || c.hairStyle === 'braid') && <path d="M27 54 C24 88 31 106 41 112 L79 112 C89 106 96 88 93 54 Z" fill={c.hairColor} {...line} />}
      {c.hairStyle === 'braid' && (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} cx={86 + (i % 2 ? 2 : 0)} cy={98 + i * 10} rx="6.5" ry="6" fill={c.hairColor} {...line} />
          ))}
          <path d="M84 140 L92 140 L88 147 Z" fill="#f43f5e" {...line} strokeWidth={1.6} />
        </g>
      )}
      {c.outfit === 'hoodie' && <path d="M36 98 C38 80 82 80 84 98 Z" fill={outfitDark} {...line} />}

      {/* Legs and shoes */}
      {full && (
        <g>
          <g className="avatar-leg-l">
            <rect x="45" y="134" width="13" height="28" rx="5.5" fill={pants} {...line} />
            <path d="M41 162 Q41 156 47 156 L56 156 Q60 156 60 161 L60 166 L41 166 Z" fill="#334155" {...line} />
            <path d="M41 166 L60 166" stroke="#f8fafc" strokeWidth="2.4" />
          </g>
          <g className="avatar-leg-r">
            <rect x="62" y="134" width="13" height="28" rx="5.5" fill={pants} {...line} />
            <path d="M60 162 Q60 156 66 156 L74 156 Q79 156 79 161 L79 166 L60 166 Z" fill="#334155" {...line} />
            <path d="M60 166 L79 166" stroke="#f8fafc" strokeWidth="2.4" />
          </g>
        </g>
      )}

      {/* Arms */}
      <g className="avatar-arm-l">
        <rect x="23" y="100" width="14" height="32" rx="7" fill={top} {...line} />
        <circle cx="30" cy="134" r="6.5" fill={c.skin} {...line} />
      </g>
      <g className="avatar-arm-r">
        <rect x="83" y="100" width="14" height="32" rx="7" fill={top} {...line} />
        <circle cx="90" cy="134" r="6.5" fill={c.skin} {...line} />
      </g>

      {/* Torso with cel shading */}
      <path d={full ? 'M34 142 C33 117 40 98 60 96 C80 98 87 117 86 142 Q60 148 34 142 Z' : 'M24 170 C24 122 38 98 60 96 C82 98 96 122 96 170 Z'} fill={top} {...line} />
      <g clipPath={`url(#body-${uid})`}>
        <path d="M66 94 C84 100 92 124 90 150 L100 150 L100 94 Z" fill="#000" opacity="0.13" />
        {c.outfit === 'kurta' && (
          <g>
            <path d="M60 97 L60 132" stroke={outfitDark} strokeWidth="2.5" />
            {[104, 113, 122].map((y) => (
              <circle key={y} cx="60" cy={y} r="1.9" fill="#fef3c7" stroke={OL} strokeWidth="1" />
            ))}
            <path d="M30 136 L90 136" stroke={shade(c.outfitColor, 0.35)} strokeWidth="5" />
          </g>
        )}
        {c.outfit === 'jacket' && (
          <g>
            <path d="M50 96 L60 124 L70 96 Z" fill="#f8fafc" {...line} strokeWidth={1.8} />
            <path d="M50 96 L56 118 L43 106 Z M70 96 L64 118 L77 106 Z" fill={outfitDark} {...line} strokeWidth={1.8} />
            <rect x="38" y="124" width="13" height="9" rx="2.5" fill={outfitDark} {...line} strokeWidth={1.6} />
            <rect x="69" y="124" width="13" height="9" rx="2.5" fill={outfitDark} {...line} strokeWidth={1.6} />
          </g>
        )}
        {c.outfit === 'hoodie' && (
          <g>
            <path d="M45 127 Q60 121 75 127 L73 140 Q60 137 47 140 Z" fill={outfitDark} {...line} strokeWidth={1.8} />
            <path d="M55 99 L54 113 M65 99 L66 113" stroke="#f8fafc" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="54" cy="114" r="1.8" fill="#f8fafc" />
            <circle cx="66" cy="114" r="1.8" fill="#f8fafc" />
          </g>
        )}
        {c.outfit === 'tee' && (
          <g>
            <path d="M48 96 Q60 106 72 96" fill="none" stroke={outfitDark} strokeWidth="3" strokeLinecap="round" />
            <circle cx="60" cy="118" r="7" fill="#fff" opacity="0.85" />
            <path d="M60 113 L61.6 116.6 L65.4 117 L62.6 119.6 L63.4 123.4 L60 121.5 L56.6 123.4 L57.4 119.6 L54.6 117 L58.4 116.6 Z" fill={outfitDark} />
          </g>
        )}
        {c.outfit === 'cape' && <path d="M40 96 Q60 108 80 96 L78 102 Q60 114 42 102 Z" fill="#facc15" {...line} strokeWidth={1.8} />}
      </g>
      {(c.backpack === 'classic' || c.backpack === 'explorer') && (
        <g>
          <path d="M43 99 L40 138" stroke={packDark} strokeWidth="6" strokeLinecap="round" />
          <path d="M77 99 L80 138" stroke={packDark} strokeWidth="6" strokeLinecap="round" />
        </g>
      )}

      {/* Neck and scarf */}
      <rect x="53" y="80" width="14" height="16" rx="5" fill={skinShade} {...line} />
      {c.accessory === 'scarf' && (
        <g>
          <path d="M41 88 Q60 100 79 88 L81 96 Q60 108 39 96 Z" fill={c.backpackColor} {...line} />
          <rect x="66" y="94" width="10" height="20" rx="3" fill={packDark} {...line} strokeWidth={1.8} />
        </g>
      )}

      {/* Head */}
      <circle cx="27.5" cy="61" r="6" fill={c.skin} {...line} />
      <circle cx="92.5" cy="61" r="6" fill={c.skin} {...line} />
      <circle cx="27.5" cy="61" r="2.6" fill={skinShade} />
      <circle cx="92.5" cy="61" r="2.6" fill={skinShade} />
      <circle cx="60" cy="56" r="32" fill={c.skin} {...line} />
      <g clipPath={`url(#head-${uid})`}>
        <path d="M72 22 C98 34 100 80 64 90 L100 90 L100 22 Z" fill="#000" opacity="0.09" />
      </g>
      <Face mood={mood} brow={hairDark} />
      <HairFront style={c.hairStyle} color={c.hairColor} dark={hairDark} />

      {/* Accessories */}
      {c.accessory === 'glasses' && (
        <g fill="none" stroke={OL} strokeWidth="2.4">
          <circle cx="48" cy="59" r="8.5" fill="#bae6fd" fillOpacity="0.18" />
          <circle cx="72" cy="59" r="8.5" fill="#bae6fd" fillOpacity="0.18" />
          <path d="M56.5 58 Q60 55.5 63.5 58 M39.5 57 L30 54 M80.5 57 L90 54" />
        </g>
      )}
      {c.accessory === 'headband' && <path d="M29 44 Q60 28 91 44" fill="none" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" />}
      {c.accessory === 'cap' && (
        <g>
          <path d="M29 44 C29 18 91 18 91 44 Z" fill={outfitDark} {...line} />
          <path d="M60 42 L100 46 Q102 52 95 52 L60 49 Z" fill={shade(c.outfitColor, -0.45)} {...line} />
          <circle cx="60" cy="22" r="3" fill={shade(c.outfitColor, 0.4)} {...line} strokeWidth={1.4} />
        </g>
      )}
      {c.accessory === 'explorer-hat' && (
        <g>
          <ellipse cx="60" cy="38" rx="45" ry="10" fill="#a16207" {...line} />
          <path d="M37 38 C37 13 83 13 83 38 Z" fill="#ca8a04" {...line} />
          <path d="M37 32 L83 32 L83 38 L37 38 Z" fill="#7c2d12" />
        </g>
      )}
      {c.accessory === 'headphones' && (
        <g>
          <path d="M26 58 C24 14 96 14 94 58" fill="none" stroke={OL} strokeWidth="8" />
          <path d="M26 58 C24 14 96 14 94 58" fill="none" stroke="#475569" strokeWidth="4.5" />
          <rect x="19" y="50" width="14" height="22" rx="6" fill="#f43f5e" {...line} />
          <rect x="87" y="50" width="14" height="22" rx="6" fill="#f43f5e" {...line} />
        </g>
      )}
      {c.accessory === 'flower' && (
        <g>
          <path d="M29 42 Q60 26 91 42" fill="none" stroke="#16a34a" strokeWidth="4" />
          {[
            [32, 40, '#f472b6'],
            [45, 32, '#facc15'],
            [60, 29, '#fb7185'],
            [75, 32, '#a78bfa'],
            [88, 40, '#facc15'],
          ].map(([x, y, col]) => (
            <g key={`${x}`}>
              <circle cx={Number(x)} cy={Number(y)} r="5.5" fill={String(col)} {...line} strokeWidth={1.6} />
              <circle cx={Number(x)} cy={Number(y)} r="2" fill="#fff7ed" />
            </g>
          ))}
        </g>
      )}
      {c.accessory === 'crown' && (
        <g>
          <path d="M38 30 L42 10 L51 23 L60 5 L69 23 L78 10 L82 30 Z" fill="#facc15" {...line} />
          <circle cx="60" cy="21" r="3.2" fill="#f43f5e" {...line} strokeWidth={1.2} />
          <circle cx="46" cy="25" r="2.2" fill="#0ea5e9" />
          <circle cx="74" cy="25" r="2.2" fill="#22c55e" />
        </g>
      )}
    </svg>
  )
}

/** Illustrated creatures for bosses and characters. */
export function CreatureFigure({ art, className, title, hurt = false }: { art: CreatureArt; className?: string; title?: string; hurt?: boolean }) {
  const painted = CREATURE_ART[art]
  if (painted) {
    return (
      <img
        src={painted}
        alt={title ?? ''}
        aria-hidden={title ? undefined : true}
        draggable={false}
        className={`${className ?? ''} object-contain`}
        style={hurt ? { filter: 'grayscale(0.5) brightness(0.85)' } : undefined}
      />
    )
  }
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
