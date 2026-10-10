import type { BossBlueprint, Difficulty, QuestionTemplate } from '../content/types'
import type { Rng } from '../engine/rng'

export interface BossPlanRound {
  index: number
  conceptId: string
  templateId: string
  difficulty: Difficulty
  narrative: string
}

export type BossPlanResult = { ok: true; rounds: BossPlanRound[] } | { ok: false; errors: string[] }

/**
 * Build a boss instance from an approved blueprint. Each round gets an approved
 * template for its concept within the round's difficulty constraints. Templates
 * used in the previous attempt are avoided where possible so a retry is
 * comparable but different.
 */
export function planBoss(
  blueprint: BossBlueprint,
  templates: readonly QuestionTemplate[],
  isApproved: (t: QuestionTemplate) => boolean,
  rng: Rng,
  avoidTemplateIds: ReadonlySet<string> = new Set(),
): BossPlanResult {
  const errors: string[] = []
  const rounds: BossPlanRound[] = []
  const usedThisPlan = new Set<string>()
  blueprint.rounds.forEach((round, index) => {
    const [lo, hi] = round.difficulty
    const pool = templates.filter(
      (t) =>
        t.chapterId === blueprint.chapterId &&
        t.conceptId === round.conceptId &&
        isApproved(t) &&
        t.difficulty >= lo &&
        t.difficulty <= hi &&
        (!round.types || round.types.includes(t.type)),
    )
    if (pool.length === 0) {
      errors.push(`Round ${index + 1}: no approved template for ${round.conceptId} at difficulty ${lo}–${hi}`)
      return
    }
    const fresh = pool.filter((t) => !usedThisPlan.has(t.id) && !avoidTemplateIds.has(t.id))
    const notInPlan = pool.filter((t) => !usedThisPlan.has(t.id))
    const t = rng.pick(fresh.length ? fresh : notInPlan.length ? notInPlan : pool)
    usedThisPlan.add(t.id)
    rounds.push({ index, conceptId: round.conceptId, templateId: t.id, difficulty: t.difficulty, narrative: round.narrative })
  })
  const required = new Set(blueprint.rounds.map((r) => r.conceptId))
  const covered = new Set(rounds.map((r) => r.conceptId))
  for (const c of required) if (!covered.has(c)) errors.push(`Required concept ${c} is not covered`)
  return errors.length ? { ok: false, errors } : { ok: true, rounds }
}

export interface BossRoundResult {
  index: number
  conceptId: string
  correct: boolean
  score: number
  hintsUsed: number
  misconceptionId?: string
}

export interface BossEvaluation {
  passed: boolean
  ratio: number
  correct: number
  total: number
  perConcept: Record<string, { correct: number; total: number }>
  failedConcepts: string[]
  reasons: string[]
}

export function evaluateBoss(blueprint: BossBlueprint, results: BossRoundResult[], livesLeft: number): BossEvaluation {
  const total = blueprint.rounds.length
  const correct = results.filter((r) => r.correct).length
  const perConcept: BossEvaluation['perConcept'] = {}
  for (const r of blueprint.rounds) perConcept[r.conceptId] ??= { correct: 0, total: 0 }
  for (const r of results) {
    const pc = (perConcept[r.conceptId] ??= { correct: 0, total: 0 })
    pc.total += 1
    if (r.correct) pc.correct += 1
  }
  const ratio = total ? correct / total : 0
  const failedConcepts = Object.entries(perConcept)
    .filter(([, v]) => v.correct < blueprint.passing.perConceptMin || v.correct < v.total)
    .map(([k]) => k)
  const reasons: string[] = []
  if (results.length < total) reasons.push('The challenge ended before every round was attempted.')
  if (livesLeft <= 0) reasons.push('All hearts were used.')
  if (ratio < blueprint.passing.minCorrectRatio) {
    reasons.push(`Needed ${Math.ceil(blueprint.passing.minCorrectRatio * total)} of ${total} correct; got ${correct}.`)
  }
  const missingConcepts = Object.entries(perConcept).filter(([, v]) => v.correct < blueprint.passing.perConceptMin)
  if (missingConcepts.length) reasons.push('Every idea in the challenge needs at least one correct answer.')
  const passed = results.length === total && livesLeft > 0 && ratio >= blueprint.passing.minCorrectRatio && missingConcepts.length === 0
  return { passed, ratio, correct, total, perConcept, failedConcepts, reasons }
}

export interface BossRunState {
  roundIndex: number
  lives: number
  hintsLeft: number
  results: BossRoundResult[]
  gradedInstanceIds: string[]
  status: 'active' | 'won' | 'lost'
}

export function startBossRun(blueprint: BossBlueprint): BossRunState {
  return { roundIndex: 0, lives: blueprint.lives, hintsLeft: blueprint.hintsAllowed, results: [], gradedInstanceIds: [], status: 'active' }
}

export function applyBossResult(
  blueprint: BossBlueprint,
  state: BossRunState,
  instanceId: string,
  result: Omit<BossRoundResult, 'index'>,
): { state: BossRunState; accepted: boolean } {
  if (state.status !== 'active' || state.gradedInstanceIds.includes(instanceId)) return { state, accepted: false }
  const results = [...state.results, { ...result, index: state.roundIndex }]
  const lives = result.correct ? state.lives : state.lives - 1
  const roundIndex = state.roundIndex + 1
  let status: BossRunState['status'] = 'active'
  if (lives <= 0) status = 'lost'
  else if (roundIndex >= blueprint.rounds.length) status = evaluateBoss(blueprint, results, lives).passed ? 'won' : 'lost'
  return {
    state: {
      ...state,
      results,
      lives,
      roundIndex,
      hintsLeft: Math.max(0, state.hintsLeft - result.hintsUsed),
      gradedInstanceIds: [...state.gradedInstanceIds, instanceId],
      status,
    },
    accepted: true,
  }
}
