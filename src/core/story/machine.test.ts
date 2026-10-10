import { describe, expect, it } from 'vitest'
import { SCENES } from '@/content'
import { dialogueReducer, flowReducer, initialDialogue, type FlowEvent, type FlowPhase } from './machine'

describe('dialogue state machine', () => {
  const scene = SCENES['math-m1-intro']

  it('requires a choice on lines with choices before advancing', () => {
    let s = initialDialogue
    s = dialogueReducer(scene, s, { type: 'advance' })
    s = dialogueReducer(scene, s, { type: 'advance' })
    expect(s.lineIndex).toBe(2)
    const blocked = dialogueReducer(scene, s, { type: 'advance' })
    expect(blocked).toEqual(s)
    s = dialogueReducer(scene, s, { type: 'choose', index: 0 })
    expect(s.reply).toMatch(/Exactly/)
    s = dialogueReducer(scene, s, { type: 'advance' })
    expect(s.done).toBe(true)
  })

  it('can be skipped', () => {
    expect(dialogueReducer(scene, initialDialogue, { type: 'skip' }).done).toBe(true)
  })
})

describe('mission flow', () => {
  const run = (events: FlowEvent[], start: FlowPhase = 'intro') => events.reduce(flowReducer, start)

  it('reaches the outro only through a completed run', () => {
    expect(run([{ type: 'intro-done', hasLab: false }])).toBe('play')
    expect(run([{ type: 'intro-done', hasLab: false }, { type: 'outro-done' }])).toBe('play')
    expect(run([{ type: 'intro-done', hasLab: false }, { type: 'run-complete' }, { type: 'outro-done' }])).toBe('summary')
  })

  it('cannot skip from the intro straight to the outro or summary', () => {
    expect(run([{ type: 'run-complete' }])).toBe('intro')
    expect(run([{ type: 'outro-done' }])).toBe('intro')
  })

  it('goes through the lab when a mission has one, and retries after failure', () => {
    expect(run([{ type: 'intro-done', hasLab: true }])).toBe('lab')
    expect(run([{ type: 'intro-done', hasLab: true }, { type: 'lab-done' }, { type: 'run-failed' }])).toBe('failed')
    expect(run([{ type: 'retry' }], 'failed')).toBe('play')
  })
})
