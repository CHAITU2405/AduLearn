import { describe, expect, it } from 'vitest'
import { findPath, neighbourInDirection, pathPoints, polylineLength, type SceneGraph } from '../world/graph'
import { DEFAULT_AVATAR } from '../avatar'
import { bossStars, coinsForAnswer, explorerRank, isOwned, isWearing, missionStars, purchase, takeOffItem, tryOnItem, WARDROBE, wearItem } from './economy'

describe('stars', () => {
  const run = (lives: number, hintsUsed: number) => ({ lives, maxLives: 3, hintsUsed, status: 'complete' as const })
  it('rates missions by hearts kept and hints used', () => {
    expect(missionStars(run(3, 0))).toBe(3)
    expect(missionStars(run(3, 1))).toBe(3)
    expect(missionStars(run(3, 4))).toBe(2)
    expect(missionStars(run(2, 0))).toBe(2)
    expect(missionStars(run(1, 0))).toBe(1)
    expect(missionStars({ ...run(3, 0), status: 'active' as const })).toBe(0)
  })
  it('rates bosses by hearts left', () => {
    expect(bossStars(3, 3, true)).toBe(3)
    expect(bossStars(2, 3, true)).toBe(2)
    expect(bossStars(1, 3, true)).toBe(1)
    expect(bossStars(3, 3, false)).toBe(0)
  })
})

describe('coins', () => {
  it('only rewards correct answers, more for independent new work', () => {
    expect(coinsForAnswer({ correct: false, hintsUsed: 0, context: 'mission', isNewVariant: true })).toBe(0)
    expect(coinsForAnswer({ correct: true, hintsUsed: 0, context: 'mission', isNewVariant: true })).toBe(10)
    expect(coinsForAnswer({ correct: true, hintsUsed: 1, context: 'mission', isNewVariant: true })).toBe(5)
    expect(coinsForAnswer({ correct: true, hintsUsed: 0, context: 'review', isNewVariant: false })).toBe(2)
    expect(coinsForAnswer({ correct: true, hintsUsed: 0, context: 'boss', isNewVariant: true })).toBe(15)
    expect(coinsForAnswer({ correct: true, hintsUsed: 0, context: 'diagnostic', isNewVariant: true })).toBe(0)
  })
})

describe('wardrobe', () => {
  it('sells items at fixed prices, once', () => {
    const hat = WARDROBE[0]
    expect(purchase({ coins: 10, owned: [] }, hat.id)).toEqual({ ok: false, reason: 'not-enough-coins' })
    const bought = purchase({ coins: 500, owned: [] }, hat.id)
    expect(bought).toEqual({ ok: true, coins: 500 - hat.price, owned: [hat.id] })
    expect(purchase({ coins: 500, owned: [hat.id] }, hat.id)).toEqual({ ok: false, reason: 'already-owned' })
    expect(purchase({ coins: 500, owned: [] }, 'nope')).toEqual({ ok: false, reason: 'unknown-item' })
  })
  it('treats base options as owned and premium ones as locked until bought', () => {
    expect(isOwned([], 'accessory', 'glasses')).toBe(true)
    expect(isOwned([], 'accessory', 'crown')).toBe(false)
    expect(isOwned(['acc-crown'], 'accessory', 'crown')).toBe(true)
  })
  it('wears only owned items, can take them off, and can preview anything', () => {
    const crown = WARDROBE.find((w) => w.id === 'acc-crown')!
    const jetpack = WARDROBE.find((w) => w.id === 'bp-jetpack')!
    expect(wearItem(DEFAULT_AVATAR, crown, [])).toBeNull()
    const worn = wearItem(DEFAULT_AVATAR, crown, ['acc-crown'])!
    expect(worn.accessory).toBe('crown')
    expect(isWearing(worn, crown)).toBe(true)
    expect(takeOffItem(worn, crown).accessory).toBe('none')
    expect(takeOffItem(worn, jetpack)).toBe(worn) // not wearing it: unchanged
    expect(tryOnItem(DEFAULT_AVATAR, jetpack).backpack).toBe('jetpack')
    expect(DEFAULT_AVATAR.backpack).toBe('explorer') // preview never mutates
  })

  it('gives friendly ranks', () => {
    expect(explorerRank(0)).toEqual({ title: 'New Explorer', next: 6 })
    expect(explorerRank(16).title).toBe('Pathfinder')
  })
})

describe('scene graph movement', () => {
  const g: SceneGraph = {
    nodes: [
      { id: 'camp', x: 0, y: 100 },
      { id: 'cross', x: 0, y: 0 },
      { id: 'east', x: 100, y: 0 },
      { id: 'far', x: 200, y: 0 },
      { id: 'west', x: -100, y: 0 },
    ],
    edges: [
      { a: 'camp', b: 'cross' },
      { a: 'cross', b: 'east', via: [{ x: 50, y: -20 }] },
      { a: 'east', b: 'far' },
      { a: 'cross', b: 'west' },
    ],
  }
  it('finds shortest paths', () => {
    expect(findPath(g, 'camp', 'far')).toEqual(['camp', 'cross', 'east', 'far'])
  })
  it('does not walk through locked nodes, but can stop at them', () => {
    expect(findPath(g, 'camp', 'east', new Set(['east']))).toEqual(['camp', 'cross', 'east'])
    expect(findPath(g, 'camp', 'far', new Set(['east']))).toBeNull()
  })
  it('moves with arrow-key directions', () => {
    expect(neighbourInDirection(g, 'camp', 'up')).toBe('cross')
    expect(neighbourInDirection(g, 'cross', 'right')).toBe('east')
    expect(neighbourInDirection(g, 'cross', 'left')).toBe('west')
    expect(neighbourInDirection(g, 'camp', 'left')).toBeNull()
  })
  it('includes bend points in walking paths', () => {
    const pts = pathPoints(g, ['cross', 'east'])
    expect(pts).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: -20 },
      { x: 100, y: 0 },
    ])
    expect(polylineLength(pts)).toBeGreaterThan(100)
  })
})
