import { z } from 'zod'
import { avatarSchema } from '@/core/avatar'
import { REVIEW_STATUSES } from '@/core/content/types'
import {
  getDb,
  DB_VERSION,
  type AssessmentRecord,
  type AttemptRecord,
  type BossResultRecord,
  type MasteryRecord,
  type MissionProgressRecord,
  type ProfileRecord,
  type RewardRecord,
  type WalletRecord,
} from './db'

export const EXPORT_FORMAT = 1

const difficulty = z.union([z.literal(1), z.literal(2), z.literal(3)])
const ctx = z.enum(['mission', 'practice', 'review', 'boss', 'diagnostic', 'followup'])
const ts = z.number().int().nonnegative()
const id = z.string().min(1).max(100)

const profileSchema = z.object({ id, nickname: z.string().min(1).max(40), avatar: avatarSchema, createdAt: ts, lastActiveAt: ts, demo: z.boolean().optional() })
const attemptSchema = z.object({
  profileId: id,
  templateId: id,
  templateVersion: z.number().int(),
  seed: z.number().int(),
  fingerprint: z.string().max(200),
  subject: z.string().max(40),
  chapterId: id,
  conceptId: id,
  difficulty,
  context: ctx,
  refId: z.string().max(100),
  correct: z.boolean(),
  score: z.number().min(0).max(1),
  hintsUsed: z.number().int().min(0),
  misconceptionId: z.string().max(100).optional(),
  responseSummary: z.string().max(400),
  selectionReason: z.string().max(400).optional(),
  at: ts,
})
const masterySchema = z.object({
  profileId: id,
  conceptId: id,
  estimate: z.number().min(0).max(1),
  evidence: z.number().int().min(0),
  level: difficulty,
  streakCorrect: z.number().int().min(0),
  streakIncorrect: z.number().int().min(0),
  independentVariants: z.array(z.string().max(200)).max(50),
  misconceptions: z.record(z.string(), z.number().int().min(0)),
  correctedMisconceptions: z.array(z.string()).default([]),
  updatedAt: ts,
})
const missionSchema = z.object({
  profileId: id,
  missionId: id,
  chapterId: id,
  status: z.enum(['in-progress', 'completed']),
  attempts: z.number().int().min(0),
  completedAt: ts.optional(),
  bestAccuracy: z.number().min(0).max(1).optional(),
  bestStars: z.number().int().min(0).max(3).optional(),
})
const bossSchema = z.object({
  profileId: id,
  bossId: id,
  chapterId: id,
  passed: z.boolean(),
  ratio: z.number().min(0).max(1),
  templateIds: z.array(id),
  stars: z.number().int().min(0).max(3).optional(),
  at: ts,
  results: z.array(
    z.object({ index: z.number().int(), conceptId: id, correct: z.boolean(), score: z.number(), hintsUsed: z.number().int(), misconceptionId: z.string().optional() }),
  ),
})
const assessmentSchema = z.object({
  profileId: id,
  chapterId: id,
  kind: z.enum(['diagnostic', 'followup']),
  completedAt: ts,
  items: z.array(z.object({ conceptId: id, templateId: id, fingerprint: z.string(), correct: z.boolean(), transfer: z.boolean() })),
})
const rewardSchema = z.object({
  profileId: id,
  refId: z.string().max(200),
  title: z.string().max(200),
  description: z.string().max(400),
  earnedAt: ts,
  kind: z.enum(['mission-complete', 'misconception-corrected', 'concept-secure', 'chapter-complete', 'boss-defeated', 'assessment-improved']),
})
const walletSchema = z.object({
  profileId: id,
  coins: z.number().int().min(0),
  totalEarned: z.number().int().min(0),
  owned: z.array(z.string().max(60)).max(100),
  facts: z.array(z.string().max(60)).max(200),
  updatedAt: ts,
})
const reviewSchema = z.object({ templateId: id, status: z.enum(REVIEW_STATUSES), note: z.string().max(1000).optional(), reviewer: z.string().max(100).optional(), updatedAt: ts })

export const exportSchema = z.object({
  app: z.literal('adulearn'),
  format: z.literal(EXPORT_FORMAT),
  dbVersion: z.number().int(),
  exportedAt: z.string(),
  note: z.string().optional(),
  profiles: z.array(profileSchema).max(500),
  attempts: z.array(attemptSchema).max(200_000),
  mastery: z.array(masterySchema),
  missionProgress: z.array(missionSchema),
  bossResults: z.array(bossSchema),
  assessments: z.array(assessmentSchema),
  rewards: z.array(rewardSchema),
  contentReviews: z.array(reviewSchema).default([]),
  wallets: z.array(walletSchema).default([]),
})

