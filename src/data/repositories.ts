/**
 * Repository layer around IndexedDB. UI and services use these functions
 * instead of touching Dexie tables directly, so storage can later be swapped
 * or synchronised with a backend without rewriting game components.
 */
import type { AvatarConfig } from '@/core/avatar'
import type { ReviewStatus } from '@/core/content/types'
import type { ProgressSnapshot } from '@/core/game/progression'
import type { RewardDraft } from '@/core/game/rewards'
import { initialMastery, type MasteryState } from '@/core/learning/mastery'
import {
  getDb,
  type AssessmentRecord,
  type AttemptRecord,
  type BossResultRecord,
  type ContentReviewRecord,
  type MissionProgressRecord,
  type ProfileRecord,
  type RewardRecord,
  type WalletRecord,
} from './db'
import { purchase, type PurchaseResult } from '@/core/game/economy'
import type { RunState } from '@/core/game/missionRun'

function newId(): string {
  const c = globalThis.crypto
  if (c?.randomUUID) return c.randomUUID()
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export const profileRepo = {
  async create(nickname: string, avatar: AvatarConfig, opts: { demo?: boolean } = {}): Promise<ProfileRecord> {
    const now = Date.now()
    const profile: ProfileRecord = { id: newId(), nickname: nickname.trim(), avatar, createdAt: now, lastActiveAt: now, demo: opts.demo }
    await getDb().profiles.add(profile)
    return profile
  },
  get: (id: string) => getDb().profiles.get(id),
  list: () => getDb().profiles.orderBy('lastActiveAt').reverse().toArray(),
  async update(id: string, changes: Partial<Pick<ProfileRecord, 'nickname' | 'avatar'>>) {
    await getDb().profiles.update(id, changes)
  },
  async touch(id: string) {
    await getDb().profiles.update(id, { lastActiveAt: Date.now() })
  },
  /** Remove a profile and all of its learning records. */
  async remove(id: string) {
    const db = getDb()
    await db.transaction('rw', [db.profiles, db.attempts, db.mastery, db.missionProgress, db.activeRuns, db.bossResults, db.assessments, db.rewards], async () => {
      await Promise.all([
        db.attempts.where('profileId').equals(id).delete(),
        db.mastery.where('profileId').equals(id).delete(),
        db.missionProgress.where('profileId').equals(id).delete(),
        db.activeRuns.where('profileId').equals(id).delete(),
        db.bossResults.where('profileId').equals(id).delete(),
        db.assessments.where('profileId').equals(id).delete(),
        db.rewards.where('profileId').equals(id).delete(),
        db.wallets.delete(id),
        db.profiles.delete(id),
      ])
    })
    if ((await settingsRepo.get<string>('activeProfileId')) === id) await settingsRepo.set('activeProfileId', null)
  },
}

// ---------------------------------------------------------------------------
// Settings (small key-value records that belong with the data, e.g. PIN hash)
// ---------------------------------------------------------------------------

export const settingsRepo = {
  async get<T>(key: string): Promise<T | undefined> {
    return (await getDb().settings.get(key))?.value as T | undefined
  },
  async set(key: string, value: unknown) {
    await getDb().settings.put({ key, value })
  },
}

// ---------------------------------------------------------------------------
// Attempts and variant history
// ---------------------------------------------------------------------------

export const attemptRepo = {
  async add(a: Omit<AttemptRecord, 'id'>): Promise<number> {
    return (await getDb().attempts.add(a as AttemptRecord)) as number
  },
  forProfile: (profileId: string) => getDb().attempts.where('profileId').equals(profileId).reverse().sortBy('at'),
  async recent(profileId: string, limit = 60): Promise<AttemptRecord[]> {
    const all = await getDb().attempts.where('profileId').equals(profileId).sortBy('at')
    return all.slice(-limit).reverse()
  },
  /** Fingerprints of recently seen variants, used to avoid repetition. */
  async recentFingerprints(profileId: string, limit = 60): Promise<Set<string>> {
    return new Set((await attemptRepo.recent(profileId, limit)).map((a) => a.fingerprint))
  },
  async everSeen(profileId: string, fingerprint: string): Promise<boolean> {
    return (
      (await getDb()
        .attempts.where('profileId')
        .equals(profileId)
        .filter((a) => a.fingerprint === fingerprint)
        .count()) > 0
    )
  },
  async recentTemplateUse(profileId: string, limit = 20): Promise<Record<string, number>> {
    const use: Record<string, number> = {}
    for (const a of await attemptRepo.recent(profileId, limit)) use[a.templateId] = (use[a.templateId] ?? 0) + 1
    return use
  },
}

// ---------------------------------------------------------------------------
// Mastery
// ---------------------------------------------------------------------------

export const masteryRepo = {
  async get(profileId: string, conceptId: string): Promise<MasteryState> {
    const rec = await getDb().mastery.get([profileId, conceptId])
    if (!rec) return initialMastery(conceptId)
    const { profileId: _p, ...state } = rec
    void _p
    return state
  },
  async put(profileId: string, state: MasteryState) {
    await getDb().mastery.put({ ...state, profileId })
  },
  async forProfile(profileId: string): Promise<Record<string, MasteryState>> {
    const out: Record<string, MasteryState> = {}
    for (const rec of await getDb().mastery.where('profileId').equals(profileId).toArray()) {
      const { profileId: _p, ...state } = rec
      void _p
      out[state.conceptId] = state
    }
    return out
  },
}

// ---------------------------------------------------------------------------
// Missions and active runs
// ---------------------------------------------------------------------------

export const progressRepo = {
  get: (profileId: string, missionId: string) => getDb().missionProgress.get([profileId, missionId]),
  async recordAttemptStart(profileId: string, missionId: string, chapterId: string) {
    const db = getDb()
    const existing = await db.missionProgress.get([profileId, missionId])
    const rec: MissionProgressRecord = existing ? { ...existing, attempts: existing.attempts + 1 } : { profileId, missionId, chapterId, status: 'in-progress', attempts: 1 }
    await db.missionProgress.put(rec)
  },
  async complete(profileId: string, missionId: string, chapterId: string, accuracy: number, stars = 1) {
    const db = getDb()
    const existing = await db.missionProgress.get([profileId, missionId])
    await db.missionProgress.put({
      profileId,
      missionId,
      chapterId,
      attempts: existing?.attempts ?? 1,
      status: 'completed',
      completedAt: existing?.completedAt ?? Date.now(),
      bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, accuracy),
      bestStars: Math.max(existing?.bestStars ?? 0, stars),
    })
  },
  forProfile: (profileId: string) => getDb().missionProgress.where('profileId').equals(profileId).toArray(),
  getActiveRun: (profileId: string, refId: string) => getDb().activeRuns.get([profileId, refId]),
  async saveActiveRun(profileId: string, run: RunState) {
    await getDb().activeRuns.put({ profileId, refId: run.refId, run, updatedAt: Date.now() })
  },
  async clearActiveRun(profileId: string, refId: string) {
    await getDb().activeRuns.delete([profileId, refId])
  },
}

