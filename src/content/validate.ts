/**
 * Manifest validation: checks every cross-reference and template's metadata.
 * Run by the test suite; kept separate from ./index.ts so the schema library
 * stays out of the app's startup bundle.
 */
import { validateTemplateMeta } from '@/core/content/schemas'
import { BOSSES, CHAPTERS, CONCEPTS, getAssessment, MISSIONS, REGIONS, SCENES, TEMPLATES } from './index'

const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((i) => [i.id, i]))
const conceptMap = byId(CONCEPTS)
const chapterMap = byId(CHAPTERS)
const missionMap = byId(MISSIONS)
const bossMap = byId(BOSSES)

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
