import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_AVATAR } from '@/core/avatar'
import { initialMastery } from '@/core/learning/mastery'
import { AduLearnDB, DB_NAME, getDb, resetDbInstance } from './db'
import { buildExport, importBundle, parseImport } from './exportImport'
import { attemptRepo, masteryRepo, profileRepo, progressRepo, progressSnapshot, rewardRepo, settingsRepo } from './repositories'

async function freshDb() {
  resetDbInstance()
  await Dexie.delete(DB_NAME)
}

beforeEach(freshDb)
afterEach(async () => {
  getDb().close()
  await freshDb()
})

const attempt = (profileId: string, over: Record<string, unknown> = {}) => ({
  profileId,
  templateId: 'math.eq.add-one-step',
  templateVersion: 1,
  seed: 1,
  fingerprint: 'fp-1',
  subject: 'mathematics',
  chapterId: 'math-equations',
  conceptId: 'math.eq.one-step',
  difficulty: 1 as const,
  context: 'mission' as const,
  refId: 'math-m1',
  correct: true,
  score: 1,
  hintsUsed: 0,
  responseSummary: '12',
  at: Date.now(),
  ...over,
})

describe('IndexedDB persistence', () => {
  it('keeps profiles and progress after the database is closed and reopened (like a browser restart)', async () => {
    const p = await profileRepo.create('Asha', DEFAULT_AVATAR)
    await settingsRepo.set('activeProfileId', p.id)
    await attemptRepo.add(attempt(p.id))
    await masteryRepo.put(p.id, { ...initialMastery('math.eq.one-step'), estimate: 0.4, evidence: 1 })
    await progressRepo.complete(p.id, 'math-m1', 'math-equations', 0.8)
    getDb().close()
    resetDbInstance()

    const reopened = getDb()
    await reopened.open()
    expect(await settingsRepo.get('activeProfileId')).toBe(p.id)
    expect((await profileRepo.get(p.id))?.avatar).toEqual(DEFAULT_AVATAR)
    expect(await attemptRepo.recentFingerprints(p.id)).toEqual(new Set(['fp-1']))
    expect((await masteryRepo.get(p.id, 'math.eq.one-step')).estimate).toBe(0.4)
    expect((await progressSnapshot(p.id)).completedMissionIds.has('math-m1')).toBe(true)
  })

  it('stores question variant history per profile', async () => {
    const a = await profileRepo.create('A', DEFAULT_AVATAR)
    const b = await profileRepo.create('B', DEFAULT_AVATAR)
    await attemptRepo.add(attempt(a.id, { fingerprint: 'x' }))
    await attemptRepo.add(attempt(b.id, { fingerprint: 'y' }))
    expect(await attemptRepo.everSeen(a.id, 'x')).toBe(true)
    expect(await attemptRepo.everSeen(a.id, 'y')).toBe(false)
  })

  it('grants each milestone only once', async () => {
    const p = await profileRepo.create('A', DEFAULT_AVATAR)
    const draft = { kind: 'mission-complete' as const, refId: 'math-m1', title: 't', description: 'd' }
    expect(await rewardRepo.grant(p.id, [draft])).toHaveLength(1)
    expect(await rewardRepo.grant(p.id, [draft])).toHaveLength(0)
    expect(await rewardRepo.forProfile(p.id)).toHaveLength(1)
  })

  it('removes all records with a profile', async () => {
    const p = await profileRepo.create('A', DEFAULT_AVATAR)
    await attemptRepo.add(attempt(p.id))
    await profileRepo.remove(p.id)
    expect(await profileRepo.get(p.id)).toBeUndefined()
    expect(await attemptRepo.forProfile(p.id)).toHaveLength(0)
  })
})

describe('database migrations', () => {
  it('upgrades a version 1 database to version 2 and backfills mastery fields', async () => {
    // Create a v1-only database with an old-style mastery record.
    const v1 = new Dexie(DB_NAME)
    v1.version(1).stores({
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
    await v1.open()
    await v1.table('mastery').put({ profileId: 'p1', conceptId: 'c1', estimate: 0.5, evidence: 3, level: 2, streakCorrect: 0, streakIncorrect: 0, updatedAt: 1 })
    v1.close()

    const db = new AduLearnDB()
    await db.open()
    expect(db.verno).toBe(2)
    const m = await db.mastery.get(['p1', 'c1'])
    expect(m).toMatchObject({ estimate: 0.5, correctedMisconceptions: [], independentVariants: [], misconceptions: {} })
    await db.aiCache.put({ key: 'k', text: 't', model: 'm', createdAt: 1 })
    expect(await db.aiCache.count()).toBe(1)
    db.close()
  })
})

describe('export and import', () => {
  it('exports portable JSON and imports it into an empty device', async () => {
    const p = await profileRepo.create('Ravi', DEFAULT_AVATAR)
    await attemptRepo.add(attempt(p.id))
    await masteryRepo.put(p.id, { ...initialMastery('math.eq.one-step'), estimate: 0.3, evidence: 1 })
    const bundle = await buildExport()
    expect(bundle).toMatchObject({ app: 'adulearn', format: 1 })
    expect(bundle.attempts[0]).not.toHaveProperty('id')
    const text = JSON.stringify(bundle)

    getDb().close()
    await freshDb()
    const res = await importBundle(text)
    expect(res).toMatchObject({ ok: true, profilesAdded: 1, profilesSkipped: 0 })
    expect((await profileRepo.list()).map((x) => x.nickname)).toEqual(['Ravi'])
    expect(await attemptRepo.forProfile(p.id)).toHaveLength(1)
  })

  it('never overwrites a profile that already exists', async () => {
    const p = await profileRepo.create('Ravi', DEFAULT_AVATAR)
    const text = JSON.stringify(await buildExport())
    await profileRepo.update(p.id, { nickname: 'Changed' })
    const res = await importBundle(text)
    expect(res).toMatchObject({ ok: true, profilesAdded: 0, profilesSkipped: 1 })
    expect((await profileRepo.get(p.id))?.nickname).toBe('Changed')
  })

  it('exports a single learner on request', async () => {
    const a = await profileRepo.create('A', DEFAULT_AVATAR)
    const b = await profileRepo.create('B', DEFAULT_AVATAR)
    await attemptRepo.add(attempt(a.id))
    await attemptRepo.add(attempt(b.id))
    const only = await buildExport(a.id)
    expect(only.profiles.map((p) => p.id)).toEqual([a.id])
    expect(only.attempts.every((x) => x.profileId === a.id)).toBe(true)
  })

  it('rejects invalid files with clear errors', async () => {
    expect(parseImport('not json')).toMatchObject({ ok: false })
    expect(parseImport(JSON.stringify({ app: 'other' }))).toMatchObject({ ok: false })
    const p = await profileRepo.create('A', DEFAULT_AVATAR)
    const bundle = await buildExport()
    const tampered = { ...bundle, profiles: [{ ...bundle.profiles[0], avatar: { ...DEFAULT_AVATAR, skin: 'purple' } }] }
    expect(parseImport(JSON.stringify(tampered))).toMatchObject({ ok: false })
    const orphan = { ...bundle, profiles: [], attempts: [attempt(p.id)] }
    const r = parseImport(JSON.stringify(orphan))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors[0]).toMatch(/profile/)
    expect(await importBundle('{"app":"adulearn"}')).toMatchObject({ ok: false })
  })
})
