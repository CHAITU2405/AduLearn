import { describe, expect, it } from 'vitest'
import { TEMPLATES } from '@/content'
import { validateContent } from '@/content/validate'
import { defineTemplate, ILLUSTRATIVE, int, PROTOTYPE_APPROVED } from '@/core/content/define'
import { buildFromSeed, generateQuestion, probeTemplate } from './generator'
import { AnswerVault } from './vault'

describe('content manifest', () => {
  it('has no broken references or invalid template metadata', () => {
    expect(validateContent()).toEqual([])
  })
})

describe('every bundled template', () => {
  for (const t of TEMPLATES) {
    it(`${t.id} generates valid, varied instances`, () => {
      const probe = probeTemplate(t, 150)
      expect(probe.failures).toEqual([])
      expect(probe.valid).toBeGreaterThan(30)
      if (t.review.status === 'approved') expect(probe.distinct).toBeGreaterThanOrEqual(2)
    })
  }

  it('is deterministic for a given seed', () => {
    for (const t of TEMPLATES) {
      const a = buildFromSeed(t, 42)
      const b = buildFromSeed(t, 42)
      expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    }
  })

  it('never puts the answer key in the question view payload', () => {
    for (const t of TEMPLATES) {
      const r = generateQuestion(t, {
        seedSource: (() => {
          let s = 7
          return () => s++
        })(),
      })
      expect(r).not.toBeNull()
      const json = JSON.stringify(r!.question)
      expect(json).not.toContain('correctId')
      expect(json).not.toContain('accepted')
      expect(json).not.toContain('explanation')
      expect(json).not.toContain('answerDisplay')
    }
  })
})

describe('invalid instance rejection', () => {
  const broken = defineTemplate({
    id: 'test.broken',
    version: 1,
    grade: 8,
    subject: 'mathematics',
    chapterId: 'math-equations',
    conceptId: 'math.eq.one-step',
    objective: 'x',
    difficulty: 1,
    type: 'mcq',
    title: 'Broken',
    review: PROTOTYPE_APPROVED,
    curriculum: ILLUSTRATIVE,
    variables: { a: int(1, 3) },
    build: ({ a }) => ({
      view: {
        prompt: 'Pick',
        body: {
          kind: 'mcq',
          choices: [
            { id: 'c1', text: `${a}` },
            { id: 'c2', text: `${a}` },
          ],
        },
      },
      key: { body: { kind: 'mcq', correctId: 'c9' }, answerDisplay: 'x', explanation: 'x' },
      hints: ['h'],
    }),
  })

  it('rejects instances with duplicate choices or a missing correct answer', () => {
    const check = buildFromSeed(broken, 1)
    expect(check.ok).toBe(false)
    if (!check.ok) {
      expect(check.reason).toMatch(/duplicate choice texts/)
      expect(check.reason).toMatch(/correct choice is not among the choices/)
    }
    expect(generateQuestion(broken)).toBeNull()
  })

  it('rejects instances that violate the template constraint', () => {
    const constrained = defineTemplate({
      ...TEMPLATES[0],
      id: 'test.constrained',
      variables: { a: int(1, 5) },
      constraint: () => 'never valid',
      build: TEMPLATES[0].build as never,
    })
    expect(buildFromSeed(constrained, 3)).toMatchObject({ ok: false })
  })
})

describe('variant history', () => {
  it('avoids excluded fingerprints when alternatives exist', () => {
    const t = TEMPLATES.find((x) => x.id === 'math.eq.add-one-step')!
    const first = generateQuestion(t)!
    const seen = new Set([first.question.fingerprint])
    for (let i = 0; i < 20; i++) {
      const next = generateQuestion(t, { exclude: seen })!
      expect(seen.has(next.question.fingerprint)).toBe(false)
      seen.add(next.question.fingerprint)
    }
  })

  it('regenerates the exact variant from a stored seed (review mode)', () => {
    const t = TEMPLATES.find((x) => x.id === 'math.eq.two-step-basic')!
    const a = generateQuestion(t)!
    const b = generateQuestion(t, { seed: a.question.seed })!
    expect(b.question.fingerprint).toBe(a.question.fingerprint)
    expect(b.question.view).toEqual(a.question.view)
  })
})

describe('answer vault', () => {
  it('grades once and rejects duplicate submissions', () => {
    const t = TEMPLATES.find((x) => x.id === 'math.eq.add-one-step')!
    const r = generateQuestion(t, { seed: 5 })!
    const vault = new AnswerVault()
    vault.register(r)
    const answer = r.key.body.kind === 'numeric' ? String(r.key.body.value) : ''
    const first = vault.grade(r.question.instanceId, { kind: 'numeric', value: answer })
    expect(first).toMatchObject({ status: 'graded', result: { correct: true } })
    expect(vault.grade(r.question.instanceId, { kind: 'numeric', value: answer })).toEqual({ status: 'already-graded' })
    expect(vault.grade('nope', { kind: 'numeric', value: '1' })).toEqual({ status: 'unknown-question' })
  })
})
