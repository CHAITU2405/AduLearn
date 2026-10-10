/**
 * Tiny synthesized sound effects using the Web Audio API — no audio files.
 * Silently does nothing when audio is unavailable or sound is turned off.
 */
export type Sfx = 'tap' | 'step' | 'correct' | 'wrong' | 'coin' | 'star' | 'win' | 'lose' | 'hit' | 'hurt' | 'open' | 'locked'

let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(on: boolean) {
  enabled = on
}

function audio(): AudioContext | null {
  if (!enabled || typeof window === 'undefined') return null
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  try {
    ctx ??= new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(a: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, slideTo?: number) {
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, a.currentTime + start)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + start + dur)
  g.gain.setValueAtTime(0.0001, a.currentTime + start)
  g.gain.exponentialRampToValueAtTime(vol, a.currentTime + start + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur)
  o.connect(g).connect(a.destination)
  o.start(a.currentTime + start)
  o.stop(a.currentTime + start + dur + 0.02)
}

export function play(s: Sfx) {
  const a = audio()
  if (!a) return
  try {
    switch (s) {
      case 'tap':
        tone(a, 660, 0, 0.06, 'triangle', 0.06)
        break
      case 'step':
        tone(a, 180, 0, 0.05, 'triangle', 0.035)
        break
      case 'open':
        tone(a, 440, 0, 0.1, 'triangle', 0.08, 880)
        break
      case 'locked':
        tone(a, 220, 0, 0.12, 'square', 0.04)
        tone(a, 180, 0.1, 0.14, 'square', 0.04)
        break
      case 'correct':
        ;[523, 659, 784].forEach((f, i) => tone(a, f, i * 0.07, 0.16, 'triangle', 0.1))
        break
      case 'wrong':
        tone(a, 300, 0, 0.18, 'sawtooth', 0.05, 160)
        break
      case 'coin':
        tone(a, 988, 0, 0.07, 'square', 0.05)
        tone(a, 1319, 0.06, 0.12, 'square', 0.05)
        break
      case 'star':
        tone(a, 880, 0, 0.12, 'triangle', 0.09, 1320)
        break
      case 'win':
        ;[523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(a, f, i * 0.1, 0.2, 'triangle', 0.09))
        break
      case 'lose':
        ;[392, 330, 262].forEach((f, i) => tone(a, f, i * 0.16, 0.24, 'triangle', 0.08))
        break
      case 'hit':
        tone(a, 900, 0, 0.12, 'sawtooth', 0.06, 200)
        break
      case 'hurt':
        tone(a, 140, 0, 0.22, 'square', 0.06, 70)
        break
    }
  } catch {
    // Audio is a nicety; never let it break play.
  }
}
