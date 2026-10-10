import { describe, expect, it } from 'vitest'
import type { AnswerKey } from '../content/types'
import { grade, isResponseComplete, normaliseText, parseNumber } from './grader'

const base = { answerDisplay: 'x', explanation: 'because' }

describe('parseNumber', () => {
  it.each([
    ['12', 12],
    [' -3 ', -3],
    ['2.5', 2.5],
    ['5/2', 2.5],
    ['x = 7', 7],
    ['x=7', 7],
    ['1,200', 1200],
    ['−4', -4],
    ['.5', 0.5],
  ])('parses %s', (raw, expected) => {
    expect(parseNumber(raw)).toBe(expected)
  })

  it('strips accepted units', () => {
    expect(parseNumber('250 Pa', ['pa'])).toBe(250)
    expect(parseNumber('12m', ['m'])).toBe(12)
  })

  it('rejects non-numbers', () => {
    expect(parseNumber('twelve')).toBeNull()
    expect(parseNumber('3/0')).toBeNull()
    expect(parseNumber('')).toBeNull()
  })
})

describe('normaliseText', () => {
  it('ignores case, extra spaces, smart quotes and trailing punctuation', () => {
    expect(normaliseText('  She  doesn’t like mangoes . ')).toBe("she doesn't like mangoes")
  })
})

describe('grade', () => {
  it('accepts equivalent numeric answers', () => {
    const key: AnswerKey = { ...base, body: { kind: 'numeric', value: 2.5 } }
    for (const v of ['2.5', '5/2', 'x = 2.5', '2.50']) expect(grade(key, { kind: 'numeric', value: v }).correct).toBe(true)
  })

  it('applies tolerance', () => {
    const key: AnswerKey = { ...base, body: { kind: 'numeric', value: 0.33, tolerance: 0.01 } }
    expect(grade(key, { kind: 'numeric', value: '0.334' }).correct).toBe(true)
    expect(grade(key, { kind: 'numeric', value: '0.4' }).correct).toBe(false)
  })

  it('identifies numeric misconceptions', () => {
    const key: AnswerKey = { ...base, body: { kind: 'numeric', value: 18, misconceptions: [{ value: 42, misconceptionId: 'm.inv', feedback: 'inverse!' }] } }
    expect(grade(key, { kind: 'numeric', value: '42' })).toMatchObject({ correct: false, misconceptionId: 'm.inv', feedback: 'inverse!' })
  })

  it('explains non-numeric input instead of guessing', () => {
    const key: AnswerKey = { ...base, body: { kind: 'numeric', value: 3 } }
    expect(grade(key, { kind: 'numeric', value: 'abc' }).feedback).toMatch(/number/)
  })

  it('accepts any approved text variant', () => {
    const key: AnswerKey = { ...base, body: { kind: 'text', accepted: ["She doesn't like mangoes.", 'She does not like mangoes.'] } }
    expect(grade(key, { kind: 'text', value: 'she does not like mangoes' }).correct).toBe(true)
    expect(grade(key, { kind: 'text', value: 'She doesn’t like mangoes' }).correct).toBe(true)
    expect(grade(key, { kind: 'text', value: "She don't like mangoes." }).correct).toBe(false)
  })

  it('detects text misconceptions', () => {
    const key: AnswerKey = { ...base, body: { kind: 'text', accepted: ['went'], misconceptions: [{ values: ['goed'], misconceptionId: 'over', feedback: 'irregular' }] } }
    expect(grade(key, { kind: 'text', value: 'Goed' }).misconceptionId).toBe('over')
  })

  it('grades MCQ with distractor misconceptions', () => {
    const key: AnswerKey = { ...base, body: { kind: 'mcq', correctId: 'c2', distractors: { c1: { misconceptionId: 'mx', feedback: 'no' } } } }
    expect(grade(key, { kind: 'mcq', choiceId: 'c2' }).correct).toBe(true)
    expect(grade(key, { kind: 'mcq', choiceId: 'c1' }).misconceptionId).toBe('mx')
    expect(grade(key, { kind: 'mcq', choiceId: null }).correct).toBe(false)
  })

  it('gives partial scores for matching', () => {
    const key: AnswerKey = { ...base, body: { kind: 'match', pairs: { a: '1', b: '2', c: '3', d: '4' } } }
    const r = grade(key, { kind: 'match', pairs: { a: '1', b: '2', c: '4', d: '3' } })
    expect(r.correct).toBe(false)
    expect(r.score).toBe(0.5)
  })

  it('accepts any approved word order', () => {
    const key: AnswerKey = {
      ...base,
      body: {
        kind: 'order',
        accepted: [
          ['Meena', 'carefully', 'read'],
          ['Meena', 'read', 'carefully'],
        ],
      },
    }
    expect(grade(key, { kind: 'order', tokenIds: ['Meena', 'read', 'carefully'] }).correct).toBe(true)
    expect(grade(key, { kind: 'order', tokenIds: ['read', 'Meena', 'carefully'] }).correct).toBe(false)
  })

  it('requires every part of a multi-step question', () => {
    const key: AnswerKey = {
      ...base,
      body: {
        kind: 'multi',
        parts: [
          { kind: 'mcq', correctId: 'c1' },
          { kind: 'numeric', value: 5 },
        ],
      },
    }
    const half = grade(key, {
      kind: 'multi',
      parts: [
        { kind: 'mcq', choiceId: 'c1' },
        { kind: 'numeric', value: '6' },
      ],
    })
    expect(half).toMatchObject({ correct: false, score: 0.5 })
    expect(
      grade(key, {
        kind: 'multi',
        parts: [
          { kind: 'mcq', choiceId: 'c1' },
          { kind: 'numeric', value: '5' },
        ],
      }).correct,
    ).toBe(true)
  })
})

describe('isResponseComplete', () => {
  it('blocks empty or partial submissions', () => {
    expect(isResponseComplete({ kind: 'numeric', value: '  ' }, {})).toBe(false)
    expect(isResponseComplete({ kind: 'match', pairs: { a: '1' } }, { pairs: 2 })).toBe(false)
    expect(isResponseComplete({ kind: 'match', pairs: { a: '1', b: '2' } }, { pairs: 2 })).toBe(true)
    expect(
      isResponseComplete(
        {
          kind: 'multi',
          parts: [
            { kind: 'mcq', choiceId: 'c1' },
            { kind: 'text', value: '' },
          ],
        },
        { parts: 2 },
      ),
    ).toBe(false)
  })
})
