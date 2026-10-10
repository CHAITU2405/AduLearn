import { describe, expect, it } from 'vitest'
import { initialMastery, masteryBand, needsReteaching, updateMastery, type Evidence, type MasteryState } from './mastery'

let fp = 0
const ev = (over: Partial<Evidence> = {}): Evidence => ({ correct: true, difficulty: 2, hintsUsed: 0, context: 'mission', fingerprint: `f${fp++}`, isNewVariant: true, ...over })
const apply = (s: MasteryState, evs: Partial<Evidence>[]) => evs.reduce((acc, e) => updateMastery(acc, ev(e)).state, s)

describe('mastery estimates', () => {
  it('does not treat one correct answer as mastery', () => {
    const s = apply(initialMastery('c'), [{}])
    expect(s.estimate).toBeGreaterThan(0)
    expect(masteryBand(s)).not.toBe('secure')
  })

  it('needs several independent successes on different variants to be secure', () => {
    const s = apply(
      initialMastery('c'),
      Array.from({ length: 6 }, () => ({ difficulty: 3 as const })),
    )
    expect(masteryBand(s)).toBe('secure')
    const sameVariant = apply(
      initialMastery('c'),
      Array.from({ length: 8 }, () => ({ fingerprint: 'same' })),
    )
    expect(sameVariant.independentVariants).toHaveLength(1)
    expect(masteryBand(sameVariant)).not.toBe('secure')
  })

  it('does not treat hint usage as failure, but counts it for less', () => {
    const hinted = updateMastery(initialMastery('c'), ev({ hintsUsed: 1 })).state
    const independent = updateMastery(initialMastery('c'), ev()).state
    expect(hinted.estimate).toBeGreaterThan(0)
    expect(hinted.estimate).toBeLessThan(independent.estimate)
    expect(hinted.streakIncorrect).toBe(0)
  })

  it('counts repeated variants (review) for less than new ones', () => {
    const repeat = updateMastery(initialMastery('c'), ev({ isNewVariant: false })).state
    const fresh = updateMastery(initialMastery('c'), ev()).state
    expect(repeat.estimate).toBeLessThan(fresh.estimate)
  })

  it('raises difficulty after two independent successes and lowers it after two misses', () => {
    const up1 = updateMastery(initialMastery('c'), ev())
    const up2 = updateMastery(up1.state, ev())
    expect(up2.levelChanged).toBe('up')
    expect(up2.state.level).toBe(2)
    const d1 = updateMastery(up2.state, ev({ correct: false }))
    const d2 = updateMastery(d1.state, ev({ correct: false }))
    expect(d2.levelChanged).toBe('down')
    expect(d2.state.level).toBe(1)
  })

  it('is revisable: estimates go down with errors and recover with success', () => {
    const high = apply(initialMastery('c'), [{}, {}, {}, {}])
    const lower = apply(high, [{ correct: false }, { correct: false }])
    expect(lower.estimate).toBeLessThan(high.estimate)
    const recovered = apply(lower, [{}, {}, {}])
    expect(recovered.estimate).toBeGreaterThan(lower.estimate)
  })

  it('tracks misconceptions and records when they are corrected', () => {
    const wrong = updateMastery(initialMastery('c'), ev({ correct: false, misconceptionId: 'm1' })).state
    expect(wrong.misconceptions).toEqual({ m1: 1 })
    const fixed = updateMastery(wrong, ev())
    expect(fixed.correctedMisconception).toBe('m1')
    expect(fixed.state.correctedMisconceptions).toContain('m1')
    // A success that needed a hint does not yet count as correcting it.
    expect(updateMastery(wrong, ev({ hintsUsed: 1 })).correctedMisconception).toBeUndefined()
  })

  it('flags reteaching for repeated uncorrected misconceptions, not single slips', () => {
    const once = apply(initialMastery('c'), [{ correct: false, misconceptionId: 'm' }])
    expect(needsReteaching(once).flag).toBe(false)
    const twice = apply(once, [{ correct: false, misconceptionId: 'm' }])
    expect(needsReteaching(twice).flag).toBe(true)
  })
})
