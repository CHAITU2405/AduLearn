import type { StoryScene } from './types'

// ---------------------------------------------------------------------------
// Dialogue state machine (one scene)
// ---------------------------------------------------------------------------

export interface DialogueState {
  lineIndex: number
  /** Reply shown after a choice on the current line. */
  reply: string | null
  done: boolean
}

export type DialogueEvent = { type: 'advance' } | { type: 'choose'; index: number } | { type: 'skip' }

export const initialDialogue: DialogueState = { lineIndex: 0, reply: null, done: false }

export function dialogueReducer(scene: StoryScene, state: DialogueState, event: DialogueEvent): DialogueState {
  if (state.done) return state
  const line = scene.lines[state.lineIndex]
  switch (event.type) {
    case 'choose': {
      const c = line?.choices?.[event.index]
      if (!c || state.reply) return state
      return { ...state, reply: c.reply }
    }
    case 'advance': {
      // A line with choices needs a choice before moving on.
      if (line?.choices?.length && !state.reply) return state
      const next = state.lineIndex + 1
      return next >= scene.lines.length ? { lineIndex: state.lineIndex, reply: null, done: true } : { lineIndex: next, reply: null, done: false }
    }
    case 'skip':
      return { ...state, reply: null, done: true }
  }
}

// ---------------------------------------------------------------------------
// Mission flow state machine
// ---------------------------------------------------------------------------

export type FlowPhase = 'intro' | 'lab' | 'play' | 'outro' | 'summary' | 'failed'

export type FlowEvent =
  { type: 'intro-done'; hasLab: boolean } | { type: 'lab-done' } | { type: 'run-complete' } | { type: 'run-failed' } | { type: 'outro-done' } | { type: 'retry' }

/**
 * Story progression is gated by the learning run: the outro (and the summary)
 * can only be reached through 'run-complete', which the screen dispatches only
 * when the progression engine reports the goal as met.
 */
export function flowReducer(phase: FlowPhase, event: FlowEvent): FlowPhase {
  switch (phase) {
    case 'intro':
      return event.type === 'intro-done' ? (event.hasLab ? 'lab' : 'play') : phase
    case 'lab':
      return event.type === 'lab-done' ? 'play' : phase
    case 'play':
      if (event.type === 'run-complete') return 'outro'
      if (event.type === 'run-failed') return 'failed'
      return phase
    case 'outro':
      return event.type === 'outro-done' ? 'summary' : phase
    case 'failed':
      return event.type === 'retry' ? 'play' : phase
    case 'summary':
      return event.type === 'retry' ? 'play' : phase
  }
}
