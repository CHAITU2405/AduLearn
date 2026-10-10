import type { AssessmentBlueprint, QuestionTemplate } from '../content/types'
import type { Rng } from '../engine/rng'

export type AssessmentKind = 'diagnostic' | 'followup'

export interface AssessmentItemResult {
  conceptId: string
  templateId: string
  fingerprint: string
  correct: boolean
  transfer: boolean
}

export interface AssessmentRecordLike {
  kind: AssessmentKind
  items: AssessmentItemResult[]
  completedAt: number
}

export interface PlannedItem {
  conceptId: string
  templateId: string
  transfer: boolean
}

/**
 * Plan an assessment. Assessment-eligible approved templates are used; transfer
 * items prefer templates marked as transfer (a new context for the concept).
 * Follow-up checks avoid the exact variants seen in the diagnostic (handled by
 * the caller via fingerprint exclusion) and prefer different templates.
 */
export function planAssessment(
  blueprint: AssessmentBlueprint,
  templates: readonly QuestionTemplate[],
  isApproved: (t: QuestionTemplate) => boolean,
  rng: Rng,
  preferAvoidTemplates: ReadonlySet<string> = new Set(),
): { ok: true; items: PlannedItem[] } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const items: PlannedItem[] = []
  const used = new Set<string>()
  for (const [i, item] of blueprint.items.entries()) {
    const eligible = templates.filter((t) => t.chapterId === blueprint.chapterId && t.conceptId === item.conceptId && isApproved(t) && t.assessment?.eligible)
    const transferPool = item.transfer ? eligible.filter((t) => t.assessment?.transfer) : []
    const base = transferPool.length ? transferPool : eligible
    if (base.length === 0) {
      errors.push(`Item ${i + 1}: no approved assessment template for ${item.conceptId}`)
      continue
    }
    const byDifficulty = [...base].sort((a, b) => Math.abs(a.difficulty - item.difficulty) - Math.abs(b.difficulty - item.difficulty))
    const bestDist = Math.abs(byDifficulty[0].difficulty - item.difficulty)
    const nearest = byDifficulty.filter((t) => Math.abs(t.difficulty - item.difficulty) === bestDist)
    const fresh = nearest.filter((t) => !used.has(t.id) && !preferAvoidTemplates.has(t.id))
    const unused = nearest.filter((t) => !used.has(t.id))
    const t = rng.pick(fresh.length ? fresh : unused.length ? unused : nearest)
    used.add(t.id)
    items.push({ conceptId: item.conceptId, templateId: t.id, transfer: !!item.transfer })
  }
  return errors.length ? { ok: false, errors } : { ok: true, items }
}

export interface ConceptComparison {
  conceptId: string
  before: { correct: number; total: number } | null
  after: { correct: number; total: number } | null
  change: 'improved' | 'same' | 'declined' | 'incomplete'
}

export interface AssessmentComparison {
  concepts: ConceptComparison[]
  before: { correct: number; total: number } | null
  after: { correct: number; total: number } | null
  transfer: { before: boolean | null; after: boolean | null }
  summary: string
  limitations: string[]
}

function tally(items: AssessmentItemResult[]) {
  return { correct: items.filter((i) => i.correct).length, total: items.length }
}

export const ASSESSMENT_LIMITATIONS = [
  'Each check has only a few questions, so one lucky guess or slip changes the result noticeably.',
  'Questions are comparable but not identical; some variants may be easier than others.',
  'A change between the two checks shows observed performance, not proof that the app caused learning.',
  'The sample content has not yet been verified against the official AP SSC Class 8 textbook.',
]

export function compareAssessments(diagnostic: AssessmentRecordLike | null, followup: AssessmentRecordLike | null, conceptIds: string[]): AssessmentComparison {
  const concepts: ConceptComparison[] = conceptIds.map((conceptId) => {
    const b = diagnostic ? diagnostic.items.filter((i) => i.conceptId === conceptId) : null
    const a = followup ? followup.items.filter((i) => i.conceptId === conceptId) : null
    const before = b && b.length ? tally(b) : null
    const after = a && a.length ? tally(a) : null
    let change: ConceptComparison['change'] = 'incomplete'
    if (before && after) {
      const rb = before.correct / before.total
      const ra = after.correct / after.total
      change = ra > rb ? 'improved' : ra < rb ? 'declined' : 'same'
    }
    return { conceptId, before, after, change }
  })
  const before = diagnostic ? tally(diagnostic.items) : null
  const after = followup ? tally(followup.items) : null
  const tr = (r: AssessmentRecordLike | null) => {
    const t = r?.items.find((i) => i.transfer)
    return t ? t.correct : null
  }
  let summary: string
  if (!before && !after) summary = 'No checks completed yet.'
  else if (!after) summary = `Starting check: ${before!.correct} of ${before!.total} correct. The follow-up check unlocks after the chapter boss.`
  else if (!before) summary = `Follow-up check: ${after.correct} of ${after.total} correct. No starting check was taken, so no comparison is possible.`
  else {
    const diff = after.correct - before.correct
    summary =
      diff > 0
        ? `Observed ${diff} more correct answer${diff === 1 ? '' : 's'} on the follow-up check (${before.correct}/${before.total} → ${after.correct}/${after.total}).`
        : diff < 0
          ? `Observed ${-diff} fewer correct answer${diff === -1 ? '' : 's'} on the follow-up check (${before.correct}/${before.total} → ${after.correct}/${after.total}).`
          : `Same number correct on both checks (${after.correct}/${after.total}).`
  }
  return { concepts, before, after, transfer: { before: tr(diagnostic), after: tr(followup) }, summary, limitations: ASSESSMENT_LIMITATIONS }
}
