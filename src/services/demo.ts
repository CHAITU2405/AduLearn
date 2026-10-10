/**
 * Development-only demo data. Creates a clearly labelled sample profile so the
 * teacher dashboard can be demonstrated without real student records.
 * Records go through the real engine (generation, grading, mastery rules).
 */
import { MISSIONS, TEMPLATES, approvalChecker } from '@/content'
import { DEFAULT_AVATAR } from '@/core/avatar'
import type { QuestionResponse } from '@/core/content/types'
import { generateQuestion } from '@/core/engine/generator'
import { grade } from '@/core/engine/grader'
import { createRng } from '@/core/engine/rng'
import { initialMastery, updateMastery, type MasteryState } from '@/core/learning/mastery'
import { attemptRepo, assessmentRepo, masteryRepo, profileRepo, progressRepo, reviewRepo } from '@/data/repositories'

function wrongResponse(kind: string): QuestionResponse {
  switch (kind) {
    case 'mcq':
      return { kind: 'mcq', choiceId: 'zz' }
    case 'numeric':
      return { kind: 'numeric', value: '-999' }
    case 'text':
      return { kind: 'text', value: 'zzz' }
    case 'match':
      return { kind: 'match', pairs: {} }
    case 'label':
      return { kind: 'label', pairs: {} }
    case 'order':
      return { kind: 'order', tokenIds: [] }
    default:
      return { kind: 'multi', parts: [] }
  }
}

export async function createDemoProfile(): Promise<string> {
  const rng = createRng(20261010)
  const profile = await profileRepo.create('Demo Explorer', { ...DEFAULT_AVATAR, outfitColor: '#eab308' }, { demo: true })
  const isApproved = approvalChecker(await reviewRepo.overrides())
  const mastery: Record<string, MasteryState> = {}
  let t = Date.now() - 1000 * 60 * 60 * 24 * 3
  const missions = MISSIONS.filter((m) => m.chapterId === 'math-equations').slice(0, 2)
  for (const mission of missions) {
    for (let i = 0; i < 9; i++) {
      const conceptId = mission.conceptMix[i % mission.conceptMix.length].conceptId
      const pool = TEMPLATES.filter((x) => x.conceptId === conceptId && isApproved(x))
      const template = rng.pick(pool)
      const gen = generateQuestion(template, { seedSource: () => Math.floor(rng.next() * 1e9) })
      if (!gen) continue
      const correct = rng.next() < 0.45 + i * 0.05
      const g = correct ? { correct: true, score: 1, responseSummary: 'demo', misconceptionId: undefined } : grade(gen.key, wrongResponse(template.type))
      const misconceptionId = correct ? undefined : (g.misconceptionId ?? (gen.key.body.kind === 'numeric' ? gen.key.body.misconceptions?.[0]?.misconceptionId : undefined))
      t += 1000 * 60 * 3
      await attemptRepo.add({
        profileId: profile.id,
        templateId: template.id,
        templateVersion: template.version,
        seed: gen.question.seed,
        fingerprint: gen.question.fingerprint,
        subject: template.subject,
        chapterId: template.chapterId,
        conceptId,
        difficulty: template.difficulty,
        context: 'mission',
        refId: mission.id,
        correct,
        score: correct ? 1 : 0,
        hintsUsed: i % 4 === 0 ? 1 : 0,
        misconceptionId,
        responseSummary: 'demo data',
        selectionReason: 'Demo data',
        at: t,
      })
      const prev = mastery[conceptId] ?? initialMastery(conceptId)
      mastery[conceptId] = updateMastery(prev, {
        correct,
        difficulty: template.difficulty,
        hintsUsed: i % 4 === 0 ? 1 : 0,
        context: 'mission',
        fingerprint: gen.question.fingerprint,
        isNewVariant: true,
        misconceptionId,
        at: t,
      }).state
    }
    await progressRepo.recordAttemptStart(profile.id, mission.id, mission.chapterId)
    await progressRepo.complete(profile.id, mission.id, mission.chapterId, 0.7)
  }
  for (const m of Object.values(mastery)) await masteryRepo.put(profile.id, m)
  await assessmentRepo.add({
    profileId: profile.id,
    chapterId: 'math-equations',
    kind: 'diagnostic',
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    items: [
      { conceptId: 'math.eq.one-step', templateId: 'math.eq.mul-one-step', fingerprint: 'demo-1', correct: true, transfer: false },
      { conceptId: 'math.eq.two-step', templateId: 'math.eq.two-step-basic', fingerprint: 'demo-2', correct: false, transfer: false },
      { conceptId: 'math.eq.both-sides', templateId: 'math.eq.both-simple', fingerprint: 'demo-3', correct: false, transfer: false },
      { conceptId: 'math.eq.word', templateId: 'math.eq.word-ages', fingerprint: 'demo-4', correct: false, transfer: false },
      { conceptId: 'math.eq.word', templateId: 'math.eq.word-cables-multi', fingerprint: 'demo-5', correct: false, transfer: true },
    ],
  })
  return profile.id
}

export async function removeDemoProfiles(): Promise<number> {
  const demos = (await profileRepo.list()).filter((p) => p.demo)
  for (const p of demos) await profileRepo.remove(p.id)
  return demos.length
}
