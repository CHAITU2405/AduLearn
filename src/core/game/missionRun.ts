import type { Difficulty, MissionGoal } from '../content/types'

/**
 * Pure state for one attempt at a mission (or a practice/review session).
 * The progression engine is UI-independent; screens dispatch outcomes here.
 */
export type RunKind = 'mission' | 'practice' | 'review'

export interface RunRules {
  kind: RunKind
  goal: MissionGoal
  /** null = unlimited (practice and review never take lives). */
  lives: number | null
}

export interface RunState {
  runId: string
  refId: string
  kind: RunKind
  lives: number | null
  maxLives: number | null
  answered: number
  correct: number
  correctAtDifficulty: number
  hintsUsed: number
  errorsByConcept: Record<string, number>
  /** Concepts where an error was later followed by an independent correct answer. */
  comebacks: string[]
  gradedInstanceIds: string[]
  /** Recent outcomes in this run (most recent last), used by adaptive selection. */
  recent: { conceptId: string; correct: boolean }[]
  status: 'active' | 'complete' | 'failed'
  startedAt: number
}

export interface Outcome {
  instanceId: string
  conceptId: string
  difficulty: Difficulty
  correct: boolean
  hintsUsed: number
}

export function startRun(runId: string, refId: string, rules: RunRules, now = Date.now()): RunState {
  return {
    runId,
    refId,
    kind: rules.kind,
    lives: rules.lives,
    maxLives: rules.lives,
    answered: 0,
    correct: 0,
    correctAtDifficulty: 0,
    hintsUsed: 0,
    errorsByConcept: {},
    comebacks: [],
    gradedInstanceIds: [],
    recent: [],
    status: 'active',
    startedAt: now,
  }
}

export function isGoalMet(state: RunState, goal: MissionGoal): boolean {
  if (state.correct < goal.correct) return false
  if (goal.atDifficulty && state.correctAtDifficulty < goal.atDifficulty.count) return false
  return true
}

export type ApplyResult = { state: RunState; accepted: boolean; reason?: 'duplicate' | 'inactive' }

/**
 * Apply one graded outcome. Duplicate submissions for the same instance and
 * submissions after the run has ended are rejected — rewards and progress can
 * only come from new, graded answers.
 */
export function applyOutcome(state: RunState, rules: RunRules, outcome: Outcome): ApplyResult {
  if (state.status !== 'active') return { state, accepted: false, reason: 'inactive' }
  if (state.gradedInstanceIds.includes(outcome.instanceId)) return { state, accepted: false, reason: 'duplicate' }
  const s: RunState = {
    ...state,
    errorsByConcept: { ...state.errorsByConcept },
    comebacks: [...state.comebacks],
    gradedInstanceIds: [...state.gradedInstanceIds, outcome.instanceId].slice(-200),
    answered: state.answered + 1,
    hintsUsed: state.hintsUsed + outcome.hintsUsed,
    recent: [...state.recent, { conceptId: outcome.conceptId, correct: outcome.correct }].slice(-10),
  }
  if (outcome.correct) {
    s.correct += 1
    const threshold = rules.goal.atDifficulty?.difficulty
    if (threshold !== undefined && outcome.difficulty >= threshold) s.correctAtDifficulty += 1
    if ((s.errorsByConcept[outcome.conceptId] ?? 0) > 0 && outcome.hintsUsed === 0 && !s.comebacks.includes(outcome.conceptId)) {
      s.comebacks.push(outcome.conceptId)
    }
    if (isGoalMet(s, rules.goal)) s.status = 'complete'
  } else {
    s.errorsByConcept[outcome.conceptId] = (s.errorsByConcept[outcome.conceptId] ?? 0) + 1
    if (s.lives !== null) {
      s.lives = Math.max(0, s.lives - 1)
      if (s.lives === 0) s.status = 'failed'
    }
  }
  return { state: s, accepted: true }
}

/** Concepts to target in practice after a failed run, most errors first. */
export function conceptsToPractise(state: RunState): string[] {
  return Object.entries(state.errorsByConcept)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
}

export const PRACTICE_GOAL: MissionGoal = { correct: 3 }
