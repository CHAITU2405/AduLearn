import { describe, expect, it } from 'vitest'
import { TEMPLATES } from '@/content'
import { createRng } from '../engine/rng'
import { chooseNext, pickTemplate } from './adaptive'
import { initialMastery } from './mastery'

const all = new Set(['a', 'b'])
const mix = [
  { conceptId: 'a', weight: 1 },
  { conceptId: 'b', weight: 1 },
]
const approved = (t: (typeof TEMPLATES)[number]) => t.review.status === 'approved'

describe('chooseNext', () => {
  it('retries the same concept with a fresh variant after a miss', () => {
    for (let s = 0; s < 20; s++) {
      const d = chooseNext({ conceptMix: mix, difficultyRange: [1, 3], mastery: {}, recent: [{ conceptId: 'b', correct: false }], availableConcepts: all }, createRng(s))!
      expect(d.conceptId).toBe('b')
      expect(d.supportMode).toBe(true)
      expect(d.reason).toMatch(/fresh variant/)
    }
  })

  it('temporarily lowers difficulty after repeated misses and explains why', () => {
    const m = { ...initialMastery('a'), level: 3 as const }
    const d = chooseNext(
      {
        conceptMix: [{ conceptId: 'a', weight: 1 }],
        difficultyRange: [1, 3],
        mastery: { a: m },
        recent: [
          { conceptId: 'a', correct: false },
          { conceptId: 'a', correct: false },
        ],
        availableConcepts: all,
      },
      createRng(1),
    )!
    expect(d.difficulty).toBe(2)
    expect(d.supportMode).toBe(true)
    expect(d.reason).toMatch(/easier/)
  })

  it('uses the concept level, clamped to the mission range', () => {
    const d = chooseNext(
      { conceptMix: [{ conceptId: 'a', weight: 1 }], difficultyRange: [2, 3], mastery: { a: initialMastery('a') }, recent: [], availableConcepts: all },
      createRng(1),
    )!
    expect(d.difficulty).toBe(2)
  })

  it('favours concepts with lower estimates', () => {
    const mastery = { a: { ...initialMastery('a'), estimate: 0.95 }, b: { ...initialMastery('b'), estimate: 0 } }
    let b = 0
    for (let s = 0; s < 300; s++) if (chooseNext({ conceptMix: mix, difficultyRange: [1, 3], mastery, recent: [], availableConcepts: all }, createRng(s))!.conceptId === 'b') b++
    expect(b).toBeGreaterThan(180)
  })

  it('skips concepts without approved content', () => {
    expect(chooseNext({ conceptMix: mix, difficultyRange: [1, 3], mastery: {}, recent: [], availableConcepts: new Set() }, createRng(1))).toBeNull()
  })
})

describe('pickTemplate', () => {
  it('only uses approved templates', () => {
    for (let s = 0; s < 50; s++) {
      const t = pickTemplate({ templates: TEMPLATES, conceptId: 'math.eq.both-sides', difficulty: 3, isApproved: approved }, createRng(s))!
      expect(t.review.status).toBe('approved')
      expect(t.id).not.toBe('math.eq.fraction-both') // pending review
    }
    expect(pickTemplate({ templates: TEMPLATES, conceptId: 'math.eq.both-sides', difficulty: 3, isApproved: () => false }, createRng(3))).toBeNull()
  })

  it('falls back to the nearest available difficulty', () => {
    const t = pickTemplate({ templates: TEMPLATES, conceptId: 'math.eq.two-step', difficulty: 1, isApproved: approved }, createRng(2))!
    expect(t.difficulty).toBe(2)
  })

  it('prefers less recently used templates', () => {
    const pool = TEMPLATES.filter((x) => x.conceptId === 'math.eq.one-step' && x.difficulty === 1 && approved(x))
    const recentUse = Object.fromEntries(pool.slice(1).map((t) => [t.id, 3]))
    const t = pickTemplate({ templates: TEMPLATES, conceptId: 'math.eq.one-step', difficulty: 1, recentUse, isApproved: approved }, createRng(9))!
    expect(t.id).toBe(pool[0].id)
  })
})
