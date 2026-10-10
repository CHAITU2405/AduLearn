import { validateInstance } from '../content/schemas'
import type { AnswerKey, Difficulty, PartKey, QuestionTemplate, QuestionType, QuestionView, SubjectId, VarSpecs, Vars } from '../content/types'
import { createRng, hashString, randomSeed, stableStringify, type Rng } from './rng'

/** What the UI receives. Deliberately contains no answer key. */
export interface GeneratedQuestion {
  instanceId: string
  templateId: string
  templateVersion: number
  subject: SubjectId
  chapterId: string
  conceptId: string
  difficulty: Difficulty
  type: QuestionType
  seed: number
  fingerprint: string
  view: QuestionView
  hints: string[]
}

export interface GenerationResult {
  question: GeneratedQuestion
  key: AnswerKey
}

export function sampleVars(specs: VarSpecs, rng: Rng): Vars {
  const out: Vars = {}
  for (const [name, spec] of Object.entries(specs)) {
    if (spec.kind === 'int') {
      const step = spec.step ?? 1
      const steps = Math.floor((spec.max - spec.min) / step)
      let value = spec.min + rng.int(0, steps) * step
      // Bounded retry for excluded values; the constraint check catches anything left.
      for (let i = 0; i < 10 && spec.exclude?.includes(value); i++) value = spec.min + rng.int(0, steps) * step
      out[name] = value
    } else {
      out[name] = rng.pick(spec.values)
    }
  }
  return out
}

export function fingerprintOf(template: Pick<QuestionTemplate, 'id' | 'version'>, vars: Vars): string {
  return `${template.id}@${template.version}:${hashString(stableStringify(vars))}`
}

export type InstanceCheck = { ok: true; vars: Vars; fingerprint: string; view: QuestionView; key: AnswerKey; hints: string[] } | { ok: false; reason: string }

/** Build one instance from a seed and validate it. Deterministic for a given seed. */
export function buildFromSeed(template: QuestionTemplate, seed: number): InstanceCheck {
  const rng = createRng(seed)
  const vars = sampleVars(template.variables, rng)
  for (const [name, spec] of Object.entries(template.variables)) {
    if (spec.kind === 'int') {
      const v = vars[name] as number
      if (v < spec.min || v > spec.max || spec.exclude?.includes(v)) return { ok: false, reason: `constraint: ${name} out of range` }
    }
  }
  const reason = template.constraint?.(vars) ?? null
  if (reason) return { ok: false, reason: `constraint: ${reason}` }
  let built
  try {
    built = template.build(vars, rng)
  } catch (err) {
    return { ok: false, reason: `build failed: ${(err as Error).message}` }
  }
  pruneCollidingMisconceptions(built.key)
  const errors = validateInstance(built.view, built.key, built.hints)
  if (errors.length) return { ok: false, reason: errors.join('; ') }
  return { ok: true, vars, fingerprint: fingerprintOf(template, vars), ...built }
}

/**
 * A numeric misconception whose value happens to equal the correct answer for
 * this particular instance (e.g. F × A = F ÷ A when A = 1) cannot diagnose
 * anything, so it is dropped rather than discarding the whole instance.
 */
function pruneCollidingMisconceptions(key: AnswerKey): void {
  const prune = (part: PartKey) => {
    if (part.kind !== 'numeric' || !part.misconceptions) return
    const tol = part.tolerance ?? 1e-9
    part.misconceptions = part.misconceptions.filter((m) => Math.abs(m.value - part.value) > tol)
  }
  if (key.body.kind === 'multi') key.body.parts.forEach(prune)
  else if (key.body.kind === 'numeric') prune(key.body)
}

let instanceCounter = 0

export interface GenerateOptions {
  /** Fixed seed (review mode). When given, exclusion is ignored. */
  seed?: number
  /** Variant fingerprints to avoid (recent history). */
  exclude?: ReadonlySet<string>
  maxTries?: number
  seedSource?: () => number
}

/**
 * Generate a validated instance. Invalid instances are rejected and retried
 * with a new seed. If every non-excluded attempt fails, a recently seen
 * (but valid) variant is used rather than showing nothing.
 */
export function generateQuestion(template: QuestionTemplate, opts: GenerateOptions = {}): GenerationResult | null {
  const nextSeed = opts.seedSource ?? randomSeed
  const tries = opts.seed !== undefined ? 1 : (opts.maxTries ?? 40)
  let fallback: { seed: number; check: Extract<InstanceCheck, { ok: true }> } | null = null
  for (let i = 0; i < tries; i++) {
    const seed = opts.seed ?? nextSeed()
    const check = buildFromSeed(template, seed)
    if (!check.ok) continue
    if (opts.seed === undefined && opts.exclude?.has(check.fingerprint)) {
      fallback ??= { seed, check }
      continue
    }
    return toResult(template, seed, check)
  }
  return fallback ? toResult(template, fallback.seed, fallback.check) : null
}

function toResult(template: QuestionTemplate, seed: number, check: Extract<InstanceCheck, { ok: true }>): GenerationResult {
  instanceCounter += 1
  return {
    question: {
      instanceId: `q${Date.now().toString(36)}${instanceCounter.toString(36)}`,
      templateId: template.id,
      templateVersion: template.version,
      subject: template.subject,
      chapterId: template.chapterId,
      conceptId: template.conceptId,
      difficulty: template.difficulty,
      type: template.type,
      seed,
      fingerprint: check.fingerprint,
      view: check.view,
      hints: check.hints,
    },
    key: check.key,
  }
}

/**
 * Exhaustively probe a template with many seeds. Used by tests and the
 * content review screen to prove a generator produces valid, varied output.
 */
export function probeTemplate(template: QuestionTemplate, samples = 200, startSeed = 1) {
  const fingerprints = new Set<string>()
  const failures: string[] = []
  let valid = 0
  for (let s = startSeed; s < startSeed + samples; s++) {
    const check = buildFromSeed(template, s)
    if (check.ok) {
      valid++
      fingerprints.add(check.fingerprint)
    } else if (!check.reason.includes('constraint:')) {
      failures.push(check.reason)
    }
  }
  return { valid, distinct: fingerprints.size, failures, samples }
}
