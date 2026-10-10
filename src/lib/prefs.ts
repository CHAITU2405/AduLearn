/**
 * Small per-device preferences stored in localStorage (theme-like settings,
 * AI endpoint). Wrapped in try/catch: storage may be unavailable, in which
 * case defaults are used and the app still works.
 */
import { DEFAULT_OLLAMA, type OllamaConfig } from '@/services/ai/ollama'
import { setSoundEnabled } from './sfx'

export interface Prefs {
  motion: 'system' | 'reduce' | 'full'
  textSize: 'normal' | 'large'
  showReasons: boolean
  sound: boolean
  ai: OllamaConfig
}

export const DEFAULT_PREFS: Prefs = { motion: 'system', textSize: 'normal', showReasons: true, sound: true, ai: DEFAULT_OLLAMA }

const KEY = 'adulearn:prefs'

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PREFS
    const p = JSON.parse(raw) as Partial<Prefs>
    return {
      motion: p.motion === 'reduce' || p.motion === 'full' ? p.motion : 'system',
      textSize: p.textSize === 'large' ? 'large' : 'normal',
      showReasons: p.showReasons !== false,
      sound: p.sound !== false,
      ai: {
        enabled: !!p.ai?.enabled,
        endpoint: typeof p.ai?.endpoint === 'string' && p.ai.endpoint ? p.ai.endpoint : DEFAULT_OLLAMA.endpoint,
        model: typeof p.ai?.model === 'string' ? p.ai.model : '',
        timeoutMs: typeof p.ai?.timeoutMs === 'number' ? Math.min(120000, Math.max(3000, p.ai.timeoutMs)) : DEFAULT_OLLAMA.timeoutMs,
      },
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // Preferences are a convenience; ignore storage failures.
  }
}

export function applyPrefsToDocument(p: Prefs): void {
  const el = document.documentElement
  el.dataset.motion = p.motion
  el.dataset.textSize = p.textSize
  setSoundEnabled(p.sound)
}
