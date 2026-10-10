import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getMission, TEMPLATES } from '@/content'
import { DEFAULT_AVATAR } from '@/core/avatar'
import { DB_NAME, getDb, resetDbInstance } from '@/data/db'
import { attemptRepo, masteryRepo, profileRepo, progressRepo, reviewRepo, rewardRepo } from '@/data/repositories'
import { completeMission, missionRules, nextAdaptiveQuestion, recordRunOutcome, resumeOrStartMission, submitAnswer, vault } from './learning'

let profileId: string
const mix = [{ conceptId: 'math.eq.one-step', weight: 1 }]

beforeEach(async () => {
  resetDbInstance()
  await Dexie.delete(DB_NAME)
  profileId = (await profileRepo.create('Tester', DEFAULT_AVATAR)).id
})
afterEach(() => getDb().close())

async function answer(correct: boolean) {
  const p = (await nextAdaptiveQuestion(profileId, mix, [1, 2], []))!
  const right = vault.debugCorrectResponse(p.question.instanceId)!
  const response = correct
    ? right
    : right.kind === 'numeric'
      ? { kind: 'numeric' as const, value: '99999' }
      : right.kind === 'mcq'
        ? { kind: 'mcq' as const, choiceId: 'none' }
        : right
  return { p, res: await submitAnswer({ profileId, question: p.question, response, hintsUsed: 0, context: 'mission', refId: 'math-m1' }) }
}

describe('content review enforcement', () => {
  it('never serves rejected templates to students', async () => {
    const oneStep = TEMPLATES.filter((t) => t.conceptId === 'math.eq.one-step' && t.review.status === 'approved')
    for (const t of oneStep.slice(1)) await reviewRepo.set(t.id, 'rejected')
    for (let i = 0; i < 12; i++) {
      const p = await nextAdaptiveQuestion(profileId, mix, [1, 2], [])
      expect(p?.question.templateId).toBe(oneStep[0].id)
    }
  })

  it('serves nothing when no approved content exists', async () => {
    for (const t of TEMPLATES.filter((x) => x.conceptId === 'math.eq.one-step')) await reviewRepo.set(t.id, 'pending-review')
    expect(await nextAdaptiveQuestion(profileId, mix, [1, 2], [])).toBeNull()
  })

  it('serves a pending template once a teacher approves it', async () => {
    await reviewRepo.set('math.eq.decimal-one-step', 'approved')
    for (const t of TEMPLATES.filter((x) => x.conceptId === 'math.eq.one-step' && x.id !== 'math.eq.decimal-one-step')) await reviewRepo.set(t.id, 'rejected')
    expect((await nextAdaptiveQuestion(profileId, mix, [1, 2], []))?.question.templateId).toBe('math.eq.decimal-one-step')
  })
})

describe('answer submission', () => {
  it('records the attempt, variant fingerprint and mastery update', async () => {
    const { p, res } = await answer(true)
    expect(res.status).toBe('graded')
    const attempts = await attemptRepo.forProfile(profileId)
    expect(attempts).toHaveLength(1)
    expect(attempts[0]).toMatchObject({ fingerprint: p.question.fingerprint, seed: p.question.seed, correct: true, context: 'mission' })
    expect((await masteryRepo.get(profileId, 'math.eq.one-step')).evidence).toBe(1)
  })

  it('rejects a duplicate submission for the same question', async () => {
    const { p } = await answer(true)
    const again = await submitAnswer({ profileId, question: p.question, response: { kind: 'numeric', value: '1' }, hintsUsed: 0, context: 'mission', refId: 'math-m1' })
    expect(again.status).toBe('duplicate')
    expect(await attemptRepo.forProfile(profileId)).toHaveLength(1)
  })

  it('avoids repeating recently seen variants', async () => {
    const seen = new Set<string>()
    for (let i = 0; i < 10; i++) {
      const { p } = await answer(true)
      expect(seen.has(p.question.fingerprint)).toBe(false)
      seen.add(p.question.fingerprint)
    }
  })

  it('grants a comeback milestone when a misconception is later fixed independently', async () => {
    // Force a misconception on the add template.
    for (const t of TEMPLATES.filter((x) => x.conceptId === 'math.eq.one-step' && x.id !== 'math.eq.add-one-step')) await reviewRepo.set(t.id, 'rejected')
    const p = (await nextAdaptiveQuestion(profileId, mix, [1, 2], []))!
    const view = p.question.view
    const nums = view.prompt.match(/\d+/g)!.map(Number)
    await submitAnswer({ profileId, question: p.question, response: { kind: 'numeric', value: String(nums[0] + nums[1]) }, hintsUsed: 0, context: 'mission', refId: 'math-m1' })
    expect(Object.keys((await masteryRepo.get(profileId, 'math.eq.one-step')).misconceptions)).toEqual(['math.inverse-operation'])
    const { res } = await answer(true)
    expect(res.status === 'graded' && res.rewards.map((r) => r.kind)).toContain('misconception-corrected')
  })
})

describe('mission runs with persistence', () => {
  it('keeps hearts across a refresh instead of restoring them', async () => {
    const mission = getMission('math-m1')!
    const run = await resumeOrStartMission(profileId, mission)
    const { p, res } = await answer(false)
    if (res.status !== 'graded') throw new Error('not graded')
    const applied = await recordRunOutcome(profileId, run, missionRules(mission), p.question, res.grade, 0)
    expect(applied.state.lives).toBe(2)
    const resumed = await resumeOrStartMission(profileId, mission)
    expect(resumed.lives).toBe(2)
    expect(resumed.runId).toBe(run.runId)
  })

  it('completes a mission only when the run goal is met, and grants the milestone once', async () => {
    const mission = getMission('math-m1')!
    let run = await resumeOrStartMission(profileId, mission)
    expect(await completeMission(profileId, mission.id, run)).toEqual([])
    run = { ...run, status: 'complete', correct: 5, answered: 6 }
    const rewards = await completeMission(profileId, mission.id, run)
    expect(rewards.map((r) => r.kind)).toEqual(['mission-complete'])
    expect((await progressRepo.get(profileId, mission.id))?.status).toBe('completed')
    expect(await completeMission(profileId, mission.id, run)).toEqual([])
    expect(await rewardRepo.forProfile(profileId)).toHaveLength(1)
  })
})
