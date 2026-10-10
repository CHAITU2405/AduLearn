import { getCharacter } from '@/content/characters'
import type { AvatarConfig } from '@/core/avatar'
import { CharacterHead } from './CharacterSprite'

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
  return <CharacterHead speaker={speaker} avatar={playerAvatar} title={speakerName(speaker, playerName)} className={className} hurt={hurt} />
}

export function speakerName(speaker: string, playerName?: string): string {
  return speaker === 'player' ? (playerName ?? 'You') : getCharacter(speaker).name
}
