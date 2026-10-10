import { CHAPTERS } from '@/content'
import { chapterProgress } from '@/core/game/progression'
import { needsReteaching, type MasteryState } from '@/core/learning/mastery'
import type { AssessmentRecord, AttemptRecord, BossResultRecord, MissionProgressRecord, ProfileRecord } from '@/data/db'
import { assessmentRepo, attemptRepo, bossRepo, masteryRepo, profileRepo, progressRepo, progressSnapshot } from '@/data/repositories'

export interface StudentRecord {
  profile: ProfileRecord
  attempts: AttemptRecord[]
  mastery: Record<string, MasteryState>
  missions: MissionProgressRecord[]
  bosses: BossResultRecord[]
  assessments: AssessmentRecord[]
  chapterProgress: Record<string, { done: number; total: number }>
  reteach: { conceptId: string; reason: string }[]
  misconceptionCounts: Record<string, number>
}

export async function loadStudent(profile: ProfileRecord): Promise<StudentRecord> {
  const [attempts, mastery, missions, bosses, assessments, snapshot] = await Promise.all([
    attemptRepo.forProfile(profile.id),
    masteryRepo.forProfile(profile.id),
    progressRepo.forProfile(profile.id),
    bossRepo.forProfile(profile.id),
    assessmentRepo.forProfile(profile.id),
    progressSnapshot(profile.id),
  ])
  const cp: StudentRecord['chapterProgress'] = {}
  for (const c of CHAPTERS.filter((x) => x.status === 'playable')) cp[c.id] = chapterProgress(c, snapshot)
  const reteach = Object.values(mastery)
    .map((m) => ({ conceptId: m.conceptId, r: needsReteaching(m) }))
    .filter((x) => x.r.flag)
    .map((x) => ({ conceptId: x.conceptId, reason: x.r.reason! }))
  const misconceptionCounts: Record<string, number> = {}
  for (const a of attempts) if (a.misconceptionId) misconceptionCounts[a.misconceptionId] = (misconceptionCounts[a.misconceptionId] ?? 0) + 1
  return { profile, attempts, mastery, missions, bosses, assessments, chapterProgress: cp, reteach, misconceptionCounts }
}

export async function loadClass(): Promise<StudentRecord[]> {
  const profiles = await profileRepo.list()
  return Promise.all(profiles.map(loadStudent))
}
