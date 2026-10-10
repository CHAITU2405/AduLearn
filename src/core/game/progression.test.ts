import { describe, expect, it } from 'vitest'
import { chapterNodeStates, CHAPTERS, getChapter, REGIONS } from '@/content'
import { chapterProgress, emptySnapshot, isChapterComplete, nextAvailableNode, nodeStates, regionState, type ProgressSnapshot } from './progression'

const math = getChapter('math-equations')!
const snap = (missions: string[] = [], bosses: string[] = [], assessments: string[] = []): ProgressSnapshot => ({
  completedMissionIds: new Set(missions),
  passedBossIds: new Set(bosses),
  completedAssessments: new Set(assessments),
})

describe('mission unlocking', () => {
  it('opens the first mission without requiring the optional diagnostic', () => {
    const s = nodeStates(math, emptySnapshot())
    expect(s['math-diag']).toBe('available')
    expect(s['math-m1']).toBe('available')
    expect(s['math-m2']).toBe('locked')
    expect(s['math-boss']).toBe('locked')
  })

  it('unlocks the next mission, mini-boss and boss in sequence', () => {
    expect(nodeStates(math, snap(['math-m1']))['math-m2']).toBe('available')
    expect(nodeStates(math, snap(['math-m1', 'math-m2']))['math-mini']).toBe('available')
    expect(nodeStates(math, snap(['math-m1', 'math-m2']))['math-m3']).toBe('locked')
    expect(nodeStates(math, snap(['math-m1', 'math-m2'], ['math-mini']))['math-m3']).toBe('available')
    const beforeBoss = snap(['math-m1', 'math-m2', 'math-m3', 'math-m4'], ['math-mini'])
    expect(nodeStates(math, beforeBoss)['math-boss']).toBe('available')
    expect(nodeStates(math, beforeBoss)['math-follow']).toBe('locked')
  })

  it('opens the follow-up check only after the chapter boss is passed', () => {
    const done = snap(['math-m1', 'math-m2', 'math-m3', 'math-m4'], ['math-mini', 'math-boss'])
    expect(nodeStates(math, done)['math-follow']).toBe('available')
    expect(isChapterComplete(math, done)).toBe(true)
    expect(chapterProgress(math, done)).toEqual({ done: 6, total: 6 })
  })

  it('lets science missions be played in any order before its boss', () => {
    const sci = getChapter('sci-field')!
    const s = nodeStates(sci, snap(['sci-m2']))
    expect(s['sci-m1']).toBe('available')
    expect(s['sci-m3']).toBe('available')
    expect(s['sci-boss']).toBe('locked')
    expect(nodeStates(sci, snap(['sci-m1', 'sci-m2', 'sci-m3']))['sci-boss']).toBe('available')
  })

  it('keeps planned chapters locked', () => {
    const planned = CHAPTERS.find((c) => c.status === 'planned')!
    expect(isChapterComplete(planned, emptySnapshot())).toBe(false)
  })
})

describe('regions', () => {
  it('locks the Frontier of Discovery until one mission is completed', () => {
    const discovery = REGIONS.find((r) => r.id === 'discovery')!
    expect(regionState(discovery, CHAPTERS, emptySnapshot())).toBe('locked')
    expect(regionState(discovery, CHAPTERS, snap(['eng-m1']))).toBe('available')
  })

  it('locks every stage of a chapter whose region is locked, even if its own requirements are met', () => {
    const sci = getChapter('sci-field')!
    expect(chapterNodeStates(sci, emptySnapshot())['sci-m1']).toBe('locked')
    expect(chapterNodeStates(sci, snap(['math-m1']))['sci-m1']).toBe('available')
  })

  it('suggests the next available stage', () => {
    const next = nextAvailableNode([math], snap(['math-m1']))!
    expect(next.node.id).toBe('math-m2')
    expect(nextAvailableNode([math], emptySnapshot())!.node.id).toBe('math-diag')
    expect(nextAvailableNode([math], emptySnapshot(), new Set(['math-equations']))!.node.id).toBe('math-m1')
  })
})
