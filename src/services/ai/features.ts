/**
 * AI-assisted features with strict validation and fallback.
 *
 * The LLM is never the source of truth for answers, grading, mastery,
 * progression or curriculum approval. It only rephrases or re-explains
 * approved content. Output is validated against a JSON schema, checked for
 * length and unsafe content, rendered as plain text, and replaced by the
 * approved content if anything fails. No student identifiers are sent.
 */
import { z } from 'zod'
import { hashString } from '@/core/engine/rng'
import { getDb } from '@/data/db'
import { chat, OllamaFailure, type FetchLike, type OllamaConfig } from './ollama'

const outputSchema = z.object({ text: z.string().min(1).max(900) })
const JSON_FORMAT = { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] }

const BLOCKED = [/https?:\/\//i, /<\s*\/?\s*[a-z]+[^>]*>/i, /\b(kill|suicide|sex|drugs?|weapon|hate)\b/i, /\b(phone|address|email)\b/i]

export type AiOutcome = { source: 'ai'; text: string } | { source: 'fallback'; text: string; reason: string }

export function validateAiText(
  raw: string,
  opts: { maxChars: number; minChars?: number; mustNotContain?: (text: string) => boolean },
): { ok: true; text: string } | { ok: false; reason: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, reason: 'The model did not return valid JSON.' }
  }
  const r = outputSchema.safeParse(parsed)
  if (!r.success) return { ok: false, reason: 'The model response did not match the expected structure.' }
  const text = r.data.text.replace(/\s+/g, ' ').trim()
  if (text.length > opts.maxChars) return { ok: false, reason: 'The response was too long.' }
  if (text.length < (opts.minChars ?? 10)) return { ok: false, reason: 'The response was too short.' }
  if (BLOCKED.some((re) => re.test(text))) return { ok: false, reason: 'The response contained content that is not allowed.' }
  if (opts.mustNotContain?.(text)) return { ok: false, reason: 'The response revealed the answer.' }
  return { ok: true, text }
}

async function cached(cfg: OllamaConfig, prompt: string, run: () => Promise<string | null>): Promise<string | null> {
  const key = hashString(`${cfg.model}\u0000${prompt}`)
  try {
    const hit = await getDb().aiCache.get(key)
    if (hit) return hit.text
  } catch {
    // Cache is best-effort.
  }
  const text = await run()
  if (text) {
    try {
      await getDb().aiCache.put({ key, text, model: cfg.model, createdAt: Date.now() })
    } catch {
      // ignore
    }
  }
  return text
}

const SYSTEM = [
  'You are a friendly tutor character in an educational game for Class 8 students (age 13-14) in Andhra Pradesh, India.',
  'Use short, simple, encouraging sentences. Do not invent new facts beyond what you are given.',
  'Never ask for or mention personal information. Respond ONLY with JSON of the form {"text": "..."}.',
].join(' ')

interface RunOpts {
  signal?: AbortSignal
  fetchImpl?: FetchLike
}

async function generate(cfg: OllamaConfig, prompt: string, validate: (raw: string) => ReturnType<typeof validateAiText>, fallback: string, opts: RunOpts): Promise<AiOutcome> {
  try {
    let failure = 'The response did not pass validation.'
    const text = await cached(cfg, prompt, async () => {
      const raw = await chat(
        cfg,
        [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
        { format: JSON_FORMAT, signal: opts.signal, fetchImpl: opts.fetchImpl },
      )
      const v = validate(raw)
      if (!v.ok) failure = v.reason
      return v.ok ? v.text : null
    })
    return text ? { source: 'ai', text } : { source: 'fallback', text: fallback, reason: failure }
  } catch (err) {
    return { source: 'fallback', text: fallback, reason: err instanceof OllamaFailure ? err.message : 'Local AI is unavailable.' }
  }
}

/** Re-explain an already-graded question in different words. */
export function alternativeExplanation(
  cfg: OllamaConfig,
  input: { conceptName: string; prompt: string; approvedExplanation: string; answerDisplay: string },
  opts: RunOpts = {},
): Promise<AiOutcome> {
  const prompt = [
    `Topic: ${input.conceptName}.`,
    `Question: ${input.prompt}`,
    `Correct answer: ${input.answerDisplay}`,
    `Approved explanation: ${input.approvedExplanation}`,
    'Explain the approved explanation again in a different, simpler way (at most 4 sentences). Keep the same method and the same answer. Do not add new facts.',
  ].join('\n')
  return generate(cfg, prompt, (raw) => validateAiText(raw, { maxChars: 700 }), input.approvedExplanation, opts)
}

/**
 * A contextual hint before answering. The model is not given the answer, and
 * the result is additionally rejected if it happens to state the answer.
 */
export function contextualHint(
  cfg: OllamaConfig,
  input: { conceptName: string; prompt: string; approvedHint: string; revealsAnswer: (text: string) => boolean },
  opts: RunOpts = {},
): Promise<AiOutcome> {
  const prompt = [
    `Topic: ${input.conceptName}.`,
    `Question: ${input.prompt}`,
    `Approved hint: ${input.approvedHint}`,
    'Give one short hint (at most 2 sentences) in the spirit of the approved hint. Do NOT solve the question or state the final answer.',
  ].join('\n')
  return generate(cfg, prompt, (raw) => validateAiText(raw, { maxChars: 300, mustNotContain: input.revealsAnswer }), input.approvedHint, opts)
}

/** A light rephrasing of an approved dialogue line, falling back to the original. */
export function dialogueVariation(cfg: OllamaConfig, input: { characterName: string; line: string }, opts: RunOpts = {}): Promise<AiOutcome> {
  const prompt = [
    `Character: ${input.characterName}.`,
    `Line: ${input.line}`,
    'Rephrase this line in the same character voice, with the same meaning and roughly the same length. Keep any numbers and names exactly.',
  ].join('\n')
  const numbers = input.line.match(/\d+/g) ?? []
  return generate(
    cfg,
    prompt,
    (raw) => {
      const v = validateAiText(raw, { maxChars: Math.ceil(input.line.length * 1.6) + 20, minChars: Math.floor(input.line.length * 0.4) })
      if (v.ok && numbers.some((n) => !v.text.includes(n))) return { ok: false, reason: 'The rephrased line changed a number.' }
      return v
    },
    input.line,
    opts,
  )
}
