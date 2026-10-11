import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Assignment, AssignmentAttempt } from '@/core/assignments'
import type { AvatarConfig } from '@/core/avatar'
import type { Difficulty, ReviewStatus } from '@/core/content/types'
import type { BossRoundResult } from '@/core/game/boss'
import type { RunState } from '@/core/game/missionRun'
import type { RewardKind } from '@/core/game/rewards'
import type { AssessmentItemResult, AssessmentKind } from '@/core/learning/assessment'
import type { EvidenceContext, MasteryState } from '@/core/learning/mastery'

/**
 * Local IndexedDB schema (via Dexie).
 *
 * Only pseudonymous data is stored: a random profile id, a nickname chosen by
 * the student, and learning records. No real names, contact details or location.
 */

export interface ProfileRecord {
  id: string
  nickname: string
  avatar: AvatarConfig
  createdAt: number
  lastActiveAt: number
  /** True for records created by the explicit demo-data generator. */
  demo?: boolean
}

export interface AttemptRecord {
  id?: number
  profileId: string
  templateId: string
  templateVersion: number
  seed: number
  fingerprint: string
  subject: string
  chapterId: string
  conceptId: string
  difficulty: Difficulty
  context: EvidenceContext
  /** Mission, boss or assessment id the attempt belongs to. */
  refId: string
  correct: boolean
  score: number
  hintsUsed: number
  misconceptionId?: string
  responseSummary: string
  /** The adaptive engine's reason for choosing this question. */
  selectionReason?: string
  at: number
}

export interface MasteryRecord extends MasteryState {
  profileId: string
}

export interface MissionProgressRecord {
  profileId: string
  missionId: string
  chapterId: string
  status: 'in-progress' | 'completed'
  attempts: number
  completedAt?: number
  bestAccuracy?: number
  /** Best star rating (1–3) achieved. */
  bestStars?: number
}

export interface ActiveRunRecord {
  profileId: string
  /** Mission id (one active run per mission per profile). */
  refId: string
  run: RunState
  updatedAt: number
}

export interface BossResultRecord {
  id?: number
  profileId: string
  bossId: string
  chapterId: string
  passed: boolean
  ratio: number
  results: BossRoundResult[]
  templateIds: string[]
  stars?: number
  at: number
}

export interface AssessmentRecord {
  id?: number
  profileId: string
  chapterId: string
  kind: AssessmentKind
  items: AssessmentItemResult[]
  completedAt: number
}

export interface RewardRecord {
  id?: number
  profileId: string
  kind: RewardKind
  refId: string
  title: string
  description: string
  earnedAt: number
}

export interface ContentReviewRecord {
  templateId: string
  status: ReviewStatus
  note?: string
  reviewer?: string
  updatedAt: number
}

export interface SettingRecord {
  key: string
  value: unknown
}

export interface AiCacheRecord {
  key: string
  text: string
  model: string
  createdAt: number
}

/** Game wallet: coins, purchased cosmetics and discovered fact scrolls. */
export interface WalletRecord {
  profileId: string
  coins: number
  totalEarned: number
  owned: string[]
  facts: string[]
  updatedAt: number
}

export const DB_NAME = 'adulearn'
export const DB_VERSION = 4

export class AduLearnDB extends Dexie {
  profiles!: EntityTable<ProfileRecord, 'id'>
  attempts!: EntityTable<AttemptRecord, 'id'>
  mastery!: Table<MasteryRecord, [string, string]>
  missionProgress!: Table<MissionProgressRecord, [string, string]>
  activeRuns!: Table<ActiveRunRecord, [string, string]>
  bossResults!: EntityTable<BossResultRecord, 'id'>
  assessments!: EntityTable<AssessmentRecord, 'id'>
  rewards!: EntityTable<RewardRecord, 'id'>
  contentReviews!: EntityTable<ContentReviewRecord, 'templateId'>
  settings!: EntityTable<SettingRecord, 'key'>
  aiCache!: EntityTable<AiCacheRecord, 'key'>
  wallets!: EntityTable<WalletRecord, 'profileId'>
  assignments!: EntityTable<Assignment, 'id'>
  assignmentAttempts!: EntityTable<AssignmentAttempt, 'id'>

  constructor(name = DB_NAME) {
    super(name)
    // Version 1: initial prototype schema.
    this.version(1).stores({
      profiles: 'id, lastActiveAt',
      attempts: '++id, profileId, [profileId+conceptId], [profileId+templateId], [profileId+refId], at',
      mastery: '[profileId+conceptId], profileId',
      missionProgress: '[profileId+missionId], profileId, chapterId',
      activeRuns: '[profileId+refId], profileId',
      bossResults: '++id, profileId, [profileId+bossId], at',
      assessments: '++id, profileId, [profileId+chapterId], at',
      rewards: '++id, profileId, &[profileId+kind+refId]',
      contentReviews: 'templateId',
      settings: 'key',
    })
    // Version 2: adds the AI response cache and backfills mastery fields
    // introduced after v1 (corrected misconceptions tracking).
    this.version(2)
      .stores({ aiCache: 'key, createdAt' })
      .upgrade(async (tx) => {
        await tx
          .table('mastery')
          .toCollection()
          .modify((m: Partial<MasteryRecord>) => {
            m.correctedMisconceptions ??= []
            m.independentVariants ??= []
            m.misconceptions ??= {}
          })
      })
    // Version 3: game wallet. Existing explorers receive coins for the correct
    // answers they had already given (10 each, excluding diagnostic checks).
    this.version(3)
      .stores({ wallets: 'profileId' })
      .upgrade(async (tx) => {
        const profiles = (await tx.table('profiles').toArray()) as ProfileRecord[]
        for (const p of profiles) {
          const correct = await tx
            .table('attempts')
            .where('profileId')
            .equals(p.id)
            .filter((a: AttemptRecord) => a.correct && a.context !== 'diagnostic' && a.context !== 'followup')
            .count()
          await tx.table('wallets').put({ profileId: p.id, coins: correct * 10, totalEarned: correct * 10, owned: [], facts: [], updatedAt: Date.now() } satisfies WalletRecord)
        }
      })
    // Version 4: teacher-made assignments and students' attempts at them.
    this.version(4).stores({
      assignments: 'id, status, updatedAt',
      assignmentAttempts: '++id, assignmentId, profileId, [assignmentId+profileId], submittedAt',
    })
  }
}

let instance: AduLearnDB | null = null

export function getDb(): AduLearnDB {
  instance ??= new AduLearnDB()
  return instance
}

/** Test helper: use a fresh database (with an optional name). */
export function resetDbInstance(db?: AduLearnDB): void {
  instance = db ?? null
}

export type DbStatus = { ok: true } | { ok: false; message: string }

/** Open the database, reporting a friendly error if IndexedDB is unavailable. */
export async function openDatabase(): Promise<DbStatus> {
  try {
    if (typeof indexedDB === 'undefined') return { ok: false, message: 'This browser does not support local storage (IndexedDB).' }
    await getDb().open()
    return { ok: true }
  } catch (err) {
    const e = err as Error
    const hint =
      e.name === 'InvalidStateError' || /private|denied|security/i.test(e.message)
        ? 'Local storage may be blocked (for example in a private window or by browser settings).'
        : 'The local database could not be opened.'
    return { ok: false, message: `${hint} (${e.name}: ${e.message})` }
  }
}