// ---------------------------------------------------------------------------
// Bosses, assessments, rewards
// ---------------------------------------------------------------------------

export const bossRepo = {
  async add(r: Omit<BossResultRecord, 'id'>) {
    await getDb().bossResults.add(r as BossResultRecord)
  },
  forProfile: (profileId: string) => getDb().bossResults.where('profileId').equals(profileId).sortBy('at'),
  async last(profileId: string, bossId: string) {
    const all = await getDb().bossResults.where('[profileId+bossId]').equals([profileId, bossId]).sortBy('at')
    return all.at(-1)
  },
}

export const assessmentRepo = {
  async add(r: Omit<AssessmentRecord, 'id'>) {
    await getDb().assessments.add(r as AssessmentRecord)
  },
  forProfile: (profileId: string) => getDb().assessments.where('profileId').equals(profileId).sortBy('completedAt'),
  async all(profileId: string, chapterId: string, kind: AssessmentRecord['kind']) {
    const all = await getDb().assessments.where('[profileId+chapterId]').equals([profileId, chapterId]).sortBy('completedAt')
    return all.filter((a) => a.kind === kind)
  },
  /** The first diagnostic is the baseline; later retakes do not replace it. */
  first: async (profileId: string, chapterId: string, kind: AssessmentRecord['kind']) => (await assessmentRepo.all(profileId, chapterId, kind))[0],
  latest: async (profileId: string, chapterId: string, kind: AssessmentRecord['kind']) => (await assessmentRepo.all(profileId, chapterId, kind)).at(-1),
}

