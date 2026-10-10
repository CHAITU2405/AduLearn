import type { AnswerKey, PartKey, PartResponse, PartView, QuestionResponse, QuestionView } from '../content/types'

/**
 * Build a correct response from an answer key. Used by unit tests and by the
 * e2e build's test hook only (never wired into the production UI).
 */
export function correctResponseFor(view: QuestionView, key: AnswerKey): QuestionResponse {
  const part = (k: PartKey): PartResponse => {
    switch (k.kind) {
      case 'mcq':
        return { kind: 'mcq', choiceId: k.correctId }
      case 'numeric':
        return { kind: 'numeric', value: String(k.value) }
      case 'text':
        return { kind: 'text', value: k.accepted[0] }
    }
  }
  const b = key.body
  switch (b.kind) {
    case 'mcq':
    case 'numeric':
    case 'text':
      return part(b)
    case 'match':
      return { kind: 'match', pairs: { ...b.pairs } }
    case 'label':
      return { kind: 'label', pairs: { ...b.pairs } }
    case 'multi':
      return { kind: 'multi', parts: b.parts.map(part) }
    case 'order': {
      const tokens = view.body.kind === 'order' ? [...view.body.tokens] : []
      const ids = b.accepted[0].map((text) => {
        const i = tokens.findIndex((t) => t.text === text)
        return i >= 0 ? tokens.splice(i, 1)[0].id : ''
      })
      return { kind: 'order', tokenIds: ids }
    }
  }
}

/** A response that is definitely wrong (for tests). */
export function wrongResponseFor(view: QuestionView, key: AnswerKey): QuestionResponse {
  const wrongPart = (v: PartView, k: PartKey): PartResponse => {
    if (k.kind === 'mcq' && v.kind === 'mcq') return { kind: 'mcq', choiceId: v.choices.find((c) => c.id !== k.correctId)!.id }
    if (k.kind === 'numeric') return { kind: 'numeric', value: String(k.value + 1000) }
    return { kind: 'text', value: 'zzzz' }
  }
  const b = key.body
  const vb = view.body
  if ((b.kind === 'mcq' || b.kind === 'numeric' || b.kind === 'text') && (vb.kind === 'mcq' || vb.kind === 'numeric' || vb.kind === 'text')) return wrongPart(vb, b)
  if (b.kind === 'multi' && vb.kind === 'multi') return { kind: 'multi', parts: b.parts.map((k, i) => wrongPart(vb.parts[i], k)) }
  if (b.kind === 'match') return { kind: 'match', pairs: Object.fromEntries(Object.keys(b.pairs).map((l) => [l, 'none'])) }
  if (b.kind === 'label') return { kind: 'label', pairs: Object.fromEntries(Object.keys(b.pairs).map((l) => [l, 'none'])) }
  const correct = correctResponseFor(view, key) as { kind: 'order'; tokenIds: string[] }
  return { kind: 'order', tokenIds: [...correct.tokenIds].reverse() }
}
