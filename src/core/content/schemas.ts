import { z } from 'zod'
import { QUESTION_TYPES, REVIEW_STATUSES } from './types'
import type { AnswerKey, AnswerKeyBody, PartKey, PartView, QuestionBody, QuestionView, TemplateMeta } from './types'

const nonEmpty = z.string().trim().min(1)
const choice = z.object({ id: nonEmpty, text: nonEmpty })

const mcqPartView = z.object({ kind: z.literal('mcq'), prompt: z.string().optional(), choices: z.array(choice).min(2).max(6) })
const numericPartView = z.object({
  kind: z.literal('numeric'),
  prompt: z.string().optional(),
  unit: z.string().optional(),
  placeholder: z.string().optional(),
})
const textPartView = z.object({
  kind: z.literal('text'),
  prompt: z.string().optional(),
  mode: z.enum(['fill', 'correction', 'short']),
  placeholder: z.string().optional(),
})
const partView = z.discriminatedUnion('kind', [mcqPartView, numericPartView, textPartView])

export const questionViewSchema = z.object({
  context: z.string().optional(),
  prompt: nonEmpty,
  passage: z.object({ title: nonEmpty, text: nonEmpty }).optional(),
  body: z.discriminatedUnion('kind', [
    mcqPartView,
    numericPartView,
    textPartView,
    z.object({ kind: z.literal('match'), left: z.array(choice).min(2), right: z.array(choice).min(2) }),
    z.object({ kind: z.literal('order'), tokens: z.array(choice).min(2) }),
    z.object({
      kind: z.literal('label'),
      diagram: z.enum(['plant-cell', 'animal-cell']),
      markers: z.array(z.object({ id: nonEmpty, number: z.number().int().positive(), position: nonEmpty })).min(1),
      options: z.array(choice).min(2),
    }),
    z.object({ kind: z.literal('multi'), parts: z.array(partView).min(2).max(4) }),
  ]),
})

const misconception = z.object({ misconceptionId: nonEmpty, feedback: nonEmpty })
const mcqPartKey = z.object({
  kind: z.literal('mcq'),
  correctId: nonEmpty,
  distractors: z.record(z.string(), misconception).optional(),
})
const numericPartKey = z.object({
  kind: z.literal('numeric'),
  value: z.number().finite(),
  tolerance: z.number().nonnegative().optional(),
  units: z.array(z.string()).optional(),
  misconceptions: z.array(misconception.extend({ value: z.number().finite() })).optional(),
})
const textPartKey = z.object({
  kind: z.literal('text'),
  accepted: z.array(nonEmpty).min(1),
  caseSensitive: z.boolean().optional(),
  misconceptions: z.array(misconception.extend({ values: z.array(nonEmpty).min(1) })).optional(),
})
const partKey = z.discriminatedUnion('kind', [mcqPartKey, numericPartKey, textPartKey])

export const answerKeySchema = z.object({
  answerDisplay: nonEmpty,
  explanation: nonEmpty,
  body: z.discriminatedUnion('kind', [
    mcqPartKey,
    numericPartKey,
    textPartKey,
    z.object({ kind: z.literal('match'), pairs: z.record(z.string(), z.string()) }),
    z.object({ kind: z.literal('order'), accepted: z.array(z.array(nonEmpty).min(2)).min(1) }),
    z.object({ kind: z.literal('label'), pairs: z.record(z.string(), z.string()) }),
    z.object({ kind: z.literal('multi'), parts: z.array(partKey).min(2).max(4) }),
  ]),
})

export const templateMetaSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9.-]+$/, 'Template ids use lowercase letters, digits, dots and dashes'),
  version: z.number().int().positive(),
  grade: z.literal(8),
  subject: z.enum(['english', 'mathematics', 'science']),
  chapterId: nonEmpty,
  conceptId: nonEmpty,
  objective: nonEmpty,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  type: z.enum(QUESTION_TYPES),
  title: nonEmpty,
  review: z.object({
    status: z.enum(REVIEW_STATUSES),
    reviewedBy: z.string().optional(),
    reviewedOn: z.string().optional(),
    notes: z.string().optional(),
  }),
  curriculum: z.object({
    alignment: z.enum(['unverified-illustrative', 'verified']),
    source: z.string().optional(),
    note: z.string().optional(),
  }),
  assessment: z.object({ eligible: z.boolean(), transfer: z.boolean().optional() }).optional(),
})

