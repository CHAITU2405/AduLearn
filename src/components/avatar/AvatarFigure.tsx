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

/*
 * Drawn in the same soft, 3D-shaded style as the painted characters: real
 * proportions, gradient shading instead of thick outlines, detailed eyes and
 * layered hair. Every part is driven by the avatar config, so it stays fully
 * customisable. Coordinates: the figure stands in a 120×180 box, feet at y≈172.
 */

/** Thin edge in a darker tone of the fill, so the figure reads on painted backgrounds. */
const edge = (fill: string, w = 0.9) => ({ stroke: shade(fill, -0.5), strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const })

function Eye({ cx, mood, uid, flip }: { cx: number; mood: Mood; uid: string; flip?: boolean }) {
  const y = 37.5
  const dir = flip ? -1 : 1
  if (mood === 'excited')
    return (
      <g>
        <path d={`M${cx - 4.6} ${y + 1} Q${cx} ${y - 4.2} ${cx + 4.6} ${y + 1}`} fill="none" stroke="#1c120b" strokeWidth="1.6" strokeLinecap="round" />
        <path d={`M${cx + dir * 4.4} ${y} l${dir * 1.6} -1.4`} stroke="#1c120b" strokeWidth="1" strokeLinecap="round" />
      </g>
    )
  const ry = mood === 'surprised' ? 4.9 : 4.2
  const lookX = mood === 'thinking' ? 1.1 : 0
  const lookY = mood === 'thinking' ? -1 : mood === 'sad' ? 0.9 : 0.2
  return (
    <g>
      <ellipse cx={cx} cy={y} rx="5.2" ry={ry} fill="#fff" />
      <g clipPath={`url(#eye-${uid}-${cx})`}>
        <circle cx={cx + lookX} cy={y + lookY} r="3.8" fill={`url(#iris-${uid})`} />
        <circle cx={cx + lookX} cy={y + lookY} r="1.8" fill="#120a05" />
        <path d={`M${cx - 5} ${y - ry} H${cx + 5} V${y - ry + 1.6} Q${cx} ${y - ry + 2.8} ${cx - 5} ${y - ry + 1.6} Z`} fill="#000" opacity="0.12" />
      </g>
      <circle cx={cx + lookX + 1.3} cy={y + lookY - 1.4} r="1.3" fill="#fff" />
      <circle cx={cx + lookX - 1} cy={y + lookY + 1.3} r="0.55" fill="#fff" opacity="0.85" />
      {/* Upper lash line with a small flick at the outer corner */}
      <path
        d={`M${cx - dir * 5.4} ${y + 0.4} Q${cx - dir * 2.2} ${y - ry - 0.6} ${cx + dir * 3.3} ${y - ry + 0.2} Q${cx + dir * 4.8} ${y - ry + 1.2} ${cx + dir * 5.6} ${y - ry + 0.6}`}
        fill="none"
        stroke="#1c120b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d={`M${cx - 3.6} ${y + ry - 0.2} Q${cx} ${y + ry + 0.9} ${cx + 3.6} ${y + ry - 0.2}`} fill="none" stroke="#1c120b" strokeWidth="0.45" opacity="0.5" />
    </g>
  )
}

