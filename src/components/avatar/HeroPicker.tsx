import { Check } from 'lucide-react'
import { CharacterSprite, paintedArt } from '@/components/story/CharacterSprite'
import { cn } from '@/components/ui'
import { HEROES } from '@/content/characters'
import type { AvatarConfig } from '@/core/avatar'
import { play } from '@/lib/sfx'

/** Pick the painted hero the explorer plays as. Choosing one also dresses the map figure to match. */
export function HeroPicker({ value, onChange }: { value: AvatarConfig; onChange: (v: AvatarConfig) => void }) {
  const heroes = HEROES.filter((h) => paintedArt('player', h.look))
  if (heroes.length === 0) return null
  return (
    <div role="radiogroup" aria-label="Hero" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {heroes.map((h) => {
        const selected = value.hero === h.id
        return (
          <button
            key={h.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              play('tap')
              // Keep wardrobe items the explorer already wears.
              onChange({
                ...h.look,
                accessory: value.accessory,
                ...(value.outfit === 'cape' ? { outfit: 'cape' as const } : {}),
                ...(value.backpack === 'jetpack' ? { backpack: 'jetpack' as const } : {}),
              })
            }}
            className={cn(
              'group relative flex flex-col items-center overflow-hidden rounded-3xl border-4 bg-gradient-to-b from-[#bae6fd] via-[#e0f2fe] to-[#fff7ed] pt-2 text-center transition-transform',
              selected ? 'border-orange -translate-y-1 shadow-[0_8px_0_#ea580c]' : 'border-white shadow-soft hover:-translate-y-0.5',
            )}
          >
            <CharacterSprite speaker="player" avatar={h.look} mood={selected ? 'excited' : 'happy'} className="h-40 w-full sm:h-48" />
            <span className="w-full bg-white/90 px-2 py-2">
              <span className="block font-display text-xl font-bold">{h.name}</span>
              <span className="block text-xs leading-snug text-ink-soft">{h.blurb}</span>
            </span>
            {selected && (
              <span className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-orange text-white" aria-hidden>
                <Check className="size-5" strokeWidth={3} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