export function validateTemplateMeta(meta: TemplateMeta): string[] {
  const result = templateMetaSchema.safeParse(meta)
  if (result.success) {
    if (meta.curriculum.alignment === 'verified' && !meta.curriculum.source) {
      return ['Verified curriculum alignment requires a source reference']
    }
    return []
  }
  return result.error.issues.map((i) => `${i.path.join('.') || 'template'}: ${i.message}`)
}

// ---------------------------------------------------------------------------
// Semantic validation of generated instances (beyond structural shape)
// ---------------------------------------------------------------------------

function unique(values: string[]): boolean {
  return new Set(values).size === values.length
}

function checkPart(view: PartView, key: PartKey, where: string): string[] {
  const errors: string[] = []
  if (view.kind !== key.kind) return [`${where}: view kind ${view.kind} does not match key kind ${key.kind}`]
  if (view.kind === 'mcq' && key.kind === 'mcq') {
    const ids = view.choices.map((c) => c.id)
    if (!unique(ids)) errors.push(`${where}: duplicate choice ids`)
    if (!unique(view.choices.map((c) => c.text.trim().toLowerCase()))) errors.push(`${where}: duplicate choice texts`)
    if (!ids.includes(key.correctId)) errors.push(`${where}: correct choice is not among the choices`)
    for (const d of Object.keys(key.distractors ?? {})) {
      if (!ids.includes(d)) errors.push(`${where}: distractor ${d} is not a choice`)
      if (d === key.correctId) errors.push(`${where}: correct choice is also marked as a distractor`)
    }
  }
  if (key.kind === 'numeric') {
    if (!Number.isFinite(key.value)) errors.push(`${where}: numeric answer is not finite`)
    for (const m of key.misconceptions ?? []) {
      if (Math.abs(m.value - key.value) <= (key.tolerance ?? 1e-9)) {
        errors.push(`${where}: a misconception value equals the correct answer`)
      }
    }
  }
  return errors
}

function checkBody(body: QuestionBody, key: AnswerKeyBody): string[] {
  if (body.kind !== key.kind) return [`view kind ${body.kind} does not match key kind ${key.kind}`]
  switch (body.kind) {
    case 'mcq':
    case 'numeric':
    case 'text':
      return checkPart(body, key as PartKey, 'question')
    case 'match':
    case 'label': {
      const k = key as { pairs: Record<string, string> }
      const leftIds = body.kind === 'match' ? body.left.map((l) => l.id) : body.markers.map((m) => m.id)
      const rightIds = body.kind === 'match' ? body.right.map((r) => r.id) : body.options.map((o) => o.id)
      const errors: string[] = []
      if (!unique(leftIds) || !unique(rightIds)) errors.push('duplicate ids in matching lists')
      if (body.kind === 'label' && !unique(body.markers.map((m) => String(m.number)))) errors.push('duplicate marker numbers')
      for (const id of leftIds) {
        if (!(id in k.pairs)) errors.push(`no answer for ${id}`)
        else if (!rightIds.includes(k.pairs[id])) errors.push(`answer for ${id} is not an option`)
      }
      if (!unique(Object.values(k.pairs))) errors.push('two items share the same answer')
      return errors
    }
    case 'order': {
      const k = key as { accepted: string[][] }
      const tokens = body.tokens.map((t) => t.text).sort()
      const errors: string[] = []
      if (!unique(body.tokens.map((t) => t.id))) errors.push('duplicate token ids')
      for (const seq of k.accepted) {
        if ([...seq].sort().join('\u0000') !== tokens.join('\u0000')) errors.push('an accepted order does not use exactly the given tokens')
      }
      return errors
    }
    case 'multi': {
      const k = key as { parts: PartKey[] }
      if (body.parts.length !== k.parts.length) return ['multi-part view and key have different part counts']
      return body.parts.flatMap((p, i) => checkPart(p, k.parts[i], `part ${i + 1}`))
    }
  }
}

/** Structural and semantic validation of a generated question. Empty array = valid. */
export function validateInstance(view: QuestionView, key: AnswerKey, hints: string[]): string[] {
  const errors: string[] = []
  const v = questionViewSchema.safeParse(view)
  if (!v.success) errors.push(...v.error.issues.map((i) => `view.${i.path.join('.')}: ${i.message}`))
  const k = answerKeySchema.safeParse(key)
  if (!k.success) errors.push(...k.error.issues.map((i) => `key.${i.path.join('.')}: ${i.message}`))
  if (errors.length) return errors
  if (hints.length === 0) errors.push('at least one hint is required')
  errors.push(...checkBody(view.body, key.body))
  return errors
}
