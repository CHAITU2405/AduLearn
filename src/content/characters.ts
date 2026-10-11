import type { AvatarConfig, HeroId } from '@/core/avatar'

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
  pip: { id: 'pip', name: 'Pip', role: 'Your spark companion' },
  gorm: { id: 'gorm', name: 'Gorm the Toll Keeper', role: 'Guardian of the river crossing', creature: 'gorm' },
  golem: { id: 'golem', name: 'The Storm Golem', role: 'Living storm over the gorge', creature: 'golem' },
  owl: { id: 'owl', name: 'The Riddle Keeper', role: 'Ancient owl of the archive', creature: 'owl' },
  cloud: { id: 'cloud', name: 'Static', role: 'A mischievous storm cloud', creature: 'cloud' },
}

export function getCharacter(id: string): CharacterDef {
  return CHARACTERS[id] ?? CHARACTERS.kavi
}

export interface HeroDef {
  id: HeroId
  name: string
  blurb: string
  /** Drawn map figure that matches the painting (the explorer can still customise it). */
  look: AvatarConfig
}

/** Painted heroes the explorer can play as. */
export const HEROES: HeroDef[] = [
  {
    id: 'arjun',
    name: 'Arjun',
    blurb: 'Steady and brave — never leaves a puzzle half-solved.',
    look: {
      skin: '#c98d5f',
      hairStyle: 'short',
      hairColor: '#1f1a17',
      outfit: 'hoodie',
      outfitColor: '#0ea5e9',
      backpack: 'explorer',
      backpackColor: '#f97316',
      accessory: 'none',
      hero: 'arjun',
    },
  },
  {
    id: 'meera',
    name: 'Meera',
    blurb: 'Quick-witted and curious — spots clues others miss.',
    look: {
      skin: '#e8b48c',
      hairStyle: 'long',
      hairColor: '#1f1a17',
      outfit: 'jacket',
      outfitColor: '#14b8a6',
      backpack: 'none',
      backpackColor: '#f97316',
      accessory: 'none',
      hero: 'meera',
    },
  },
  {
    id: 'ravi',
    name: 'Ravi',
    blurb: 'Full of energy — first across every bridge.',
    look: {
      skin: '#c98d5f',
      hairStyle: 'spiky',
      hairColor: '#4a2e1f',
      outfit: 'tee',
      outfitColor: '#f43f5e',
      backpack: 'classic',
      backpackColor: '#f97316',
      accessory: 'none',
      hero: 'ravi',
    },
  },
  {
    id: 'anika',
    name: 'Anika',
    blurb: 'Thoughtful storyteller — keeps notes on everything.',
    look: {
      skin: '#6e4426',
      hairStyle: 'curly',
      hairColor: '#1f1a17',
      outfit: 'kurta',
      outfitColor: '#6366f1',
      backpack: 'classic',
      backpackColor: '#22c55e',
      accessory: 'none',
      hero: 'anika',
    },
  },
]
