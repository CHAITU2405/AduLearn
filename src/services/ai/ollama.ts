/**
 * Minimal Ollama client. Optional: every caller must handle failure and fall
 * back to approved content. Never auto-downloads models.
 */
export interface OllamaConfig {
  enabled: boolean
  endpoint: string
  model: string
  timeoutMs: number
}

export const DEFAULT_OLLAMA: OllamaConfig = {
  enabled: false,
  endpoint: 'http://localhost:11434',
  model: '',
  timeoutMs: 20000,
}

export type OllamaError = 'disabled' | 'not-configured' | 'unreachable' | 'timeout' | 'model-missing' | 'bad-response' | 'aborted'

export class OllamaFailure extends Error {
  constructor(
    public kind: OllamaError,
    message: string,
  ) {
    super(message)
  }
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

function endpointUrl(endpoint: string, path: string): string {
  const base = endpoint.trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) throw new OllamaFailure('not-configured', 'The endpoint must start with http:// or https://')
  return `${base}${path}`
}

async function withTimeout<T>(timeoutMs: number, outer: AbortSignal | undefined, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctrl = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    ctrl.abort()
  }, timeoutMs)
  const onAbort = () => ctrl.abort()
  outer?.addEventListener('abort', onAbort)
  try {
    return await run(ctrl.signal)
  } catch (err) {
    if (err instanceof OllamaFailure) throw err
    if (timedOut) throw new OllamaFailure('timeout', 'The local model took too long to respond.')
    if (outer?.aborted) throw new OllamaFailure('aborted', 'Cancelled.')
    throw new OllamaFailure('unreachable', 'Could not reach Ollama. Is it installed and running?')
  } finally {
    clearTimeout(timer)
    outer?.removeEventListener('abort', onAbort)
  }
}

export async function listModels(cfg: Pick<OllamaConfig, 'endpoint' | 'timeoutMs'>, fetchImpl: FetchLike = fetch, signal?: AbortSignal): Promise<string[]> {
  return withTimeout(Math.min(cfg.timeoutMs, 5000), signal, async (s) => {
    const res = await fetchImpl(endpointUrl(cfg.endpoint, '/api/tags'), { signal: s })
    if (!res.ok) throw new OllamaFailure('unreachable', `Ollama responded with status ${res.status}.`)
    const body = (await res.json()) as { models?: { name?: unknown }[] }
    if (!Array.isArray(body.models)) throw new OllamaFailure('bad-response', 'Unexpected response from Ollama.')
    return body.models.map((m) => String(m.name ?? '')).filter(Boolean)
  })
}

export interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

/** Single non-streaming chat call returning the raw message content. */
export async function chat(cfg: OllamaConfig, messages: ChatMessage[], opts: { format?: object; signal?: AbortSignal; fetchImpl?: FetchLike } = {}): Promise<string> {
  if (!cfg.enabled) throw new OllamaFailure('disabled', 'Local AI is turned off.')
  if (!cfg.model) throw new OllamaFailure('not-configured', 'No model selected.')
  const fetchImpl = opts.fetchImpl ?? fetch
  return withTimeout(cfg.timeoutMs, opts.signal, async (s) => {
    const res = await fetchImpl(endpointUrl(cfg.endpoint, '/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: cfg.model, messages, stream: false, format: opts.format, options: { temperature: 0.6, num_predict: 300 } }),
      signal: s,
    })
    if (res.status === 404) throw new OllamaFailure('model-missing', `The model “${cfg.model}” is not installed. Install it with: ollama pull ${cfg.model}`)
    if (!res.ok) throw new OllamaFailure('unreachable', `Ollama responded with status ${res.status}.`)
    const body = (await res.json()) as { message?: { content?: unknown } }
    const content = body.message?.content
    if (typeof content !== 'string') throw new OllamaFailure('bad-response', 'Unexpected response from Ollama.')
    return content
  })
}
