import { z } from 'zod'

export const AVATAR_OPTIONS = {
  skin: ['#f6d3b3', '#e8b48c', '#c98d5f', '#a0673f', '#6e4426'],
  hairStyle: ['short', 'long', 'curly', 'bun', 'braid', 'spiky'],
  hairColor: ['#1f1a17', '#4a2e1f', '#8a5a2b', '#c7792c', '#3b4a8c'],
  outfit: ['tee', 'hoodie', 'kurta', 'jacket', 'cape'],
  outfitColor: ['#0ea5e9', '#14b8a6', '#f97316', '#f43f5e', '#eab308', '#22c55e', '#6366f1'],
  backpack: ['none', 'classic', 'explorer', 'jetpack'],
  backpackColor: ['#f97316', '#0ea5e9', '#22c55e', '#f43f5e', '#1e3a8a'],
  accessory: ['none', 'glasses', 'cap', 'headband', 'scarf', 'explorer-hat', 'headphones', 'flower', 'crown'],
} as const

/** Painted hero portraits the explorer can play as (see content/characters.ts). */
export const HERO_IDS = ['arjun', 'meera', 'ravi', 'anika'] as const
export type HeroId = (typeof HERO_IDS)[number]

export const AVATAR_LABELS = {
  hairStyle: { short: 'Short', long: 'Long', curly: 'Curly', bun: 'Bun', braid: 'Braid', spiky: 'Spiky' },
  outfit: { tee: 'T-shirt', hoodie: 'Hoodie', kurta: 'Kurta', jacket: 'Field jacket', cape: 'Adventurer cape' },
  backpack: { none: 'No backpack', classic: 'Classic', explorer: 'Explorer pack', jetpack: 'Jetpack' },
  accessory: {
    none: 'None',
    glasses: 'Glasses',
    cap: 'Cap',
    headband: 'Headband',
    scarf: 'Scarf',
    'explorer-hat': 'Explorer hat',
    headphones: 'Headphones',
    flower: 'Flower crown',
    crown: 'Scholar crown',
  },
} as const

export const avatarSchema = z.object({
  skin: z.enum(AVATAR_OPTIONS.skin),
  hairStyle: z.enum(AVATAR_OPTIONS.hairStyle),
  hairColor: z.enum(AVATAR_OPTIONS.hairColor),
  outfit: z.enum(AVATAR_OPTIONS.outfit),
  outfitColor: z.enum(AVATAR_OPTIONS.outfitColor),
  backpack: z.enum(AVATAR_OPTIONS.backpack),
  backpackColor: z.enum(AVATAR_OPTIONS.backpackColor),
  accessory: z.enum(AVATAR_OPTIONS.accessory),
  /** Painted hero shown in story scenes and challenges. Older profiles have none and use the drawn figure. */
  hero: z.enum(HERO_IDS).optional(),
})

export type AvatarConfig = z.infer<typeof avatarSchema>

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: '#c98d5f',
  hairStyle: 'short',
  hairColor: '#1f1a17',
  outfit: 'hoodie',
  outfitColor: '#0ea5e9',
  backpack: 'explorer',
  backpackColor: '#f97316',
  accessory: 'none',
  hero: 'arjun',
}

/** Nicknames must not look like contact details; real names are never required. */
export const nicknameSchema = z
  .string()
  .trim()
  .min(2, 'Use at least 2 characters.')
  .max(20, 'Use 20 characters or fewer.')
  .regex(/^[\p{L}\p{N} _-]+$/u, 'Use letters, numbers, spaces, - or _.')
  .refine((s) => !/\d{6,}/.test(s), 'Please do not use phone numbers.')