function Face({ mood, c, uid }: { mood: Mood; c: AvatarConfig; uid: string }) {
  const brow = shade(c.hairColor, -0.25)
  const lip = shade(c.skin, -0.38)
  const brows = {
    happy: 'M47.5 31.2 Q51.5 29.2 56 30.6 M64 30.6 Q68.5 29.2 72.5 31.2',
    excited: 'M47.5 30 Q51.5 27.6 56 29.2 M64 29.2 Q68.5 27.6 72.5 30',
    sad: 'M47.5 31 Q52 30.6 56 28.8 M64 28.8 Q68 30.6 72.5 31',
    thinking: 'M47.5 31.4 Q51.5 30.2 56 31 M64 29.4 Q68.5 27.4 72.5 29.6',
    surprised: 'M47.5 28.6 Q51.5 26.2 56 27.8 M64 27.8 Q68.5 26.2 72.5 28.6',
  }[mood]
  return (
    <g>
      <path d={brows} fill="none" stroke={brow} strokeWidth="1.7" strokeLinecap="round" />
      <g className="avatar-blink">
        <Eye cx={51} mood={mood} uid={uid} flip />
        <Eye cx={69} mood={mood} uid={uid} />
      </g>
      {/* Soft nose */}
      <path d="M60.6 39.5 Q62 44 59.6 45.2" fill="none" stroke={shade(c.skin, -0.3)} strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
      <ellipse cx="59.6" cy="45.2" rx="1.8" ry="0.7" fill={shade(c.skin, -0.25)} opacity="0.35" />
      {/* Cheeks */}
      <ellipse cx="47.5" cy="44.5" rx="3.6" ry="2.2" fill="#fb7185" opacity="0.22" />
      <ellipse cx="72.5" cy="44.5" rx="3.6" ry="2.2" fill="#fb7185" opacity="0.22" />
      {/* Mouth */}
      {mood === 'happy' && (
        <g>
          <path d="M55 48.8 Q60 50 65 48.8 Q63.8 53.6 60 53.6 Q56.2 53.6 55 48.8 Z" fill="#8b2c2c" stroke={lip} strokeWidth="0.6" strokeLinejoin="round" />
          <path d="M55.6 49.1 Q60 50.2 64.4 49.1 L64 50.5 Q60 51.3 56 50.5 Z" fill="#fff" />
          <path d="M57.6 52.6 Q60 53.3 62.4 52.6" fill="none" stroke="#fb7185" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
        </g>
      )}
      {mood === 'excited' && (
        <g>
          <path d="M53.6 48.4 Q60 49.6 66.4 48.4 Q65 56 60 56 Q55 56 53.6 48.4 Z" fill="#7f1d1d" stroke={lip} strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M54.4 48.8 Q60 50 65.6 48.8 L65.2 50.4 Q60 51.4 54.8 50.4 Z" fill="#fff" />
          <ellipse cx="60" cy="54.2" rx="3.2" ry="1.5" fill="#fb7185" />
        </g>
      )}
      {mood === 'sad' && <path d="M55.6 51.8 Q60 48.8 64.4 51.8" fill="none" stroke={lip} strokeWidth="1.3" strokeLinecap="round" />}
      {mood === 'thinking' && <path d="M56 51 Q60.5 51.6 64.4 49.4" fill="none" stroke={lip} strokeWidth="1.3" strokeLinecap="round" />}
      {mood === 'surprised' && <ellipse cx="60" cy="51.2" rx="2.4" ry="3" fill="#7f1d1d" stroke={lip} strokeWidth="0.8" />}
    </g>
  )
}