export const rewardRepo = {
  /** Add rewards; milestones already earned are ignored. Returns newly earned ones. */
  async grant(profileId: string, drafts: RewardDraft[]): Promise<RewardRecord[]> {
    const db = getDb()
    const earned: RewardRecord[] = []
    for (const d of drafts) {
      const exists = await db.rewards.where('[profileId+kind+refId]').equals([profileId, d.kind, d.refId]).count()
      if (exists) continue
      const rec: RewardRecord = { profileId, ...d, earnedAt: Date.now() }
      try {
        await db.rewards.add(rec)
        earned.push(rec)
      } catch {
        // Unique index conflict from a concurrent grant — already earned.
      }
    }
    return earned
  },
  forProfile: (profileId: string) => getDb().rewards.where('profileId').equals(profileId).reverse().sortBy('earnedAt'),
}

// ---------------------------------------------------------------------------
// Wallet (coins, wardrobe, fact scrolls)
// ---------------------------------------------------------------------------

const emptyWallet = (profileId: string): WalletRecord => ({ profileId, coins: 0, totalEarned: 0, owned: [], facts: [], updatedAt: Date.now() })

export const walletRepo = {
  async get(profileId: string): Promise<WalletRecord> {
    return (await getDb().wallets.get(profileId)) ?? emptyWallet(profileId)
  },
  async addCoins(profileId: string, amount: number): Promise<WalletRecord> {
    const db = getDb()
    return db.transaction('rw', db.wallets, async () => {
      const w = (await db.wallets.get(profileId)) ?? emptyWallet(profileId)
      const next = { ...w, coins: w.coins + Math.max(0, amount), totalEarned: w.totalEarned + Math.max(0, amount), updatedAt: Date.now() }
      await db.wallets.put(next)
      return next
    })
  },
  async buy(profileId: string, itemId: string): Promise<PurchaseResult> {
    const db = getDb()
    return db.transaction('rw', db.wallets, async () => {
      const w = (await db.wallets.get(profileId)) ?? emptyWallet(profileId)
      const res = purchase(w, itemId)
      if (res.ok) await db.wallets.put({ ...w, coins: res.coins, owned: res.owned, updatedAt: Date.now() })
      return res
    })
  },
  /** Record a discovered fact scroll. Returns true if it was new. */
  async findFact(profileId: string, factId: string): Promise<boolean> {
    const db = getDb()
    return db.transaction('rw', db.wallets, async () => {
      const w = (await db.wallets.get(profileId)) ?? emptyWallet(profileId)
      if (w.facts.includes(factId)) return false
      await db.wallets.put({ ...w, facts: [...w.facts, factId], updatedAt: Date.now() })
      return true
    })
  },
}

// ---------------------------------------------------------------------------
// Content review overrides
// ---------------------------------------------------------------------------

export const reviewRepo = {
  async overrides(): Promise<Record<string, ReviewStatus>> {
    const out: Record<string, ReviewStatus> = {}
    for (const r of await getDb().contentReviews.toArray()) out[r.templateId] = r.status
    return out
  },
  all: () => getDb().contentReviews.toArray(),
  async set(templateId: string, status: ReviewStatus, note?: string) {
    const rec: ContentReviewRecord = { templateId, status, note, reviewer: 'Local teacher', updatedAt: Date.now() }
    await getDb().contentReviews.put(rec)
  },
  async clear(templateId: string) {
    await getDb().contentReviews.delete(templateId)
  },
}

// ---------------------------------------------------------------------------
// Snapshots for the progression engine
// ---------------------------------------------------------------------------

export async function progressSnapshot(profileId: string): Promise<ProgressSnapshot> {
  const [missions, bosses, assessments] = await Promise.all([progressRepo.forProfile(profileId), bossRepo.forProfile(profileId), assessmentRepo.forProfile(profileId)])
  return {
    completedMissionIds: new Set(missions.filter((m) => m.status === 'completed').map((m) => m.missionId)),
    passedBossIds: new Set(bosses.filter((b) => b.passed).map((b) => b.bossId)),
    completedAssessments: new Set(assessments.map((a) => `${a.chapterId}:${a.kind}`)),
  }
}

/** Clear all local data (used by the confirmed reset action). */
export async function clearAllData() {
  const db = getDb()
  await Promise.all(db.tables.map((t) => t.clear()))
}
