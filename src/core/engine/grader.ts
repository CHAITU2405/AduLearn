import type { AnswerKey, PartKey, PartResponse, QuestionResponse } from '../content/types'

export interface GradeResult {
  correct: boolean
  /** Fraction of parts/pairs correct (1 for a fully correct answer). */
  score: number
  misconceptionId?: string
  feedback?: string
  answerDisplay: string
  explanation: string
  /** Short, non-identifying description of the student's response, for history. */
  responseSummary: string
}

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

const SMART_CHARS: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '−': '-',
  '–': '-',
  '—': '-',
}

export function normaliseText(input: string, caseSensitive = false): string {
  let s = input.replace(/[‘’“”−–—]/g, (c) => SMART_CHARS[c] ?? c)
  s = s.trim().replace(/\s+/g, ' ')
  // Trailing sentence punctuation and spaces before punctuation are not meaningful here.
  s = s.replace(/\s+([.,!?;:])/g, '$1').replace(/[.!?]+$/, '')
  return caseSensitive ? s : s.toLowerCase()
}

/**
 * Parse a numeric response. Accepts "12", "-3", "2.5", "5/2", "x = 7",
 * "1,200", and an optional trailing unit from `units`.
 * Returns null when the response is not a number.
 */
export function parseNumber(raw: string, units: string[] = []): number | null {
  let s = raw.replace(/[−–—]/g, '-').trim().toLowerCase()
  s = s.replace(/^[a-z]\s*=\s*/, '') // "x = 7"
  const unitList = [...units].sort((a, b) => b.length - a.length)
  for (const u of unitList) {
    const lu = u.toLowerCase()
    if (s.endsWith(lu)) {
      s = s.slice(0, -lu.length).trim()
      break
    }
  }
  s = s.replace(/(\d),(?=\d{3}\b)/g, '$1').replace(/\s+/g, '')
  if (/^[-+]?\d+(\.\d+)?$/.test(s) || /^[-+]?\.\d+$/.test(s)) return Number(s)
  const frac = /^([-+]?\d+)\/(\d+)$/.exec(s)
  if (frac) {
    const den = Number(frac[2])
    return den === 0 ? null : Number(frac[1]) / den
  }
  return null
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000)
}

// ---------------------------------------------------------------------------
// Part grading
// ---------------------------------------------------------------------------

interface PartGrade {
  correct: boolean
  misconceptionId?: string
  feedback?: string
  summary: string
}

function gradePart(key: PartKey, response: PartResponse): PartGrade {
  if (key.kind !== response.kind) return { correct: false, summary: '(no answer)' }
  switch (key.kind) {
    case 'mcq': {
      const choiceId = (response as Extract<PartResponse, { kind: 'mcq' }>).choiceId
      if (!choiceId) return { correct: false, summary: '(no choice)' }
      const d = key.distractors?.[choiceId]
      return { correct: choiceId === key.correctId, misconceptionId: d?.misconceptionId, feedback: d?.feedback, summary: `choice ${choiceId}` }
    }
    case 'numeric': {
      const raw = (response as Extract<PartResponse, { kind: 'numeric' }>).value
      const value = parseNumber(raw, key.units)
      if (value === null) {
        return { correct: false, feedback: 'Your answer needs to be a number, like 12 or 2.5.', summary: raw.slice(0, 40) || '(blank)' }
      }
      const tol = key.tolerance ?? 1e-9
      if (Math.abs(value - key.value) <= tol) return { correct: true, summary: formatNumber(value) }
      const m = key.misconceptions?.find((mc) => Math.abs(mc.value - value) <= tol)
      return { correct: false, misconceptionId: m?.misconceptionId, feedback: m?.feedback, summary: formatNumber(value) }
    }
    case 'text': {
      const raw = (response as Extract<PartResponse, { kind: 'text' }>).value
      const given = normaliseText(raw, key.caseSensitive)
      if (!given) return { correct: false, summary: '(blank)' }
      if (key.accepted.some((a) => normaliseText(a, key.caseSensitive) === given)) return { correct: true, summary: given.slice(0, 80) }
      const m = key.misconceptions?.find((mc) => mc.values.some((v) => normaliseText(v, key.caseSensitive) === given))
      return { correct: false, misconceptionId: m?.misconceptionId, feedback: m?.feedback, summary: given.slice(0, 80) }
    }
  }
}

/** Deterministically grade a response against an answer key. */
export function grade(key: AnswerKey, response: QuestionResponse): GradeResult {
  const base = { answerDisplay: key.answerDisplay, explanation: key.explanation }
  const body = key.body
  switch (body.kind) {
    case 'mcq':
    case 'numeric':
    case 'text': {
      const g = gradePart(body, response as PartResponse)
      return { ...base, correct: g.correct, score: g.correct ? 1 : 0, misconceptionId: g.misconceptionId, feedback: g.feedback, responseSummary: g.summary }
    }
    case 'match':
    case 'label': {
      const pairs = response.kind === body.kind ? response.pairs : {}
      const entries = Object.entries(body.pairs)
      const right = entries.filter(([l, r]) => pairs[l] === r).length
      const correct = right === entries.length
      return {
        ...base,
        correct,
        score: entries.length ? right / entries.length : 0,
        feedback: correct ? undefined : `${right} of ${entries.length} matched correctly.`,
        responseSummary: `${right}/${entries.length} pairs`,
      }
    }
    case 'order': {
      // The view tokens are not available here, so the service passes token texts.
      const texts = response.kind === 'order' ? response.tokenIds : []
      const given = normaliseText(texts.join(' '))
      const correct = body.accepted.some((seq) => normaliseText(seq.join(' ')) === given)
      return { ...base, correct, score: correct ? 1 : 0, responseSummary: given.slice(0, 80) || '(blank)' }
    }
    case 'multi': {
      const parts = response.kind === 'multi' ? response.parts : []
      const grades = body.parts.map((k, i) => gradePart(k, parts[i] ?? ({ kind: k.kind, value: '', choiceId: null } as PartResponse)))
      const right = grades.filter((g) => g.correct).length
      const firstWrong = grades.find((g) => !g.correct)
      return {
        ...base,
        correct: right === grades.length,
        score: right / grades.length,
        misconceptionId: firstWrong?.misconceptionId,
        feedback: right === grades.length ? undefined : [firstWrong?.feedback, `${right} of ${grades.length} steps correct.`].filter(Boolean).join(' '),
        responseSummary: grades.map((g, i) => `step ${i + 1}: ${g.correct ? 'correct' : 'incorrect'}`).join(', '),
      }
    }
  }
}

/** Is a response complete enough to submit? (Prevents accidental empty submissions.) */
export function isResponseComplete(response: QuestionResponse | null, expected: { parts?: number; pairs?: number; tokens?: number }): boolean {
  if (!response) return false
  switch (response.kind) {
    case 'mcq':
      return !!response.choiceId
    case 'numeric':
    case 'text':
      return response.value.trim().length > 0
    case 'match':
    case 'label':
      return Object.values(response.pairs).filter(Boolean).length === (expected.pairs ?? 0)
    case 'order':
      return response.tokenIds.length === (expected.tokens ?? 0)
    case 'multi':
      return response.parts.length === (expected.parts ?? 0) && response.parts.every((p) => isResponseComplete(p, {}))
  }
}