/** Hair drawn behind the head and body (length, volume, bun, braid). */
function HairBack({ c, g }: { c: AvatarConfig; g: string }) {
  const e = edge(c.hairColor, 0.8)
  switch (c.hairStyle) {
    case 'long':
      return <path d="M40.5 30 C34 46 33.5 74 37 98 Q48 104 60 103 Q72 104 83 98 C86.5 74 86 46 79.5 30 Z" fill={g} {...e} />
    case 'braid':
      return <path d="M40.5 30 C36 42 36 54 39 64 L81 64 C84 54 84 42 79.5 30 Z" fill={g} {...e} />
    case 'curly':
      return (
        <g fill={g} {...e}>
          {[
            [39, 42, 8],
            [81, 42, 8],
            [38, 54, 7],
            [82, 54, 7],
            [41, 63, 6],
            [79, 63, 6],
          ].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </g>
      )
    case 'bun':
      return <path d="M41 30 C38 40 39 48 42 52 L78 52 C81 48 82 40 79 30 Z" fill={g} {...e} />
    default:
      return null
  }
}

/** Hair drawn over the head: the cap, fringe and highlights. */
function HairFront({ c, g }: { c: AvatarConfig; g: string }) {
  const e = edge(c.hairColor, 0.8)
  const dark = shade(c.hairColor, -0.45)
  const light = shade(c.hairColor, 0.45)
  const strands = (d: string) => <path d={d} fill="none" stroke={dark} strokeWidth="0.8" strokeLinecap="round" opacity="0.55" />
  const shine = (d: string) => <path d={d} fill="none" stroke={light} strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
  switch (c.hairStyle) {
    case 'spiky':
      return (
        <g>
          <path
            d="M39.6 35 L36.5 22 L43.5 23.5 L42 11 L50 16.5 L54 4 L60.5 13 L67.5 3.5 L70 14.5 L78.5 9.5 L77 21.5 L84 21 L80.4 35 C78.5 27 74 23.6 67.5 23.4 C62 26.6 53 26.6 47.6 23.6 C43.4 26 40.8 30 39.6 35 Z"
            fill={g}
            {...e}
          />
          {strands('M47 22 L45 14 M56 22 L56 9 M65 22 L68 9 M73 23 L77 15')}
          {shine('M50 18 L52.5 10 M61 17 L62.5 9')}
        </g>
      )
    case 'curly':
      return (
        <g>
          <path d="M39.4 36 C37.5 18 47 8 60 8 C73 8 82.5 18 80.6 36 C78 28 72 24 60 24 C48 24 42 28 39.4 36 Z" fill={g} {...e} />
          {[
            [43, 25, 5.2],
            [48, 17, 5.6],
            [55, 12, 5.6],
            [63, 11.5, 5.6],
            [71, 14.5, 5.6],
            [77, 21.5, 5.2],
            [79.5, 30, 4.4],
            [40.5, 31, 4.4],
            [52, 22.5, 4.6],
            [60.5, 21.5, 4.6],
            [68.5, 22.5, 4.6],
          ].map(([x, y, r]) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r={r} fill={g} {...e} />
              <path d={`M${x - r * 0.45} ${y - r * 0.35} a${r * 0.55} ${r * 0.55} 0 0 1 ${r * 0.8} 0`} fill="none" stroke={light} strokeWidth="1" opacity="0.6" />
            </g>
          ))}
        </g>
      )
    case 'short':
      return (
        <g>
          <path
            d="M39.5 35.5 C37 17 47.5 7.5 61 7.5 C74.5 7.5 84 16.5 80.5 35.5 C79 28.5 75.5 23.5 70 21.6 C65.5 25.6 55 26.4 47.6 22.6 C43.6 25.6 40.8 30 39.5 35.5 Z"
            fill={g}
            {...e}
          />
          {strands('M47.6 22.6 C52 18 58 15 63 12 M57 24.6 C62 21 66 17 69 13 M70 21.6 C73 18 75 16 77 17')}
          {shine('M48 15 C53 11 58 10 63 10.4')}
        </g>
      )
    default: {
      // long, braid and bun: middle parting, swept to the sides
      return (
        <g>
          <path d="M39.6 38 C36.6 16.5 47.5 7 60 7 C72.5 7 83.4 16.5 80.4 38 C79 29 74 22 60.6 19.6 C47 21.6 41.6 29 39.6 38 Z" fill={g} {...e} />
          <path d="M60.6 8 L60.6 19.6" stroke={dark} strokeWidth="0.9" opacity="0.6" />
          {strands('M58 10 C50 13 44 20 41.6 30 M63 10 C70 13 76 20 78.4 30')}
          {shine('M52 11.5 C47.5 14 45 18 43.6 22 M68 11.5 C72.5 14 75 18 76.4 22')}
          {c.hairStyle === 'long' && (
            <g fill={g} {...e}>
              <path d="M40.4 32 C37.4 48 37.6 66 41 84 C44.6 74 45.4 56 44.4 40 Z" />
              <path d="M79.6 32 C82.6 48 82.4 66 79 84 C75.4 74 74.6 56 75.6 40 Z" />
            </g>
          )}
          {c.hairStyle === 'bun' && (
            <g>
              <circle cx="60" cy="6.5" r="7.2" fill={g} {...e} />
              <path d="M55.5 5 Q60 1.5 64.5 5" fill="none" stroke={light} strokeWidth="1.2" opacity="0.6" />
              <path d="M54.6 11.6 Q60 13.6 65.4 11.6" fill="none" stroke="#f43f5e" strokeWidth="2.4" strokeLinecap="round" />
            </g>
          )}
          {c.hairStyle === 'braid' && (
            <g>
              {[0, 1, 2, 3, 4].map((i) => (
                <ellipse key={i} cx={76 + (i % 2 ? 1.6 : 0) + i * 0.8} cy={48 + i * 8.4} rx="4.6" ry="5" fill={g} {...e} />
              ))}
              <path d="M77.4 89.5 L83.4 89.5 L80.4 95 Z" fill="#f43f5e" />
            </g>
          )}
        </g>
      )
    }
  }
}

