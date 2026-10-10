/**
 * Game economy: stars for missions, coins for correct answers, and a fixed
 * price wardrobe. No randomness, no loot boxes, no time-based rewards: coins
 * only come from new, graded, correct answers.
 */
import type { EvidenceContext } from '../learning/mastery'
import type { RunState } from './missionRun'

export type Stars = 1 | 2 | 3

/** Mission rating: 3★ = no hearts lost and at most one hint; 2★ = at most one heart lost; else 1★. */
export function missionStars(run: Pick<RunState, 'lives' | 'maxLives' | 'hintsUsed' | 'status'>): Stars | 0 {
  if (run.status !== 'complete') return 0
  const lost = run.maxLives !== null && run.lives !== null ? run.maxLives - run.lives : 0
  if (lost === 0 && run.hintsUsed <= 1) return 3
  if (lost <= 1) return 2
  return 1
}

/** Boss rating from hearts remaining after a win. */
export function bossStars(livesLeft: number, maxLives: number, won: boolean): Stars | 0 {
  if (!won) return 0
  if (livesLeft === maxLives) return 3
  if (livesLeft >= maxLives - 1) return 2
  return 1
}

export const COIN_RULES = {
  independent: 10,
  withHint: 5,
  review: 2,
  bossBonus: 5,
} as const

/** Coins for one graded answer. Wrong answers and duplicates earn nothing. */
export function coinsForAnswer(a: { correct: boolean; hintsUsed: number; context: EvidenceContext; isNewVariant: boolean }): number {
  if (!a.correct) return 0
  if (a.context === 'diagnostic' || a.context === 'followup') return 0 // checks are not for rewards
  if (a.context === 'review' || !a.isNewVariant) return COIN_RULES.review
  const base = a.hintsUsed > 0 ? COIN_RULES.withHint : COIN_RULES.independent
  return a.context === 'boss' ? base + COIN_RULES.bossBonus : base
}

export interface WardrobeItem {
  id: string
  name: string
  /** Which avatar field this item sets, and the value. */
  field: 'accessory' | 'backpack' | 'outfit'
  value: string
  price: number
  description: string
}

/** Purchasable cosmetics. Base avatar options are always free. */
export const WARDROBE: WardrobeItem[] = [
  { id: 'acc-explorer-hat', name: 'Explorer hat', field: 'accessory', value: 'explorer-hat', price: 60, description: 'A wide-brimmed hat for long journeys.' },
  { id: 'acc-headphones', name: 'Headphones', field: 'accessory', value: 'headphones', price: 80, description: 'For listening carefully.' },
  { id: 'acc-flower', name: 'Flower crown', field: 'accessory', value: 'flower', price: 100, description: 'Fresh from the Frontier meadows.' },
  { id: 'acc-crown', name: 'Scholar crown', field: 'accessory', value: 'crown', price: 250, description: 'For dedicated explorers.' },
  { id: 'bp-jetpack', name: 'Jetpack', field: 'backpack', value: 'jetpack', price: 180, description: 'Zoom between regions (in style).' },
  { id: 'out-cape', name: 'Adventurer cape', field: 'outfit', value: 'cape', price: 150, description: 'Flutters when you walk.' },
]

export const PREMIUM_VALUES = new Set(WARDROBE.map((w) => `${w.field}:${w.value}`))

export function isOwned(owned: readonly string[], field: string, value: string): boolean {
  const item = WARDROBE.find((w) => w.field === field && w.value === value)
  return !item || owned.includes(item.id)
}

export type PurchaseResult = { ok: true; coins: number; owned: string[] } | { ok: false; reason: 'unknown-item' | 'already-owned' | 'not-enough-coins' }

export function purchase(wallet: { coins: number; owned: string[] }, itemId: string): PurchaseResult {
  const item = WARDROBE.find((w) => w.id === itemId)
  if (!item) return { ok: false, reason: 'unknown-item' }
  if (wallet.owned.includes(itemId)) return { ok: false, reason: 'already-owned' }
  if (wallet.coins < item.price) return { ok: false, reason: 'not-enough-coins' }
  return { ok: true, coins: wallet.coins - item.price, owned: [...wallet.owned, itemId] }
}

/** Explorer rank from total stars (a light-touch title, not a ranking against others). */
export function explorerRank(totalStars: number): { title: string; next: number | null } {
  const ranks: [number, string][] = [
    [0, 'New Explorer'],
    [6, 'Trailblazer'],
    [15, 'Pathfinder'],
    [27, 'Adventurer'],
    [40, 'Legend of the Isle'],
  ]
  let current = ranks[0]
  let next: number | null = null
  for (const r of ranks) {
    if (totalStars >= r[0]) current = r
    else {
      next = r[0]
      break
    }
  }
  return { title: current[1], next }
}

/** What a slot falls back to when a wardrobe item is taken off. */
export const TAKE_OFF_VALUE: Record<WardrobeItem['field'], string> = { accessory: 'none', backpack: 'explorer', outfit: 'hoodie' }

export function isWearing(avatar: Record<WardrobeItem['field'], string>, item: WardrobeItem): boolean {
  return avatar[item.field] === item.value
}

/** Put an owned item on. Returns null if the item is not owned (wearing requires buying first). */
export function wearItem<A extends Record<WardrobeItem['field'], string>>(avatar: A, item: WardrobeItem, owned: readonly string[]): A | null {
  if (!owned.includes(item.id)) return null
  return { ...avatar, [item.field]: item.value }
}

export function takeOffItem<A extends Record<WardrobeItem['field'], string>>(avatar: A, item: WardrobeItem): A {
  return isWearing(avatar, item) ? { ...avatar, [item.field]: TAKE_OFF_VALUE[item.field] } : avatar
}

/** Preview any item (owned or not) without saving — "try on" in the shop. */
export function tryOnItem<A extends Record<WardrobeItem['field'], string>>(avatar: A, item: WardrobeItem): A {
  return { ...avatar, [item.field]: item.value }
}
