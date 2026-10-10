import Dexie from 'dexie'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DB_NAME, resetDbInstance } from '@/data/db'
import { alternativeExplanation, contextualHint, dialogueVariation, validateAiText } from './features'
import { chat, listModels, OllamaFailure, type FetchLike, type OllamaConfig } from './ollama'

const cfg: OllamaConfig = { enabled: true, endpoint: 'http://localhost:11434', model: 'test-model', timeoutMs: 200 }
const reply =
  (content: string): FetchLike =>
  async () =>
    new Response(JSON.stringify({ message: { content } }), { status: 200 })
const explainInput = { conceptName: 'Two-step equations', prompt: 'Solve 3x + 5 = 20', approvedExplanation: 'Subtract 5, then divide by 3: x = 5.', answerDisplay: 'x = 5' }

beforeEach(async () => {
  resetDbInstance()
  await Dexie.delete(DB_NAME)
})

describe('Ollama failure fallback', () => {
  it('falls back to approved content when AI is disabled', async () => {
    const fetchImpl = vi.fn()
    const r = await alternativeExplanation({ ...cfg, enabled: false }, explainInput, { fetchImpl })
    expect(r).toMatchObject({ source: 'fallback', text: explainInput.approvedExplanation })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('falls back when no model is configured', async () => {
    const r = await alternativeExplanation({ ...cfg, model: '' }, explainInput, { fetchImpl: vi.fn() })
    expect(r.source).toBe('fallback')
  })

  it('falls back when Ollama is unreachable', async () => {
    const r = await alternativeExplanation(cfg, explainInput, {
      fetchImpl: async () => {
        throw new TypeError('Failed to fetch')
      },
    })
    expect(r).toMatchObject({ source: 'fallback', text: explainInput.approvedExplanation })
    if (r.source === 'fallback') expect(r.reason).toMatch(/reach Ollama/)
  })

  it('times out slow responses', async () => {
    const slow: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })
    await expect(chat(cfg, [{ role: 'user', content: 'hi' }], { fetchImpl: slow })).rejects.toMatchObject({ kind: 'timeout' })
    const r = await alternativeExplanation(cfg, explainInput, { fetchImpl: slow })
    expect(r.source).toBe('fallback')
  })

  it('reports a missing model without downloading it', async () => {
    const notFound: FetchLike = async () => new Response('{"error":"model not found"}', { status: 404 })
    await expect(chat(cfg, [{ role: 'user', content: 'x' }], { fetchImpl: notFound })).rejects.toMatchObject({ kind: 'model-missing' })
  })

  it('falls back when the model returns invalid output', async () => {
    expect((await alternativeExplanation(cfg, explainInput, { fetchImpl: reply('not json at all') })).source).toBe('fallback')
    expect((await alternativeExplanation(cfg, explainInput, { fetchImpl: reply('{"wrong":"shape"}') })).source).toBe('fallback')
  })

  it('rejects unsafe or HTML output', async () => {
    expect((await alternativeExplanation(cfg, explainInput, { fetchImpl: reply('{"text":"<script>alert(1)</script> subtract five then divide"}') })).source).toBe('fallback')
    expect((await alternativeExplanation(cfg, explainInput, { fetchImpl: reply('{"text":"Visit https://example.com for the answer to this"}') })).source).toBe('fallback')
  })

  it('rejects hints that reveal the answer', async () => {
    const r = await contextualHint(
      cfg,
      { conceptName: 'x', prompt: 'Solve 3x + 5 = 20', approvedHint: 'Undo the + 5 first.', revealsAnswer: (t) => /\b5\b/.test(t) && t.includes('x = 5') },
      { fetchImpl: reply('{"text":"The answer is x = 5, easy!"}') },
    )
    expect(r).toMatchObject({ source: 'fallback', text: 'Undo the + 5 first.' })
  })

  it('accepts valid output and caches it', async () => {
    const fetchImpl = vi.fn(reply('{"text":"First take away 5 from both sides, then share what is left equally into 3 groups."}'))
    const a = await alternativeExplanation(cfg, explainInput, { fetchImpl })
    const b = await alternativeExplanation(cfg, explainInput, { fetchImpl })
    expect(a.source).toBe('ai')
    expect(b).toEqual(a)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('keeps numbers intact when rephrasing dialogue', async () => {
    const line = 'I need 12 planks for the bridge.'
    const changed = await dialogueVariation(cfg, { characterName: 'Ira', line }, { fetchImpl: reply('{"text":"I need a dozen planks for the bridge!"}') })
    expect(changed).toMatchObject({ source: 'fallback', text: line })
  })

  it('lists installed models and validates the endpoint', async () => {
    const tags: FetchLike = async () => new Response(JSON.stringify({ models: [{ name: 'llama3.2:3b' }] }))
    expect(await listModels(cfg, tags)).toEqual(['llama3.2:3b'])
    await expect(listModels({ ...cfg, endpoint: 'localhost:11434' }, tags)).rejects.toBeInstanceOf(OllamaFailure)
  })
})

describe('validateAiText', () => {
  it('enforces length limits', () => {
    expect(validateAiText('{"text":"short"}', { maxChars: 100 }).ok).toBe(false)
    expect(validateAiText(JSON.stringify({ text: 'a'.repeat(300) }), { maxChars: 100 }).ok).toBe(false)
    expect(validateAiText('{"text":"A perfectly reasonable sentence."}', { maxChars: 100 }).ok).toBe(true)
  })
})
