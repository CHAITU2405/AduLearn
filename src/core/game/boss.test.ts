import { describe, expect, it } from 'vitest'
import { BOSSES, TEMPLATES } from '@/content'
import { createRng } from '../engine/rng'
import { applyBossResult, evaluateBoss, planBoss, startBossRun, type BossRoundResult } from './boss'

const approved = (t: (typeof TEMPLATES)[number]) => t.review.status === 'approved'
const boss = BOSSES.find((b) => b.id === 'math-boss')!

describe('boss planning', () => {
  it('builds every bundled boss from approved templates covering all required concepts', () => {
    for (const b of BOSSES) {
      const plan = planBoss(b, TEMPLATES, approved, createRng(1))
      expect(plan.ok).toBe(true)
      if (!plan.ok) continue
      expect(new Set(plan.rounds.map((r) => r.conceptId))).toEqual(new Set(b.rounds.map((r) => r.conceptId)))
      for (const r of plan.rounds) {
        const t = TEMPLATES.find((x) => x.id === r.templateId)!
        expect(approved(t)).toBe(true)
        expect(t.chapterId).toBe(b.chapterId)
        const round = b.rounds[r.index]
        expect(t.difficulty).toBeGreaterThanOrEqual(round.difficulty[0])
        expect(t.difficulty).toBeLessThanOrEqual(round.difficulty[1])
        if (round.types) expect(round.types).toContain(t.type)
      }
    }
  })

  it('includes a multi-step problem in the chapter boss', () => {
    const plan = planBoss(boss, TEMPLATES, approved, createRng(4))
    expect(plan.ok && plan.rounds.some((r) => TEMPLATES.find((t) => t.id === r.templateId)!.type === 'multi')).toBe(true)
  })

  it('refuses to build a boss when a round has no approved content', () => {
    const plan = planBoss(boss, TEMPLATES, (t) => approved(t) && t.conceptId !== 'math.eq.both-sides', createRng(1))
    expect(plan.ok).toBe(false)
    if (!plan.ok) expect(plan.errors.join(' ')).toMatch(/math.eq.both-sides/)
  })

  it('prefers different templates on a retry where possible', () => {
    const first = planBoss(boss, TEMPLATES, approved, createRng(7))
    if (!first.ok) throw new Error('plan failed')
    const retry = planBoss(boss, TEMPLATES, approved, createRng(8), new Set(first.rounds.map((r) => r.templateId)))
    if (!retry.ok) throw new Error('plan failed')
    const changed = retry.rounds.filter((r, i) => r.templateId !== first.rounds[i].templateId)
    expect(changed.length).toBeGreaterThan(0)
  })
})

describe('boss passing requirements', () => {
  const result = (conceptId: string, correct: boolean, index = 0): BossRoundResult => ({ index, conceptId, correct, score: correct ? 1 : 0, hintsUsed: 0 })
  const allRounds = (correctness: boolean[]) => boss.rounds.map((r, i) => result(r.conceptId, correctness[i], i))

  it('passes with enough correct answers covering every concept', () => {
    expect(evaluateBoss(boss, allRounds([true, true, true, true, false, true]), 2).passed).toBe(true)
  })

  it('fails when the ratio is too low', () => {
    const e = evaluateBoss(boss, allRounds([true, false, true, false, false, true]), 1)
    expect(e.passed).toBe(false)
    expect(e.reasons.join(' ')).toMatch(/Needed/)
  })

  it('fails when a concept has no correct answer even if the ratio is met', () => {
    // Rounds 4 and 6 are both "both sides": miss both.
    const e = evaluateBoss(boss, allRounds([true, true, true, false, true, false]), 1)
    expect(e.passed).toBe(false)
    expect(e.failedConcepts).toContain('math.eq.both-sides')
  })

  it('ends the run when hearts run out, and rejects duplicate submissions', () => {
    let s = startBossRun(boss)
    for (let i = 0; i < boss.lives; i++) s = applyBossResult(boss, s, `x${i}`, { conceptId: 'math.eq.one-step', correct: false, score: 0, hintsUsed: 0 }).state
    expect(s.status).toBe('lost')
    const again = applyBossResult(boss, startBossRun(boss), 'same', { conceptId: 'a', correct: true, score: 1, hintsUsed: 0 })
    expect(applyBossResult(boss, again.state, 'same', { conceptId: 'a', correct: true, score: 1, hintsUsed: 0 }).accepted).toBe(false)
  })

  it('limits hints across the whole challenge', () => {
    const s = applyBossResult(boss, startBossRun(boss), 'h', { conceptId: 'math.eq.one-step', correct: true, score: 1, hintsUsed: 2 }).state
    expect(s.hintsLeft).toBe(0)
  })
})
