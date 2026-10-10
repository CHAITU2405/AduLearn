import { describe, expect, it } from 'vitest'
import { ASSESSMENTS, TEMPLATES } from '@/content'
import { createRng } from '../engine/rng'
import { compareAssessments, planAssessment, type AssessmentRecordLike } from './assessment'

const approved = (t: (typeof TEMPLATES)[number]) => t.review.status === 'approved'

describe('assessment planning', () => {
  it('plans every bundled assessment from approved, eligible templates', () => {
    for (const bp of ASSESSMENTS) {
      const plan = planAssessment(bp, TEMPLATES, approved, createRng(1))
      expect(plan.ok).toBe(true)
      if (!plan.ok) continue
      expect(plan.items).toHaveLength(bp.items.length)
      for (const item of plan.items) {
        const t = TEMPLATES.find((x) => x.id === item.templateId)!
        expect(t.assessment?.eligible).toBe(true)
        expect(approved(t)).toBe(true)
      }
      expect(plan.items.some((i) => i.transfer)).toBe(true)
    }
  })

  it('uses transfer-marked templates for transfer items', () => {
    const bp = ASSESSMENTS.find((a) => a.chapterId === 'math-equations')!
    const plan = planAssessment(bp, TEMPLATES, approved, createRng(3))
    if (!plan.ok) throw new Error('plan failed')
    const transfer = plan.items.find((i) => i.transfer)!
    expect(TEMPLATES.find((t) => t.id === transfer.templateId)!.assessment?.transfer).toBe(true)
  })

  it('prefers different templates for the follow-up check', () => {
    const bp = ASSESSMENTS.find((a) => a.chapterId === 'math-equations')!
    const diag = planAssessment(bp, TEMPLATES, approved, createRng(5))
    if (!diag.ok) throw new Error('plan failed')
    const follow = planAssessment(bp, TEMPLATES, approved, createRng(6), new Set(diag.items.map((i) => i.templateId)))
    if (!follow.ok) throw new Error('plan failed')
    const different = follow.items.filter((it, i) => it.templateId !== diag.items[i].templateId)
    expect(different.length).toBeGreaterThanOrEqual(3)
  })
})

describe('assessment comparison', () => {
  const rec = (kind: 'diagnostic' | 'followup', results: [string, boolean, boolean?][]): AssessmentRecordLike => ({
    kind,
    completedAt: 1,
    items: results.map(([conceptId, correct, transfer]) => ({ conceptId, correct, transfer: !!transfer, templateId: 't', fingerprint: 'f' })),
  })

  it('reports per-concept observed changes and limitations', () => {
    const c = compareAssessments(
      rec('diagnostic', [
        ['a', false],
        ['b', true],
        ['c', true, true],
      ]),
      rec('followup', [
        ['a', true],
        ['b', true],
        ['c', false, true],
      ]),
      ['a', 'b', 'c'],
    )
    expect(c.concepts.map((x) => x.change)).toEqual(['improved', 'same', 'declined'])
    expect(c.transfer).toEqual({ before: true, after: false })
    expect(c.summary).toMatch(/Same number correct/)
    expect(c.limitations.length).toBeGreaterThan(2)
    expect(c.summary).not.toMatch(/prove/i)
  })

  it('handles a missing check honestly', () => {
    const onlyFollow = compareAssessments(null, rec('followup', [['a', true]]), ['a'])
    expect(onlyFollow.summary).toMatch(/No starting check/)
    expect(onlyFollow.concepts[0].change).toBe('incomplete')
    expect(compareAssessments(null, null, ['a']).summary).toMatch(/No checks/)
  })
})
