import type { Rng } from '../engine/rng'
import type { Choice, ChoiceSpec, CurriculumRef, IntSpec, McqPartKey, McqPartView, MisconceptionHint, QuestionTemplate, ReviewMeta, TemplateDef, VarSpecs } from './types'

export function defineTemplate<const S extends VarSpecs>(def: TemplateDef<S>): QuestionTemplate {
  return def as unknown as QuestionTemplate
}

export function int(min: number, max: number, opts: { step?: number; exclude?: readonly number[] } = {}): IntSpec {
  return { kind: 'int', min, max, ...opts }
}

export function choice<const T>(values: readonly T[]): ChoiceSpec<T> {
  return { kind: 'choice', values }
}

/** Standard metadata for the bundled illustrative sample content. */
export const ILLUSTRATIVE: CurriculumRef = {
  alignment: 'unverified-illustrative',
  note: 'Illustrative Class 8 sample written for the AduLearn prototype. Not yet checked against the official AP SSC Class 8 textbook.',
}

export const PROTOTYPE_APPROVED: ReviewMeta = {
  status: 'approved',
  reviewedBy: 'Team Spidey content check (prototype)',
  reviewedOn: '2026-10-10',
  notes: 'Checked for correctness and age-appropriateness for the prototype demo. Requires teacher review against the official textbook before classroom use.',
}

export const PENDING: ReviewMeta = {
  status: 'pending-review',
  notes: 'Drafted for the prototype; awaiting teacher review. Not shown to students until approved.',
}

export const DRAFT: ReviewMeta = {
  status: 'draft',
  notes: 'Work in progress. Not shown to students.',
}

export interface McqOption {
  text: string
  correct?: boolean
  misconception?: MisconceptionHint
}

/**
 * Build a multiple-choice part from options, shuffling with the template rng
 * and assigning opaque ids so the correct answer is not guessable from ids.
 */
export function buildMcq(rng: Rng, options: McqOption[], prompt?: string): { view: McqPartView; key: McqPartKey } {
  const shuffled = rng.shuffle(options)
  const ids = rng.shuffle(['c1', 'c2', 'c3', 'c4', 'c5', 'c6']).slice(0, shuffled.length)
  const choices: Choice[] = shuffled.map((o, i) => ({ id: ids[i], text: o.text }))
  const correctIndex = shuffled.findIndex((o) => o.correct)
  const distractors: Record<string, MisconceptionHint> = {}
  shuffled.forEach((o, i) => {
    if (!o.correct && o.misconception) distractors[ids[i]] = o.misconception
  })
  return {
    view: { kind: 'mcq', prompt, choices },
    key: { kind: 'mcq', correctId: correctIndex >= 0 ? ids[correctIndex] : '', distractors },
  }
}

/** Format a signed term for equations, e.g. (+, 5) => "+ 5", (-, 5) => "− 5". */
export function signed(n: number): string {
  return n < 0 ? `− ${Math.abs(n)}` : `+ ${n}`
}
