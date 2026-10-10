import { settingsRepo } from '@/data/repositories'

/**
 * Local teacher PIN. This only discourages casual access by students: anyone
 * with full access to the device and browser can read or clear local data.
 */
const KEY = 'teacherPin'

interface StoredPin {
  salt: string
  hash: string
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hasPin(): Promise<boolean> {
  return !!(await settingsRepo.get<StoredPin>(KEY))
}

export async function setPin(pin: string): Promise<void> {
  const salt = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, '0')).join('')
  await settingsRepo.set(KEY, { salt, hash: await sha256(`${salt}:${pin}`) } satisfies StoredPin)
}

export async function checkPin(pin: string): Promise<boolean> {
  const stored = await settingsRepo.get<StoredPin>(KEY)
  if (!stored) return false
  return (await sha256(`${stored.salt}:${pin}`)) === stored.hash
}

export const validPin = (pin: string) => /^\d{4,8}$/.test(pin)

const SESSION_KEY = 'adulearn:teacher-unlocked'
export function rememberUnlocked(v: boolean) {
  try {
    if (v) sessionStorage.setItem(SESSION_KEY, '1')
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}
export function wasUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}
