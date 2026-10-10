import type { AvatarConfig } from '@/core/avatar'

export type CreatureArt = 'gorm' | 'golem' | 'owl' | 'cloud'

export interface CharacterDef {
  id: string
  name: string
  role: string
  look?: AvatarConfig
  creature?: CreatureArt
}

export const CHARACTERS: Record<string, CharacterDef> = {
  kavi: {
    id: 'kavi',
    name: 'Kavi',
    role: 'Trail guide',
    look: {
      skin: '#a0673f',
      hairStyle: 'curly',
      hairColor: '#1f1a17',
      outfit: 'jacket',
      outfitColor: '#14b8a6',
      backpack: 'explorer',
      backpackColor: '#f97316',
      accessory: 'scarf',
    },
  },
  ira: {
    id: 'ira',
    name: 'Engineer Ira',
    role: 'Bridge builder, Realm of Numbers',
    look: { skin: '#e8b48c', hairStyle: 'bun', hairColor: '#4a2e1f', outfit: 'jacket', outfitColor: '#f97316', backpack: 'none', backpackColor: '#0ea5e9', accessory: 'headband' },
  },
  lexa: {
    id: 'lexa',
    name: 'Librarian Lexa',
    role: 'Keeper of the Lost Library, Kingdom of Words',
    look: { skin: '#6e4426', hairStyle: 'braid', hairColor: '#1f1a17', outfit: 'kurta', outfitColor: '#6366f1', backpack: 'none', backpackColor: '#0ea5e9', accessory: 'glasses' },
  },
  nova: {
    id: 'nova',
    name: 'Dr. Nova',
    role: 'Field researcher, Frontier of Discovery',
    look: {
      skin: '#f6d3b3',
      hairStyle: 'short',
      hairColor: '#3b4a8c',
      outfit: 'hoodie',
      outfitColor: '#22c55e',
      backpack: 'classic',
      backpackColor: '#1e3a8a',
      accessory: 'glasses',
    },
  },
  gorm: { id: 'gorm', name: 'Gorm the Toll Keeper', role: 'Guardian of the river crossing', creature: 'gorm' },
  golem: { id: 'golem', name: 'The Storm Golem', role: 'Living storm over the gorge', creature: 'golem' },
  owl: { id: 'owl', name: 'The Riddle Keeper', role: 'Ancient owl of the archive', creature: 'owl' },
  cloud: { id: 'cloud', name: 'Static', role: 'A mischievous storm cloud', creature: 'cloud' },
}

export function getCharacter(id: string): CharacterDef {
  return CHARACTERS[id] ?? CHARACTERS.kavi
}
