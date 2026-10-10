/**
 * Content registry: one place to look up regions, chapters, concepts,
 * missions, bosses, assessments, templates and scenes. Cross-reference
 * validation lives in ./validate.ts (it pulls in the schema library, so it is
 * kept out of the startup bundle).
 */
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
