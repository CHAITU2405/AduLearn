import type { Difficulty } from '../content/types'

/**
 * Transparent, rule-based mastery estimate for one concept.
 *
 * `estimate` is a number in [0, 1]. It is an *estimate* built from the
 * evidence below — not a validated measure of ability — and it can always be
 * revised by new evidence.
 */
export interface MasteryState {
  conceptId: string
  estimate: number
  /** Number of graded responses that contributed evidence. */
  evidence: number
  /** Current working difficulty for adaptive selection. */
  level: Difficulty
  streakCorrect: number
  streakIncorrect: number
  /** Distinct variant fingerprints answered correctly without hints (most recent first, capped). */
  independentVariants: string[]
  /** Misconception id -> number of times observed. */
  misconceptions: Record<string, number>
  /** Misconception ids that were later followed by an independent correct answer. */
  correctedMisconceptions: string[]
  updatedAt: number
}

export type EvidenceContext = 'mission' | 'practice' | 'review' | 'boss' | 'diagnostic' | 'followup'

export interface Evidence {
  correct: boolean
  /** Partial-credit score in [0, 1] for multi-step questions. */
  score?: number
  difficulty: Difficulty
  hintsUsed: number
  context: EvidenceContext
  fingerprint: string
  /** False when this exact variant was already answered before (e.g. review mode). */
  isNewVariant: boolean
  misconceptionId?: string
  at?: number
}

export const MASTERY_RULES = {
  /** Gain per correct answer, scaled by difficulty weight. */
  baseGain: 0.3,
  /** A correct answer after using hints still counts, at a reduced rate. */
  hintedGainFactor: 0.45,
  /** Re-answering a variant you have already seen counts for less. */
  repeatVariantFactor: 0.5,
  /** Cumulative checks (bosses, assessments) count for a little more. */
  cumulativeFactor: 1.2,
  baseLoss: 0.22,
  difficultyWeight: { 1: 0.7, 2: 0.85, 3: 1 } as Record<Difficulty, number>,
  /** Consecutive independent correct answers needed to step difficulty up. */
  levelUpStreak: 2,
  /** Consecutive incorrect answers that step difficulty down. */
  levelDownStreak: 2,
  secure: { estimate: 0.75, minEvidence: 5, minIndependentVariants: 3 },
} as const

export function initialMastery(conceptId: string, now = Date.now()): MasteryState {
  return {
    conceptId,
    estimate: 0,
    evidence: 0,
    level: 1,
    streakCorrect: 0,
    streakIncorrect: 0,
    independentVariants: [],
    misconceptions: {},
    correctedMisconceptions: [],
    updatedAt: now,
  }
}

