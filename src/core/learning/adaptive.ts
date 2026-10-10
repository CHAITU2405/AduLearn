import type { ConceptWeight, Difficulty, QuestionTemplate, QuestionType } from '../content/types'
import type { Rng } from '../engine/rng'
import { MASTERY_RULES, type MasteryState } from './mastery'

export interface RecentOutcome {
  conceptId: string
  correct: boolean
}

export interface SelectionInput {
  conceptMix: ConceptWeight[]
  difficultyRange: [Difficulty, Difficulty]
  mastery: Record<string, MasteryState | undefined>
  /** Outcomes within the current run, most recent last. */
  recent: RecentOutcome[]
  /** Concepts that actually have approved templates (others are skipped). */
  availableConcepts: ReadonlySet<string>
}

export interface Decision {
  conceptId: string
  difficulty: Difficulty
  /** Offer the first hint proactively, and keep explanations close. */
  supportMode: boolean
  /** Plain-language reason, shown in "Why this question?". */
  reason: string
}

const clampDifficulty = (d: number, [lo, hi]: [Difficulty, Difficulty]) => Math.min(hi, Math.max(lo, d)) as Difficulty

/**
 * Rule-based next-activity selection. Every branch produces a reason so the
 * choice can be explained to the student and the teacher.
 */
export function chooseNext(input: SelectionInput, rng: Rng): Decision | null {
  const mix = input.conceptMix.filter((c) => input.availableConcepts.has(c.conceptId) && c.weight > 0)
  if (mix.length === 0) return null
  const last = input.recent.at(-1)
  const lastOnConcept = (id: string) => [...input.recent].reverse().filter((r) => r.conceptId === id)

  let conceptId: string
  let reason: string
  if (last && !last.correct && mix.some((c) => c.conceptId === last.conceptId)) {
    conceptId = last.conceptId
    reason = 'You missed the last question, so here is a fresh variant on the same idea.'
  } else {
    // Weight each concept by its mission weight, favouring lower estimates.
    const scored = mix.map((c) => {
      const est = input.mastery[c.conceptId]?.estimate ?? 0
      return { id: c.conceptId, w: c.weight * (1.4 - est) }
    })
    const total = scored.reduce((a, s) => a + s.w, 0)
    let r = rng.next() * total
    conceptId = scored[scored.length - 1].id
    for (const s of scored) {
      r -= s.w
      if (r <= 0) {
        conceptId = s.id
        break
      }
    }
    const est = input.mastery[conceptId]?.estimate ?? 0
    const lowest = scored.every((s) => (input.mastery[s.id]?.estimate ?? 0) >= est)
    reason =
      mix.length === 1
        ? 'This mission focuses on one idea; each question is a new variant.'
        : lowest
          ? 'This idea has the lowest progress estimate in this mission, so it comes up more often.'
          : 'Mixing ideas from this mission helps you remember them.'
  }

  const m = input.mastery[conceptId]
  const recentOnConcept = lastOnConcept(conceptId)
  const missesInRow = recentOnConcept.findIndex((r) => r.correct)
  const consecutiveMisses = missesInRow === -1 ? recentOnConcept.length : missesInRow
  let difficulty = clampDifficulty(m?.level ?? input.difficultyRange[0], input.difficultyRange)
  let supportMode = false
  if (consecutiveMisses >= MASTERY_RULES.levelDownStreak) {
    supportMode = true
    if (difficulty > input.difficultyRange[0]) difficulty = (difficulty - 1) as Difficulty
    reason = 'Two misses in a row: a slightly easier question, with a hint ready.'
  } else if (consecutiveMisses === 1) {
    supportMode = true
  } else if (m && difficulty === input.difficultyRange[1] && difficulty > input.difficultyRange[0]) {
    reason += ' Your recent answers moved you up to this mission’s top difficulty.'
  }
  return { conceptId, difficulty, supportMode, reason }
}

export interface TemplatePickInput {
  templates: readonly QuestionTemplate[]
  conceptId: string
  difficulty: Difficulty
  types?: readonly QuestionType[]
  /** templateId -> how many times recently used; less-used templates are preferred. */
  recentUse?: Record<string, number>
  /** Only approved content reaches students. */
  isApproved: (t: QuestionTemplate) => boolean
}

/** Pick a template for a concept, using the nearest available difficulty if needed. */
export function pickTemplate(input: TemplatePickInput, rng: Rng): QuestionTemplate | null {
  const pool = input.templates.filter((t) => t.conceptId === input.conceptId && input.isApproved(t) && (!input.types || input.types.includes(t.type)))
  if (pool.length === 0) return null
  const distance = (t: QuestionTemplate) => Math.abs(t.difficulty - input.difficulty) + (t.difficulty > input.difficulty ? 0.5 : 0)
  const best = Math.min(...pool.map(distance))
  const nearest = pool.filter((t) => distance(t) === best)
  const minUse = Math.min(...nearest.map((t) => input.recentUse?.[t.id] ?? 0))
  const leastUsed = nearest.filter((t) => (input.recentUse?.[t.id] ?? 0) === minUse)
  return rng.pick(leastUsed)
}
