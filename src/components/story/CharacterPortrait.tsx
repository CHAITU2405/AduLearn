import { AvatarFigure, CreatureFigure } from '@/components/avatar/AvatarFigure'
import { cn } from '@/components/ui'
import { getCharacter } from '@/content/characters'
import type { AvatarConfig } from '@/core/avatar'

export function CharacterPortrait({
  speaker,
  playerAvatar,
  playerName,
  className,
  hurt,
}: {
  speaker: string
  playerAvatar?: AvatarConfig
  playerName?: string
  className?: string
  hurt?: boolean
}) {
  const ring = 'rounded-full bg-gradient-to-b from-brand-soft to-white border-2 border-white shadow-soft overflow-hidden'
  if (speaker === 'player' && playerAvatar) {
    return (
      <div className={cn(ring, className)}>
        <AvatarFigure config={playerAvatar} variant="portrait" title={playerName ?? 'You'} className="size-full" />
      </div>
    )
  }
  const ch = getCharacter(speaker)
  return (
    <div className={cn(ring, className)}>
      {ch.creature ? (
        <CreatureFigure art={ch.creature} title={ch.name} hurt={hurt} className="size-full p-1" />
      ) : ch.look ? (
        <AvatarFigure config={ch.look} variant="portrait" title={ch.name} className="size-full" />
      ) : null}
    </div>
  )
}

export function speakerName(speaker: string, playerName?: string): string {
  return speaker === 'player' ? (playerName ?? 'You') : getCharacter(speaker).name
}
