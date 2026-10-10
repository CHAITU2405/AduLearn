import type { AnswerKey, QuestionResponse, QuestionView } from '../content/types'
import type { GenerationResult } from './generator'
import { grade, type GradeResult } from './grader'
import { correctResponseFor } from './testing'

export type VaultGrade = { status: 'graded'; result: GradeResult } | { status: 'already-graded' } | { status: 'unknown-question' }

/**
 * Holds answer keys for active questions outside of UI state.
 *
 * Each key can be used exactly once: grading removes it, so a double click or
 * a replayed submission for the same instance is rejected instead of being
 * counted twice. Note: in a browser-only app this is a separation of concerns,
 * not a security boundary — a determined user with dev tools can still read
 * memory. See docs/ARCHITECTURE.md.
 */
export class AnswerVault {
  private keys = new Map<string, { key: AnswerKey; view: QuestionView }>()
  private graded = new Set<string>()

  register(result: GenerationResult): void {
    this.keys.set(result.question.instanceId, { key: result.key, view: result.question.view })
  }

  has(instanceId: string): boolean {
    return this.keys.has(instanceId)
  }

  grade(instanceId: string, response: QuestionResponse): VaultGrade {
    if (this.graded.has(instanceId)) return { status: 'already-graded' }
    const entry = this.keys.get(instanceId)
    if (!entry) return { status: 'unknown-question' }
    this.keys.delete(instanceId)
    this.graded.add(instanceId)
    return { status: 'graded', result: grade(entry.key, resolveResponse(entry.view, response)) }
  }

  /**
   * Does a piece of text (e.g. an AI-generated hint) state the answer to an
   * active question? Used to reject hints that give the answer away.
   */
  revealsAnswer(instanceId: string, text: string): boolean {
    const entry = this.keys.get(instanceId)
    if (!entry) return false
    const lower = text.toLowerCase()
    const parts = entry.key.body.kind === 'multi' ? entry.key.body.parts : [entry.key.body]
    return parts.some((part) => {
      switch (part.kind) {
        case 'numeric':
          return new RegExp(`(^|[^\\d.])${String(part.value).replace('.', '\\.')}(?![\\d.])`).test(text) || lower.includes(`x = ${part.value}`)
        case 'text':
          return part.accepted.some((a) => new RegExp(`\\b${a.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower))
        case 'mcq': {
          const body = entry.view.body
          const choices = body.kind === 'mcq' ? body.choices : body.kind === 'multi' ? body.parts.flatMap((p) => (p.kind === 'mcq' ? p.choices : [])) : []
          const correct = choices.find((c) => c.id === part.correctId)
          return !!correct && correct.text.length > 3 && lower.includes(correct.text.toLowerCase())
        }
        default:
          return false
      }
    })
  }

  /** Test support only (exposed in the e2e build). */
  debugCorrectResponse(instanceId: string): QuestionResponse | null {
    const entry = this.keys.get(instanceId)
    return entry ? correctResponseFor(entry.view, entry.key) : null
  }

  discard(instanceId: string): void {
    this.keys.delete(instanceId)
  }

  clear(): void {
    this.keys.clear()
  }
}

/** Order responses arrive as token ids; grading compares token texts. */
function resolveResponse(view: QuestionView, response: QuestionResponse): QuestionResponse {
  if (response.kind === 'order' && view.body.kind === 'order') {
    const byId = new Map(view.body.tokens.map((t) => [t.id, t.text]))
    return { kind: 'order', tokenIds: response.tokenIds.map((id) => byId.get(id) ?? '') }
  }
  return response
}
