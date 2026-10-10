import { motion } from 'framer-motion'
import { AvatarFigure, CreatureFigure, type Mood } from '@/components/avatar/AvatarFigure'
import { Pip } from '@/components/game/Pip'
import { cn } from '@/components/ui'
import { getCharacter } from '@/content/characters'
import type { AvatarConfig } from '@/core/avatar'
import { CHARACTER_ART, CHARACTER_FACING } from '@/game/art'

/** Painted sprite for a speaker ('player' uses the explorer's chosen hero), if one exists. */
export function paintedArt(speaker: string, avatar?: AvatarConfig): string | undefined {
  return CHARACTER_ART[artKey(speaker, avatar)]
}

function artKey(speaker: string, avatar?: AvatarConfig): string {
  return speaker === 'player' ? (avatar?.hero ? `hero-${avatar.hero}` : '') : speaker
}

/** Painted sprites have one pose, so moods are acted out with motion instead of a new face. */
const MOOD_MOTION: Record<Mood, { animate: Record<string, number[] | number>; transition: Record<string, unknown> }> = {
  happy: { animate: { y: 0, rotate: 0, scale: 1 }, transition: { duration: 0.3 } },
  excited: { animate: { y: [0, -22, 0, -10, 0], scale: [1, 1.04, 1] }, transition: { duration: 0.7 } },
  sad: { animate: { y: 8, rotate: -3, scale: 0.98 }, transition: { duration: 0.4 } },
  thinking: { animate: { rotate: [0, 2.5, 0], y: 0 }, transition: { duration: 2.4, repeat: Infinity } },
  surprised: { animate: { scale: [1, 1.08, 1], y: [0, -8, 0] }, transition: { duration: 0.35 } },
}

/**
 * A story character, the explorer, or a creature, drawn at full height for
 * stages and dialogue. Uses painted art when available, vector art otherwise.
 */
export function CharacterSprite({
  speaker,
  avatar,
  mood = 'happy',
  className,
  title,
  face,
  hurt,
}: {
  speaker: string
  avatar?: AvatarConfig
  mood?: Mood
  className?: string
  title?: string
  /** Which way the character should look; painted art is mirrored when needed (vector art faces the front). */
  face?: 'left' | 'right'
  hurt?: boolean
}) {
  const art = paintedArt(speaker, avatar)
  if (art) {
    const facing = CHARACTER_FACING[artKey(speaker, avatar)]
    const flip = !!face && !!facing && face !== facing
    const m = MOOD_MOTION[mood]
    return (
      <motion.div className={cn('flex items-end justify-center', className)} animate={m.animate} transition={m.transition}>
        <img
          src={art}
          alt={title ?? ''}
          aria-hidden={title ? undefined : true}
          draggable={false}
          className={cn('max-h-full max-w-full object-contain object-bottom sprite-shadow select-none', mood === 'sad' && 'saturate-[0.8]')}
          style={flip ? { transform: 'scaleX(-1)' } : undefined}
        />
      </motion.div>
    )
  }
  if (speaker === 'player')
    return avatar ? (
      <div className={className}>
        <AvatarFigure config={avatar} mood={mood} title={title} className="size-full sprite-shadow" />
      </div>
    ) : null
  if (speaker === 'pip')
    return <Pip mood={mood === 'sad' ? 'sad' : mood === 'excited' ? 'cheer' : mood === 'thinking' ? 'thinking' : 'happy'} title={title} className={className} />
  const ch = getCharacter(speaker)
  if (ch.creature) return <CreatureFigure art={ch.creature} title={title} hurt={hurt} className={cn(className, 'sprite-outline-lg')} />
  if (ch.look) return <AvatarFigure config={ch.look} mood={mood} title={title} className={cn(className, 'sprite-shadow')} />
  return null
}

/** Head-and-shoulders picture that fills its container (no frame). */
export function PortraitFill({ speaker, avatar, title, hurt }: { speaker: string; avatar?: AvatarConfig; title?: string; hurt?: boolean }) {
  const art = paintedArt(speaker, avatar)
  if (art)
    return (
      <span className="block size-full overflow-hidden" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
        <img src={art} alt="" draggable={false} className="size-full origin-top scale-[1.65] object-cover object-[50%_0%] select-none" />
      </span>
    )
  if (speaker === 'pip') return <Pip mood="happy" title={title} className="size-full p-1" />
  const ch = speaker === 'player' ? null : getCharacter(speaker)
  const look = speaker === 'player' ? avatar : ch?.look
  if (ch?.creature) return <CreatureFigure art={ch.creature} title={title} hurt={hurt} className="size-full p-1" />
  return look ? <AvatarFigure config={look} variant="portrait" title={title} className="size-full" /> : null
}

/** Round head-and-shoulders portrait for chat bubbles, lists and dialogue boxes. */
export function CharacterHead({ className, ...props }: { speaker: string; avatar?: AvatarConfig; className?: string; title?: string; hurt?: boolean }) {
  return (
    <div className={cn('overflow-hidden rounded-full border-[3px] border-white bg-gradient-to-b from-[#fde68a] to-[#fff7ed] shadow-soft', className)}>
      <PortraitFill {...props} />
    </div>
  )
}
