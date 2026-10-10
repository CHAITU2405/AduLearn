import type { Chapter, ChapterNode, Region } from '../content/types'

export type NodeState = 'locked' | 'available' | 'completed'

export interface ProgressSnapshot {
  completedMissionIds: ReadonlySet<string>
  passedBossIds: ReadonlySet<string>
  /** `${chapterId}:${kind}` for completed assessments. */
  completedAssessments: ReadonlySet<string>
}

export function emptySnapshot(): ProgressSnapshot {
  return { completedMissionIds: new Set(), passedBossIds: new Set(), completedAssessments: new Set() }
}

export function isNodeDone(chapter: Chapter, node: ChapterNode, p: ProgressSnapshot): boolean {
  switch (node.kind) {
    case 'mission':
      return p.completedMissionIds.has(node.id)
    case 'boss':
      return p.passedBossIds.has(node.id)
    case 'assessment':
      return p.completedAssessments.has(`${chapter.id}:${node.assessment}`)
  }
}

/** Requirements refer to node ids; optional nodes never block others. */
export function nodeStates(chapter: Chapter, p: ProgressSnapshot): Record<string, NodeState> {
  const out: Record<string, NodeState> = {}
  const byId = new Map(chapter.nodes.map((n) => [n.id, n]))
  for (const node of chapter.nodes) {
    if (chapter.status !== 'playable') {
      out[node.id] = 'locked'
      continue
    }
    if (isNodeDone(chapter, node, p)) {
      out[node.id] = 'completed'
      continue
    }
    const unmet = node.requires.filter((req) => {
      const r = byId.get(req)
      if (!r) return false
      if (r.kind === 'assessment' && r.optional) return false
      return !isNodeDone(chapter, r, p)
    })
    out[node.id] = unmet.length === 0 ? 'available' : 'locked'
  }
  return out
}

export function isChapterComplete(chapter: Chapter, p: ProgressSnapshot): boolean {
  if (chapter.status !== 'playable') return false
  return chapter.nodes.filter((n) => n.kind !== 'assessment').every((n) => isNodeDone(chapter, n, p))
}

/** Fraction of required (non-assessment) chapter nodes completed. */
export function chapterProgress(chapter: Chapter, p: ProgressSnapshot): { done: number; total: number } {
  const nodes = chapter.nodes.filter((n) => n.kind !== 'assessment')
  return { done: nodes.filter((n) => isNodeDone(chapter, n, p)).length, total: nodes.length }
}

export function regionState(region: Region, chapters: Chapter[], p: ProgressSnapshot): NodeState {
  const playable = chapters.filter((c) => region.chapterIds.includes(c.id) && c.status === 'playable')
  if (playable.length && playable.every((c) => isChapterComplete(c, p))) return 'completed'
  switch (region.unlock.kind) {
    case 'always':
      return 'available'
    case 'missions-completed':
      return p.completedMissionIds.size >= region.unlock.count ? 'available' : 'locked'
  }
}

export function describeUnlock(region: Region): string {
  switch (region.unlock.kind) {
    case 'always':
      return 'Open from the start'
    case 'missions-completed':
      return `Complete ${region.unlock.count} mission${region.unlock.count === 1 ? '' : 's'} anywhere to open this region`
  }
}

/** First available, not-yet-done node across the given chapters (for "Continue journey"). */
export function nextAvailableNode(
  chapters: Chapter[],
  p: ProgressSnapshot,
  /** Chapters where the student has already answered questions. */
  startedChapterIds: ReadonlySet<string> = new Set(),
): { chapter: Chapter; node: ChapterNode } | null {
  for (const chapter of chapters) {
    const states = nodeStates(chapter, p)
    const started = startedChapterIds.has(chapter.id) || chapterStarted(chapter, p)
    const node = chapter.nodes.find((n) => states[n.id] === 'available' && !(n.kind === 'assessment' && n.optional && n.assessment === 'diagnostic' && started))
    if (node) return { chapter, node }
  }
  return null
}

function chapterStarted(chapter: Chapter, p: ProgressSnapshot): boolean {
  return chapter.nodes.some((n) => n.kind !== 'assessment' && isNodeDone(chapter, n, p))
}
