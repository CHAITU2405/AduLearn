/**
 * Small deterministic random number generator (mulberry32).
 * A question generated from the same seed is always identical, which lets
 * review mode regenerate an exact variant from a stored seed.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number
  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  shuffle<T>(items: readonly T[]): T[]
  /** Pick `count` distinct items. */
  sample<T>(items: readonly T[], count: number): T[]
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  const shuffle = <T>(items: readonly T[]): T[] => {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i)
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
  return {
    next,
    int,
    pick: (items) => {
      if (items.length === 0) throw new Error('Cannot pick from an empty list')
      return items[int(0, items.length - 1)]
    },
    shuffle,
    sample: (items, count) => shuffle(items).slice(0, count),
  }
}

export function randomSeed(): number {
  const c = globalThis.crypto
  if (c?.getRandomValues) {
    return c.getRandomValues(new Uint32Array(1))[0]
  }
  return Math.floor(Math.random() * 4294967296)
}

/** FNV-1a hash, returned as a short base-36 string. */
export function hashString(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/** JSON.stringify with sorted object keys, so equal values hash equally. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(',')}}`
}