/** SVG avatar used for the player's map explorer and as a fallback for story characters. */
export function AvatarFigure({ config: c, variant = 'full', className, title, mood = 'happy', walking = false }: Props) {
  const uid = useId().replace(/:/g, '')
  const full = variant === 'full'
  const viewBox = full ? '0 0 120 180' : '30 0 60 60'
  const u = (n: string) => `url(#${n}-${uid})`
  const cloth = c.outfitColor
  const clothDark = shade(cloth, -0.32)
  const pack = c.backpackColor
  const packDark = shade(pack, -0.35)
  const pants = c.outfit === 'kurta' ? '#e7e5e4' : '#2f3e64'
  const longSleeves = c.outfit !== 'tee' && c.outfit !== 'cape'
  const torso =
    c.outfit === 'kurta'
      ? 'M46 63 C52 61 68 61 74 63 C80 64.6 82.4 69 82.4 76 L84 126 C74 130 46 130 36 126 L37.6 76 C37.6 69 40 64.6 46 63 Z'
      : 'M46 63 C52 61 68 61 74 63 C80 64.6 82.4 69 82.4 76 L79.6 111 C72.6 115 47.4 115 40.4 111 L37.6 76 C37.6 69 40 64.6 46 63 Z'
  const arm = (side: 'l' | 'r') => {
    // Drawn for the left arm and mirrored for the right.
    const m = side === 'r' ? 'scale(-1 1) translate(-120 0) translate(-2 0)' : 'translate(-2 0)'
    const sleeve = longSleeves
      ? 'M42 63.4 C36 63.6 33 68 32.4 75 L30.4 100.6 Q30.4 104.4 34.6 104.4 Q38.6 104.4 38.8 100.6 L41.6 80 Z'
      : 'M42 63.4 C36 63.6 33 68 32.4 75 L31.8 82 Q36.4 84.6 41 82 L41.6 76 Z'
    return (
      <g className={`avatar-arm-${side}`}>
        <g transform={m}>
          {!longSleeves && <path d="M33 78 L31 100.6 Q31 104.4 34.8 104.4 Q38.4 104.4 38.6 100.6 L40.6 80 Z" fill={u('skin')} {...edge(c.skin)} />}
          <path d={sleeve} fill={u('cloth')} {...edge(cloth)} />
          {longSleeves && <path d="M30.6 98.6 Q34.6 100.6 38.9 98.6" fill="none" stroke={clothDark} strokeWidth="1.6" opacity="0.7" />}
          <ellipse cx="34.6" cy="108.4" rx="4.2" ry="4.9" fill={u('skin')} {...edge(c.skin)} />
          <path d="M37.4 106 Q39.4 108.6 37.6 111" fill="none" stroke={shade(c.skin, -0.3)} strokeWidth="0.7" opacity="0.7" />
        </g>
      </g>
    )
  }
  return (
    <svg
      viewBox={viewBox}
      className={`${className ?? ''} ${walking ? 'is-walking' : ''}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      overflow={full ? 'visible' : 'hidden'}
    >
      <defs>
        <radialGradient id={`skin-${uid}`} cx="40%" cy="38%" r="75%">
          <stop offset="0" stopColor={shade(c.skin, 0.22)} />
          <stop offset="0.6" stopColor={c.skin} />
          <stop offset="1" stopColor={shade(c.skin, -0.12)} />
        </radialGradient>
        <linearGradient id={`hair-${uid}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={shade(c.hairColor, 0.25)} />
          <stop offset="0.5" stopColor={c.hairColor} />
          <stop offset="1" stopColor={shade(c.hairColor, -0.3)} />
        </linearGradient>
        <linearGradient id={`cloth-${uid}`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor={shade(cloth, 0.22)} />
          <stop offset="0.5" stopColor={cloth} />
          <stop offset="1" stopColor={shade(cloth, -0.28)} />
        </linearGradient>
        <linearGradient id={`pack-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(pack, 0.2)} />
          <stop offset="1" stopColor={shade(pack, -0.25)} />
        </linearGradient>
        <linearGradient id={`pants-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={shade(pants, 0.18)} />
          <stop offset="1" stopColor={shade(pants, -0.22)} />
        </linearGradient>
        <radialGradient id={`iris-${uid}`} cx="45%" cy="35%" r="70%">
          <stop offset="0" stopColor="#a0663a" />
          <stop offset="0.6" stopColor="#5b3219" />
          <stop offset="1" stopColor="#2a160b" />
        </radialGradient>
        <clipPath id={`face-${uid}`}>
          <path d="M41.4 29 C41.4 15.5 50 11 60 11 C70 11 78.6 15.5 78.6 29 L78.6 38 C78.6 50.5 70 58.5 60 58.5 C50 58.5 41.4 50.5 41.4 38 Z" />
        </clipPath>
        <clipPath id={`torso-${uid}`}>
          <path d={torso} />
        </clipPath>
        {[51, 69].map((cx) => (
          <clipPath key={cx} id={`eye-${uid}-${cx}`}>
            <ellipse cx={cx} cy="37.5" rx="5.2" ry={mood === 'surprised' ? 4.9 : 4.2} />
          </clipPath>
        ))}
      </defs>

      {full && <ellipse cx="60" cy="172" rx="25" ry="4.5" fill="#000" opacity="0.18" />}

      {/* Behind the body */}
      {c.outfit === 'cape' && <path className="avatar-cape" d="M42 64 L78 64 L94 150 Q60 158 26 150 Z" fill={shade(cloth, -0.12)} {...edge(cloth)} />}
      {(c.backpack === 'classic' || c.backpack === 'explorer') && (
        <g>
          <rect x="31" y="66" width="58" height="44" rx="12" fill={u('pack')} {...edge(pack)} />
          {c.backpack === 'explorer' && (
            <>
              <rect x="36" y="57" width="48" height="11" rx="5.5" fill={packDark} {...edge(packDark)} />
              <path d="M44 57 V68 M76 57 V68" stroke={shade(packDark, -0.3)} strokeWidth="1.4" />
              <rect x="25" y="80" width="8" height="22" rx="4" fill={packDark} {...edge(packDark)} />
              <rect x="87" y="80" width="8" height="22" rx="4" fill={packDark} {...edge(packDark)} />
            </>
          )}
        </g>
      )}
      {c.backpack === 'jetpack' && (
        <g>
          {[30, 76].map((x) => (
            <g key={x}>
              <rect x={x} y="62" width="14" height="40" rx="7" fill="#cbd5e1" {...edge('#cbd5e1')} />
              <rect x={x + 3} y="66" width="3" height="30" rx="1.5" fill="#fff" opacity="0.7" />
            </g>
          ))}
          <g className="avatar-flame">
            <path d="M32 102 L37 120 L42 102 Z M78 102 L83 120 L88 102 Z" fill="#f97316" />
            <path d="M34.5 102 L37 111 L39.5 102 Z M80.5 102 L83 111 L85.5 102 Z" fill="#fde047" />
          </g>
        </g>
      )}
      <HairBack c={c} g={u('hair')} />
      {c.outfit === 'hoodie' && <path d="M44 66 C42 54 78 54 76 66 Q60 60 44 66 Z" fill={clothDark} {...edge(clothDark)} />}

      {/* Legs and shoes */}
      {full && (
        <g>
          {(['l', 'r'] as const).map((side) => {
            const x = side === 'l' ? 46.5 : 61.5
            return (
              <g key={side} className={`avatar-leg-${side}`}>
                <rect x={x} y="108" width="12" height="54" rx="5" fill={u('pants')} {...edge(pants)} />
                <path
                  d={`M${x - 3.5} 168 Q${x - 3.5} 159 ${x + 3} 158.5 L${x + 10} 158.5 Q${x + 14.5} 159 ${x + 14.5} 165 L${x + 14.5} 168 Z`}
                  fill="#334155"
                  {...edge('#334155')}
                />
                <path d={`M${x - 3.5} 168.4 L${x + 14.5} 168.4`} stroke="#f8fafc" strokeWidth="2.4" strokeLinecap="round" />
                <path d={`M${x + 1} 161.5 L${x + 9} 161.5`} stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
              </g>
            )
          })}
        </g>
      )}

      {/* Torso, shaded like cloth */}
      <path d={torso} fill={u('cloth')} {...edge(cloth)} />
      <g clipPath={`url(#torso-${uid})`}>
        <path d="M68 60 C80 66 86 90 84 130 L96 130 L96 60 Z" fill="#000" opacity="0.12" />
        <path d="M50 90 Q54 100 52 112 M70 88 Q67 100 69 112" fill="none" stroke={clothDark} strokeWidth="0.8" opacity="0.45" />
        {c.outfit === 'tee' && (
          <g>
            <path d="M52 62.6 Q60 70 68 62.6" fill="none" stroke={clothDark} strokeWidth="2" strokeLinecap="round" />
            <circle cx="60" cy="84" r="6.4" fill="#fff" opacity="0.9" />
            <path d="M60 79.6 L61.4 82.8 L64.8 83.1 L62.3 85.4 L63 88.8 L60 87.1 L57 88.8 L57.7 85.4 L55.2 83.1 L58.6 82.8 Z" fill={clothDark} />
          </g>
        )}
        {c.outfit === 'hoodie' && (
          <g>
            <path d="M46 94 Q60 89 74 94 L72.5 108 Q60 105.5 47.5 108 Z" fill={clothDark} opacity="0.75" />
            <path d="M55.5 64 L54.6 78 M64.5 64 L65.4 78" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="54.6" cy="79" r="1.3" fill="#f8fafc" />
            <circle cx="65.4" cy="79" r="1.3" fill="#f8fafc" />
          </g>
        )}
        {c.outfit === 'kurta' && (
          <g>
            <rect x="54" y="60" width="12" height="4.6" rx="2" fill={clothDark} />
            <path d="M60 64 L60 92" stroke={clothDark} strokeWidth="1.6" />
            {[70, 77, 84].map((y) => (
              <circle key={y} cx="60" cy={y} r="1.3" fill="#fde68a" />
            ))}
            <path d="M34 121 L86 121" stroke={shade(cloth, 0.4)} strokeWidth="3.2" />
            <path d="M34 124.6 L86 124.6" stroke="#fde68a" strokeWidth="1" opacity="0.8" />
          </g>
        )}
        {c.outfit === 'jacket' && (
          <g>
            <path d="M52 62 L60 112 L68 62 Z" fill="#f8fafc" />
            <path d="M52 62 L57 88 L46 74 Z M68 62 L63 88 L74 74 Z" fill={clothDark} opacity="0.85" />
            <path d="M56.6 66 L60 112 M63.4 66 L60 112" stroke={shade(cloth, -0.5)} strokeWidth="0.8" opacity="0.6" />
            <rect x="40" y="95" width="11" height="8" rx="2" fill={clothDark} opacity="0.8" />
            <rect x="69" y="95" width="11" height="8" rx="2" fill={clothDark} opacity="0.8" />
          </g>
        )}
        {c.outfit === 'cape' && (
          <g>
            <path d="M52 62.6 Q60 70 68 62.6" fill="none" stroke={clothDark} strokeWidth="2" strokeLinecap="round" />
            <path d="M44 63 Q60 74 76 63" fill="none" stroke="#facc15" strokeWidth="2.4" />
            <circle cx="60" cy="69" r="2.6" fill="#facc15" {...edge('#facc15', 0.6)} />
          </g>
        )}
      </g>
      {(c.backpack === 'classic' || c.backpack === 'explorer') && (
        <g stroke={packDark} strokeWidth="4.2" strokeLinecap="round">
          <path d="M47 63.5 L44.5 104" />
          <path d="M73 63.5 L75.5 104" />
        </g>
      )}

      {/* Arms, in front of the body so they read clearly (and can swing) */}
      {arm('l')}
      {arm('r')}

      {/* Neck */}
      <path d="M54.5 50 L65.5 50 L66 64 Q60 67 54 64 Z" fill={shade(c.skin, -0.12)} {...edge(c.skin, 0.7)} />
      <path d="M54.5 56 Q60 60 65.5 56 L65.5 52 L54.5 52 Z" fill="#000" opacity="0.12" />
      {c.accessory === 'scarf' && (
        <g>
          <path d="M47 61 Q60 70 73 61 L74 67 Q60 76 46 67 Z" fill={pack} {...edge(pack)} />
          <rect x="63" y="66" width="7" height="18" rx="2.6" fill={packDark} {...edge(packDark)} />
        </g>
      )}

      {/* Head */}
      <ellipse cx="41.4" cy="38" rx="3.2" ry="5" fill={u('skin')} {...edge(c.skin, 0.7)} />
      <ellipse cx="78.6" cy="38" rx="3.2" ry="5" fill={u('skin')} {...edge(c.skin, 0.7)} />
      <path d="M41.4 29 C41.4 15.5 50 11 60 11 C70 11 78.6 15.5 78.6 29 L78.6 38 C78.6 50.5 70 58.5 60 58.5 C50 58.5 41.4 50.5 41.4 38 Z" fill={u('skin')} {...edge(c.skin, 0.8)} />
      <g clipPath={`url(#face-${uid})`}>
        <path d="M72 10 C84 22 84 46 70 56 L82 60 L82 10 Z" fill="#000" opacity="0.05" />
        <ellipse cx="60" cy="24" rx="20" ry="5" fill="#000" opacity="0.06" />
      </g>
      <Face mood={mood} c={c} uid={uid} />
      <HairFront c={c} g={u('hair')} />

      {/* Accessories */}
      {c.accessory === 'glasses' && (
        <g fill="none" stroke="#3b2a1e" strokeWidth="1.2">
          <circle cx="51.5" cy="37.5" r="6" fill="#bae6fd" fillOpacity="0.15" />
          <circle cx="68.5" cy="37.5" r="6" fill="#bae6fd" fillOpacity="0.15" />
          <path d="M57.5 37 Q60 35.6 62.5 37 M45.5 36.5 L41.5 35.5 M74.5 36.5 L78.5 35.5" />
        </g>
      )}
      {c.accessory === 'headband' && <path d="M40.6 27 Q60 12 79.4 27" fill="none" stroke="#f43f5e" strokeWidth="3.6" strokeLinecap="round" />}
      {c.accessory === 'cap' && (
        <g>
          <path d="M39.6 28 C39.6 9 80.4 9 80.4 28 Z" fill={u('cloth')} {...edge(cloth)} />
          <path d="M60 25.6 L88 28 Q90 32.4 85 32.6 L60 30.4 Z" fill={clothDark} {...edge(clothDark)} />
          <circle cx="60" cy="11.4" r="2" fill={shade(cloth, 0.4)} />
        </g>
      )}
      {c.accessory === 'explorer-hat' && (
        <g>
          <ellipse cx="60" cy="24" rx="32" ry="7" fill="#a16207" {...edge('#a16207')} />
          <path d="M44 24 C44 5 76 5 76 24 Z" fill="#ca8a04" {...edge('#ca8a04')} />
          <path d="M44 19 L76 19 L76 24 L44 24 Z" fill="#7c2d12" />
        </g>
      )}
      {c.accessory === 'headphones' && (
        <g>
          <path d="M40 38 C38 4 82 4 80 38" fill="none" stroke="#334155" strokeWidth="3.6" />
          <rect x="35.6" y="31" width="9" height="15" rx="4" fill="#f43f5e" {...edge('#f43f5e')} />
          <rect x="75.4" y="31" width="9" height="15" rx="4" fill="#f43f5e" {...edge('#f43f5e')} />
        </g>
      )}
      {c.accessory === 'flower' && (
        <g>
          <path d="M40.6 26 Q60 12 79.4 26" fill="none" stroke="#16a34a" strokeWidth="2.6" />
          {(
            [
              [42.5, 24.5, '#f472b6'],
              [50.5, 18, '#facc15'],
              [60, 16, '#fb7185'],
              [69.5, 18, '#a78bfa'],
              [77.5, 24.5, '#facc15'],
            ] as const
          ).map(([x, y, col]) => (
            <g key={x}>
              <circle cx={x} cy={y} r="3.8" fill={col} {...edge(col, 0.6)} />
              <circle cx={x} cy={y} r="1.4" fill="#fff7ed" />
            </g>
          ))}
        </g>
      )}
      {c.accessory === 'crown' && (
        <g>
          <path d="M46 16 L48.5 2 L54.5 10.5 L60 -1 L65.5 10.5 L71.5 2 L74 16 Z" fill="#facc15" {...edge('#facc15')} />
          <circle cx="60" cy="9.6" r="2" fill="#f43f5e" />
          <circle cx="51.5" cy="12" r="1.4" fill="#0ea5e9" />
          <circle cx="68.5" cy="12" r="1.4" fill="#22c55e" />
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
