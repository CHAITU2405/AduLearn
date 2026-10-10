import { describe, expect, it } from 'vitest'
import { applyOutcome, conceptsToPractise, startRun, type Outcome, type RunRules } from './missionRun'

const rules: RunRules = { kind: 'mission', goal: { correct: 3, atDifficulty: { difficulty: 2, count: 1 } }, lives: 3 }
let n = 0
const o = (over: Partial<Outcome> = {}): Outcome => ({ instanceId: `i${n++}`, conceptId: 'a', difficulty: 1, correct: true, hintsUsed: 0, ...over })

describe('lives and mission runs', () => {
  it('consumes a life per incorrect answer and fails at zero', () => {
    let s = startRun('r', 'm', rules)
    for (let i = 0; i < 2; i++) s = applyOutcome(s, rules, o({ correct: false })).state
    expect(s.lives).toBe(1)
    expect(s.status).toBe('active')
    s = applyOutcome(s, rules, o({ correct: false })).state
    expect(s).toMatchObject({ lives: 0, status: 'failed' })
  })

  it('requires the harder-question goal, not just a count of correct answers', () => {
    let s = startRun('r', 'm', rules)
    for (let i = 0; i < 4; i++) s = applyOutcome(s, rules, o({ difficulty: 1 })).state
    expect(s.status).toBe('active')
    s = applyOutcome(s, rules, o({ difficulty: 2 })).state
    expect(s.status).toBe('complete')
  })

  it('rejects duplicate submissions for the same question instance', () => {
    const once = applyOutcome(startRun('r', 'm', rules), rules, o({ instanceId: 'dup' }))
    const twice = applyOutcome(once.state, rules, o({ instanceId: 'dup' }))
    expect(twice).toMatchObject({ accepted: false, reason: 'duplicate' })
    expect(twice.state.correct).toBe(1)
  })

  it('ignores outcomes after the run has ended', () => {
    const oneLife: RunRules = { ...rules, lives: 1 }
    const failed = applyOutcome(startRun('r', 'm', oneLife), oneLife, o({ correct: false })).state
    expect(applyOutcome(failed, oneLife, o()).accepted).toBe(false)
  })

  it('never takes lives in practice runs', () => {
    const p: RunRules = { kind: 'practice', goal: { correct: 2 }, lives: null }
    let s = startRun('r', 'p', p)
    for (let i = 0; i < 10; i++) s = applyOutcome(s, p, o({ correct: false })).state
    expect(s).toMatchObject({ lives: null, status: 'active' })
  })

  it('records comebacks and the concepts to practise after failure', () => {
    let s = startRun('r', 'm', rules)
    s = applyOutcome(s, rules, o({ conceptId: 'b', correct: false })).state
    s = applyOutcome(s, rules, o({ conceptId: 'b', correct: true })).state
    expect(s.comebacks).toEqual(['b'])
    s = applyOutcome(s, rules, o({ conceptId: 'c', correct: false })).state
    s = applyOutcome(s, rules, o({ conceptId: 'c', correct: false })).state
    expect(conceptsToPractise(s)).toEqual(['c', 'b'])
  })
})