export type ExportBundle = z.infer<typeof exportSchema>

const strip = <T extends { id?: number }>(rows: T[]) => rows.map(({ id: _id, ...rest }) => (void _id, rest))

/** Build a portable JSON export. Pass a profile id to export just one learner. */
export async function buildExport(profileId?: string): Promise<ExportBundle> {
  const db = getDb()
  const only = <T extends { profileId: string }>(rows: T[]) => (profileId ? rows.filter((r) => r.profileId === profileId) : rows)
  const [profiles, attempts, mastery, missionProgress, bossResults, assessments, rewards, contentReviews, wallets] = await Promise.all([
    db.profiles.toArray(),
    db.attempts.toArray(),
    db.mastery.toArray(),
    db.missionProgress.toArray(),
    db.bossResults.toArray(),
    db.assessments.toArray(),
    db.rewards.toArray(),
    db.contentReviews.toArray(),
    db.wallets.toArray(),
  ])
  return {
    app: 'adulearn',
    format: EXPORT_FORMAT,
    dbVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    note: 'AduLearn local progress export. Contains pseudonymous nicknames and learning records only.',
    profiles: profileId ? profiles.filter((p) => p.id === profileId) : profiles,
    attempts: strip(only(attempts)),
    mastery: only(mastery),
    missionProgress: only(missionProgress),
    bossResults: strip(only(bossResults)),
    assessments: strip(only(assessments)),
    rewards: strip(only(rewards)),
    contentReviews: profileId ? [] : contentReviews,
    wallets: only(wallets),
  }
}

export type ImportResult = { ok: true; profilesAdded: number; profilesSkipped: number; recordsAdded: number } | { ok: false; errors: string[] }

export function parseImport(text: string): { ok: true; bundle: ExportBundle } | { ok: false; errors: string[] } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, errors: ['The file is not valid JSON.'] }
  }
  const parsed = exportSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.slice(0, 8).map((i) => `${i.path.join('.') || 'file'}: ${i.message}`) }
  }
  const b = parsed.data
  const profileIds = new Set(b.profiles.map((p) => p.id))
  const orphan = [...b.wallets, ...b.attempts, ...b.mastery, ...b.missionProgress, ...b.bossResults, ...b.assessments, ...b.rewards].find((r) => !profileIds.has(r.profileId))
  if (orphan) return { ok: false, errors: ['The file contains records for a profile that is not included in it.'] }
  return { ok: true, bundle: b }
}

/**
 * Import a validated bundle. Profiles that already exist on this device are
 * skipped (never overwritten), so an import cannot silently erase progress.
 */
export async function importBundle(text: string): Promise<ImportResult> {
  const parsed = parseImport(text)
  if (!parsed.ok) return parsed
  const b = parsed.bundle
  const db = getDb()
  let recordsAdded = 0
  let profilesAdded = 0
  let profilesSkipped = 0
  await db.transaction('rw', db.tables, async () => {
    const existing = new Set((await db.profiles.toArray()).map((p) => p.id))
    const fresh = new Set<string>()
    for (const p of b.profiles) {
      if (existing.has(p.id)) {
        profilesSkipped++
        continue
      }
      await db.profiles.add(p as ProfileRecord)
      fresh.add(p.id)
      profilesAdded++
    }
    const keep = <T extends { profileId: string }>(rows: T[]) => rows.filter((r) => fresh.has(r.profileId))
    const add = async <T>(table: { bulkAdd: (rows: T[]) => Promise<unknown> }, rows: T[]) => {
      if (rows.length) await table.bulkAdd(rows)
      recordsAdded += rows.length
    }
    await add(db.attempts, keep(b.attempts) as AttemptRecord[])
    await add(db.mastery, keep(b.mastery) as MasteryRecord[])
    await add(db.missionProgress, keep(b.missionProgress) as MissionProgressRecord[])
    await add(db.bossResults, keep(b.bossResults) as BossResultRecord[])
    await add(db.assessments, keep(b.assessments) as AssessmentRecord[])
    await add(db.rewards, keep(b.rewards) as RewardRecord[])
    await add(db.wallets, keep(b.wallets) as WalletRecord[])
  })
  return { ok: true, profilesAdded, profilesSkipped, recordsAdded }
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
