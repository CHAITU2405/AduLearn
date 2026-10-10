/**
 * Content registry: one place to look up regions, chapters, concepts,
 * missions, bosses, assessments, templates and scenes. Validates the
 * manifest's internal references when first used.
 */
import { validateTemplateMeta } from '@/core/content/schemas'
import type { Chapter, QuestionTemplate, ReviewStatus } from '@/core/content/types'
import { nodeStates, regionState, type NodeState, type ProgressSnapshot } from '@/core/game/progression'
import { ASSESSMENTS, BOSSES, CHAPTERS, CONCEPTS, MISSIONS, REGIONS } from './manifest'
import { SCENES } from './story/scenes'
import { englishTemplates } from './templates/english-library'
import { mathTemplates } from './templates/math-equations'
import { scienceTemplates } from './templates/science-field'

export { ASSESSMENTS, BOSSES, CHAPTERS, CONCEPTS, MISSIONS, REGIONS, SCENES }

export const TEMPLATES: QuestionTemplate[] = [...mathTemplates, ...englishTemplates, ...scienceTemplates]

const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((i) => [i.id, i]))
const regionMap = byId(REGIONS)
const chapterMap = byId(CHAPTERS)
const conceptMap = byId(CONCEPTS)
const missionMap = byId(MISSIONS)
const bossMap = byId(BOSSES)
const templateMap = byId(TEMPLATES)

export const getRegion = (id: string) => regionMap.get(id)
export const getChapter = (id: string) => chapterMap.get(id)
export const getConcept = (id: string) => conceptMap.get(id)
export const getMission = (id: string) => missionMap.get(id)
export const getBoss = (id: string) => bossMap.get(id)
export const getTemplate = (id: string) => templateMap.get(id)
export const getAssessment = (id: string) => ASSESSMENTS.find((a) => a.id === id)
export const conceptName = (id: string) => conceptMap.get(id)?.name ?? id
export const chaptersForRegion = (regionId: string) => CHAPTERS.filter((c) => c.regionId === regionId)
export const playableChapters = () => CHAPTERS.filter((c) => c.status === 'playable')

/**
 * Node states for a chapter, also enforcing its region's unlock rule: nothing in
 * a locked region can be played, even by visiting its URL directly.
 */
export function chapterNodeStates(chapter: Chapter, snapshot: ProgressSnapshot): Record<string, NodeState> {
  const region = regionMap.get(chapter.regionId)
  const states = nodeStates(chapter, snapshot)
  if (region && regionState(region, CHAPTERS, snapshot) === 'locked') {
    for (const id of Object.keys(states)) states[id] = 'locked'
  }
  return states
}

/** Effective review status: a teacher override (stored locally) wins over the bundled status. */
export function effectiveStatus(t: QuestionTemplate, overrides: Record<string, ReviewStatus>): ReviewStatus {
  return overrides[t.id] ?? t.review.status
}

export function approvalChecker(overrides: Record<string, ReviewStatus>) {
  return (t: QuestionTemplate) => effectiveStatus(t, overrides) === 'approved'
}

/** Validate manifest cross-references. Returns a list of problems (empty = valid). */
export function validateContent(): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  for (const t of TEMPLATES) {
    if (ids.has(t.id)) problems.push(`Duplicate template id ${t.id}`)
    ids.add(t.id)
    problems.push(...validateTemplateMeta(t).map((p) => `${t.id}: ${p}`))
    if (!conceptMap.has(t.conceptId)) problems.push(`${t.id}: unknown concept ${t.conceptId}`)
    else if (conceptMap.get(t.conceptId)!.chapterId !== t.chapterId) problems.push(`${t.id}: concept belongs to a different chapter`)
  }
  for (const r of REGIONS) for (const c of r.chapterIds) if (!chapterMap.has(c)) problems.push(`Region ${r.id}: unknown chapter ${c}`)
  for (const ch of CHAPTERS) {
    const nodeIds = new Set(ch.nodes.map((n) => n.id))
    for (const n of ch.nodes) {
      for (const req of n.requires) if (!nodeIds.has(req)) problems.push(`${ch.id}/${n.id}: unknown requirement ${req}`)
      if (n.kind === 'mission' && !missionMap.has(n.id)) problems.push(`${ch.id}: unknown mission ${n.id}`)
      if (n.kind === 'boss' && !bossMap.has(n.id)) problems.push(`${ch.id}: unknown boss ${n.id}`)
    }
    if (ch.status === 'playable' && ch.assessmentId && !getAssessment(ch.assessmentId)) problems.push(`${ch.id}: unknown assessment ${ch.assessmentId}`)
  }
  for (const m of MISSIONS) {
    for (const s of [m.introSceneId, m.outroSceneId]) if (!SCENES[s]) problems.push(`${m.id}: unknown scene ${s}`)
    for (const c of m.conceptMix) if (!conceptMap.has(c.conceptId)) problems.push(`${m.id}: unknown concept ${c.conceptId}`)
    if (m.difficultyRange[0] > m.difficultyRange[1]) problems.push(`${m.id}: invalid difficulty range`)
  }
  for (const b of BOSSES) {
    for (const s of [b.introSceneId, b.outroSceneId]) if (!SCENES[s]) problems.push(`${b.id}: unknown scene ${s}`)
    for (const r of b.rounds) if (!conceptMap.has(r.conceptId)) problems.push(`${b.id}: unknown concept ${r.conceptId}`)
  }
  return problems
}