export interface MasteryUpdate {
  state: MasteryState
  /** Plain-language notes describing what changed and why. */
  notes: string[]
  levelChanged: 'up' | 'down' | null
  correctedMisconception?: string
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export function updateMastery(prev: MasteryState, ev: Evidence): MasteryUpdate {
  const R = MASTERY_RULES
  const s: MasteryState = {
    ...prev,
    independentVariants: [...prev.independentVariants],
    misconceptions: { ...prev.misconceptions },
    correctedMisconceptions: [...prev.correctedMisconceptions],
  }
  const notes: string[] = []
  const w = R.difficultyWeight[ev.difficulty]
  const cumulative = ev.context === 'boss' || ev.context === 'diagnostic' || ev.context === 'followup'
  let levelChanged: MasteryUpdate['levelChanged'] = null
  let correctedMisconception: string | undefined

  s.evidence += 1
  if (ev.correct) {
    let gain = R.baseGain * w
    if (ev.hintsUsed > 0) {
      gain *= R.hintedGainFactor
      notes.push('Correct with a hint: counts as progress, at a reduced rate.')
    }
    if (!ev.isNewVariant) {
      gain *= R.repeatVariantFactor
      notes.push('Repeated variant: counts for less than a fresh question.')
    }
    if (cumulative) gain *= R.cumulativeFactor
    s.estimate = clamp01(s.estimate + (1 - s.estimate) * gain)
    s.streakIncorrect = 0
    if (ev.hintsUsed === 0) {
      s.streakCorrect += 1
      if (ev.isNewVariant && !s.independentVariants.includes(ev.fingerprint)) {
        s.independentVariants = [ev.fingerprint, ...s.independentVariants].slice(0, 12)
      }
      // A misconception counts as corrected once the student answers independently afterwards.
      const open = Object.keys(s.misconceptions).filter((m) => !s.correctedMisconceptions.includes(m))
      if (open.length) {
        correctedMisconception = open[0]
        s.correctedMisconceptions.push(open[0])
        notes.push('Answered independently after an earlier misconception.')
      }
    }
    if (s.streakCorrect >= R.levelUpStreak && s.level < 3) {
      s.level = (s.level + 1) as Difficulty
      s.streakCorrect = 0
      levelChanged = 'up'
      notes.push(`Two independent correct answers in a row: difficulty raised to level ${s.level}.`)
    }
  } else {
    const partial = ev.score ?? 0
    const loss = R.baseLoss * (1 - partial * 0.5) * (cumulative ? R.cumulativeFactor : 1)
    s.estimate = clamp01(s.estimate - s.estimate * loss)
    s.streakCorrect = 0
    s.streakIncorrect += 1
    if (ev.misconceptionId) {
      s.misconceptions[ev.misconceptionId] = (s.misconceptions[ev.misconceptionId] ?? 0) + 1
      s.correctedMisconceptions = s.correctedMisconceptions.filter((m) => m !== ev.misconceptionId)
    }
    if (s.streakIncorrect >= R.levelDownStreak && s.level > 1) {
      s.level = (s.level - 1) as Difficulty
      s.streakIncorrect = 0
      levelChanged = 'down'
      notes.push(`Two incorrect answers in a row: difficulty eased to level ${s.level} for now.`)
    }
  }
  s.updatedAt = ev.at ?? Date.now()
  return { state: s, notes, levelChanged, correctedMisconception }
}

export type MasteryBand = 'not-started' | 'exploring' | 'developing' | 'secure'

export function masteryBand(s: MasteryState | undefined): MasteryBand {
  if (!s || s.evidence === 0) return 'not-started'
  const R = MASTERY_RULES.secure
  if (s.estimate >= R.estimate && s.evidence >= R.minEvidence && s.independentVariants.length >= R.minIndependentVariants) {
    return 'secure'
  }
  if (s.estimate >= 0.4) return 'developing'
  return 'exploring'
}

export const BAND_LABELS: Record<MasteryBand, string> = {
  'not-started': 'Not started',
  exploring: 'Exploring',
  developing: 'Developing',
  secure: 'Secure (estimate)',
}

/** Explain a band in plain language, for students and teachers. */
export function explainMastery(s: MasteryState | undefined): string {
  const band = masteryBand(s)
  if (!s || band === 'not-started') return 'No answers recorded for this concept yet.'
  const parts = [`Based on ${s.evidence} answer${s.evidence === 1 ? '' : 's'}`]
  parts.push(`${s.independentVariants.length} different question${s.independentVariants.length === 1 ? '' : 's'} solved without hints`)
  if (band !== 'secure' && s.estimate >= MASTERY_RULES.secure.estimate) {
    parts.push('more independent success on new variants is needed before this is marked secure')
  }
  return `${parts.join(', ')}.`
}

/** Concepts that may need reteaching: enough evidence and still low, or a repeated misconception. */
export function needsReteaching(s: MasteryState): { flag: boolean; reason?: string } {
  const repeated = Object.entries(s.misconceptions).find(([m, n]) => n >= 2 && !s.correctedMisconceptions.includes(m))
  if (repeated) return { flag: true, reason: `Repeated misconception: ${repeated[0]}` }
  if (s.evidence >= 4 && s.estimate < 0.35) return { flag: true, reason: 'Low estimate after several attempts' }
  return { flag: false }
}
