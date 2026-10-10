/**
 * Learning service: orchestrates the pure engine (src/core) with local
 * persistence (src/data). Screens call these functions; they never call the
 * database directly.
 */
import { approvalChecker, conceptName, getAssessment, getBoss, getChapter, getMission, getTemplate, TEMPLATES } from '@/content'
import type { BossBlueprint, ConceptWeight, Difficulty, Mission, QuestionResponse, QuestionTemplate } from '@/core/content/types'
import { generateQuestion, type GeneratedQuestion } from '@/core/engine/generator'
import { createRng, randomSeed } from '@/core/engine/rng'
import { AnswerVault } from '@/core/engine/vault'
import type { GradeResult } from '@/core/engine/grader'
import { evaluateBoss, planBoss, type BossPlanRound, type BossRunState } from '@/core/game/boss'
import { applyOutcome, PRACTICE_GOAL, startRun, type RunRules, type RunState } from '@/core/game/missionRun'
import { isChapterComplete } from '@/core/game/progression'
import { assessmentImprovedReward, bossReward, chapterReward, comebackReward, conceptSecureReward, missionReward, type RewardDraft } from '@/core/game/rewards'
import { chooseNext, pickTemplate, type Decision } from '@/core/learning/adaptive'
import { compareAssessments, planAssessment, type AssessmentItemResult, type AssessmentKind, type PlannedItem } from '@/core/learning/assessment'
import { masteryBand, updateMastery, type EvidenceContext, type MasteryUpdate } from '@/core/learning/mastery'
import type { RewardRecord } from '@/data/db'
import { assessmentRepo, attemptRepo, bossRepo, masteryRepo, progressRepo, progressSnapshot, reviewRepo, rewardRepo, walletRepo } from '@/data/repositories'
import { bossStars, coinsForAnswer, missionStars } from '@/core/game/economy'

/** One vault per browser tab: answer keys never live in React state. */
export const vault = new AnswerVault()

// End-to-end test support. Only compiled into builds made with `--mode e2e`
// (VITE_E2E=true); production builds never expose answers this way.
if (import.meta.env.VITE_E2E === 'true' && typeof window !== 'undefined') {
  ;(window as unknown as { __adulearnTest: unknown }).__adulearnTest = {
    activeInstance: () => document.querySelector<HTMLElement>('[data-instance-id]')?.dataset.instanceId ?? null,
    correctResponse: (instanceId: string) => vault.debugCorrectResponse(instanceId),
  }
}

export async function loadApproval() {
  return approvalChecker(await reviewRepo.overrides())
}

export interface PreparedQuestion {
  question: GeneratedQuestion
  decision: Decision | null
}

async function generateFor(profileId: string, template: QuestionTemplate, opts: { seed?: number; extraExclude?: Set<string> } = {}) {
  const exclude = await attemptRepo.recentFingerprints(profileId)
  for (const f of opts.extraExclude ?? []) exclude.add(f)
  const result = generateQuestion(template, { exclude, seed: opts.seed })
  if (!result) return null
  vault.register(result)
  return result.question
}

/** Adaptive question selection for a mission or practice run. */
export async function nextAdaptiveQuestion(
  profileId: string,
  mix: ConceptWeight[],
  difficultyRange: [Difficulty, Difficulty],
  recent: RunState['recent'],
): Promise<PreparedQuestion | null> {
  const isApproved = await loadApproval()
  const available = new Set(TEMPLATES.filter(isApproved).map((t) => t.conceptId))
  const mastery = await masteryRepo.forProfile(profileId)
  const rng = createRng(randomSeed())
  const decision = chooseNext({ conceptMix: mix, difficultyRange, mastery, recent, availableConcepts: available }, rng)
  if (!decision) return null
  const recentUse = await attemptRepo.recentTemplateUse(profileId)
  const template = pickTemplate({ templates: TEMPLATES, conceptId: decision.conceptId, difficulty: decision.difficulty, recentUse, isApproved }, rng)
  if (!template) return null
  const question = await generateFor(profileId, template)
  return question ? { question, decision } : null
}

export function missionRules(mission: Mission): RunRules {
  return { kind: 'mission', goal: mission.goal, lives: mission.lives }
}

export function practiceRules(): RunRules {
  return { kind: 'practice', goal: PRACTICE_GOAL, lives: null }
}

/** Resume an active mission run (so refreshing cannot restore lives), or start a new one. */
export async function resumeOrStartMission(profileId: string, mission: Mission, opts: { fresh?: boolean } = {}): Promise<RunState> {
  const existing = await progressRepo.getActiveRun(profileId, mission.id)
  if (existing && existing.run.status === 'active' && !opts.fresh) return existing.run
  const run = startRun(`run-${Date.now().toString(36)}`, mission.id, missionRules(mission))
  await progressRepo.recordAttemptStart(profileId, mission.id, mission.chapterId)
  await progressRepo.saveActiveRun(profileId, run)
  return run
}

export interface SubmitInput {
  profileId: string
  question: GeneratedQuestion
  response: QuestionResponse
  hintsUsed: number
  context: EvidenceContext
  refId: string
  selectionReason?: string
  /** Assessments record evidence without showing feedback, but still update mastery. */
}

export type SubmitResult =
  { status: 'graded'; grade: GradeResult; mastery: MasteryUpdate; rewards: RewardRecord[]; coins: number } | { status: 'duplicate' } | { status: 'error'; message: string }

/**
 * Grade a response, record the attempt and update the concept's mastery
 * estimate. Grading consumes the answer key, so duplicate submissions for the
 * same question instance are rejected.
 */
export async function submitAnswer(input: SubmitInput): Promise<SubmitResult> {
  const { question: q } = input
  const graded = vault.grade(q.instanceId, input.response)
  if (graded.status === 'already-graded') return { status: 'duplicate' }
  if (graded.status === 'unknown-question') return { status: 'error', message: 'This question has expired. Please continue to a new one.' }
  const grade = graded.result
  const isNewVariant = !(await attemptRepo.everSeen(input.profileId, q.fingerprint))
  await attemptRepo.add({
    profileId: input.profileId,
    templateId: q.templateId,
    templateVersion: q.templateVersion,
    seed: q.seed,
    fingerprint: q.fingerprint,
    subject: q.subject,
    chapterId: q.chapterId,
    conceptId: q.conceptId,
    difficulty: q.difficulty,
    context: input.context,
    refId: input.refId,
    correct: grade.correct,
    score: grade.score,
    hintsUsed: input.hintsUsed,
    misconceptionId: grade.misconceptionId,
    responseSummary: grade.responseSummary,
    selectionReason: input.selectionReason,
    at: Date.now(),
  })
  const before = await masteryRepo.get(input.profileId, q.conceptId)
  const update = updateMastery(before, {
    correct: grade.correct,
    score: grade.score,
    difficulty: q.difficulty,
    hintsUsed: input.hintsUsed,
    context: input.context,
    fingerprint: q.fingerprint,
    isNewVariant: input.context === 'review' ? false : isNewVariant,
    misconceptionId: grade.misconceptionId,
  })
  await masteryRepo.put(input.profileId, update.state)
  const drafts: RewardDraft[] = []
  if (masteryBand(before) !== 'secure' && masteryBand(update.state) === 'secure') drafts.push(conceptSecureReward(q.conceptId, conceptName(q.conceptId)))
  if (update.correctedMisconception) drafts.push(comebackReward(q.conceptId, update.correctedMisconception, conceptName(q.conceptId)))
  const rewards = drafts.length ? await rewardRepo.grant(input.profileId, drafts) : []
  const coins = coinsForAnswer({ correct: grade.correct, hintsUsed: input.hintsUsed, context: input.context, isNewVariant })
  if (coins > 0) await walletRepo.addCoins(input.profileId, coins)
  return { status: 'graded', grade, mastery: update, rewards, coins }
}

/** Apply a graded outcome to a mission/practice run and persist it. */
export async function recordRunOutcome(profileId: string, run: RunState, rules: RunRules, q: GeneratedQuestion, grade: GradeResult, hintsUsed: number) {
  const res = applyOutcome(run, rules, { instanceId: q.instanceId, conceptId: q.conceptId, difficulty: q.difficulty, correct: grade.correct, hintsUsed })
  if (res.accepted && rules.kind === 'mission') {
    if (res.state.status === 'active') await progressRepo.saveActiveRun(profileId, res.state)
    else await progressRepo.clearActiveRun(profileId, run.refId)
  }
  return res
}

/** Called when a mission run's goal is met. */
export async function completeMission(profileId: string, missionId: string, run: RunState): Promise<RewardRecord[]> {
  const mission = getMission(missionId)
  if (!mission || run.status !== 'complete') return []
  await progressRepo.complete(profileId, mission.id, mission.chapterId, run.answered ? run.correct / run.answered : 0, missionStars(run) || 1)
  await progressRepo.clearActiveRun(profileId, mission.id)
  const drafts: RewardDraft[] = [missionReward(mission.id, mission.title)]
  drafts.push(...(await chapterCompletionDrafts(profileId, mission.chapterId)))
  return rewardRepo.grant(profileId, drafts)
}

async function chapterCompletionDrafts(profileId: string, chapterId: string): Promise<RewardDraft[]> {
  const chapter = getChapter(chapterId)
  if (!chapter) return []
  return isChapterComplete(chapter, await progressSnapshot(profileId)) ? [chapterReward(chapter.id, chapter.title)] : []
}

// ---------------------------------------------------------------------------
// Review mode: revisit previously encountered variants
// ---------------------------------------------------------------------------

export interface ReviewItem {
  attemptId: number
  templateId: string
  seed: number
  conceptId: string
  correct: boolean
  at: number
}

/** Distinct previously-seen variants, missed ones first. */
export async function reviewCandidates(profileId: string, limit = 30): Promise<ReviewItem[]> {
  const isApproved = await loadApproval()
  const attempts = await attemptRepo.recent(profileId, 400)
  const byFingerprint = new Map<string, ReviewItem>()
  for (const a of attempts) {
    if (a.context === 'diagnostic' || a.context === 'followup') continue
    const t = getTemplate(a.templateId)
    if (!t || t.version !== a.templateVersion || !isApproved(t)) continue
    const prev = byFingerprint.get(a.fingerprint)
    if (!prev) byFingerprint.set(a.fingerprint, { attemptId: a.id!, templateId: a.templateId, seed: a.seed, conceptId: a.conceptId, correct: a.correct, at: a.at })
  }
  return [...byFingerprint.values()].sort((x, y) => Number(x.correct) - Number(y.correct) || y.at - x.at).slice(0, limit)
}

export async function regenerateForReview(profileId: string, item: ReviewItem): Promise<GeneratedQuestion | null> {
  const t = getTemplate(item.templateId)
  if (!t) return null
  return generateFor(profileId, t, { seed: item.seed })
}

// ---------------------------------------------------------------------------
// Bosses
// ---------------------------------------------------------------------------

export interface BossPlan {
  blueprint: BossBlueprint
  rounds: BossPlanRound[]
}

export async function planBossForProfile(profileId: string, bossId: string): Promise<{ ok: true; plan: BossPlan } | { ok: false; errors: string[] }> {
  const blueprint = getBoss(bossId)
  if (!blueprint) return { ok: false, errors: ['Unknown challenge'] }
  const last = await bossRepo.last(profileId, bossId)
  const res = planBoss(blueprint, TEMPLATES, await loadApproval(), createRng(randomSeed()), new Set(last?.templateIds ?? []))
  return res.ok ? { ok: true, plan: { blueprint, rounds: res.rounds } } : res
}

export async function bossRoundQuestion(profileId: string, round: BossPlanRound): Promise<GeneratedQuestion | null> {
  const t = getTemplate(round.templateId)
  return t ? generateFor(profileId, t) : null
}

export async function finishBoss(profileId: string, plan: BossPlan, state: BossRunState) {
  const evaluation = evaluateBoss(plan.blueprint, state.results, state.lives)
  await bossRepo.add({
    profileId,
    bossId: plan.blueprint.id,
    chapterId: plan.blueprint.chapterId,
    passed: evaluation.passed,
    ratio: evaluation.ratio,
    results: state.results,
    templateIds: plan.rounds.map((r) => r.templateId),
    stars: bossStars(state.lives, plan.blueprint.lives, evaluation.passed),
    at: Date.now(),
  })
  let rewards: RewardRecord[] = []
  if (evaluation.passed) {
    const drafts = [bossReward(plan.blueprint.id, plan.blueprint.bossName, plan.blueprint.tier), ...(await chapterCompletionDrafts(profileId, plan.blueprint.chapterId))]
    rewards = await rewardRepo.grant(profileId, drafts)
  }
  return { evaluation, rewards }
}

// ---------------------------------------------------------------------------
// Diagnostic and follow-up assessments
// ---------------------------------------------------------------------------

export async function planAssessmentForProfile(profileId: string, chapterId: string, kind: AssessmentKind) {
  const chapter = getChapter(chapterId)
  const blueprint = chapter?.assessmentId ? getAssessment(chapter.assessmentId) : undefined
  if (!chapter || !blueprint) return { ok: false as const, errors: ['No assessment is defined for this chapter.'] }
  // Follow-up checks avoid the variants (and, where possible, the templates) used in earlier checks.
  const earlier = [...(await assessmentRepo.all(profileId, chapterId, 'diagnostic')), ...(kind === 'followup' ? await assessmentRepo.all(profileId, chapterId, 'followup') : [])]
  const items = kind === 'followup' ? earlier.flatMap((a) => a.items) : []
  const res = planAssessment(blueprint, TEMPLATES, await loadApproval(), createRng(randomSeed()), new Set(items.map((i) => i.templateId)))
  if (!res.ok) return res
  return { ok: true as const, items: res.items, avoidFingerprints: new Set(earlier.flatMap((a) => a.items.map((i) => i.fingerprint))) }
}

export async function assessmentQuestion(profileId: string, item: PlannedItem, avoid: Set<string>) {
  const t = getTemplate(item.templateId)
  return t ? generateFor(profileId, t, { extraExclude: avoid }) : null
}

export async function finishAssessment(profileId: string, chapterId: string, kind: AssessmentKind, items: AssessmentItemResult[]) {
  await assessmentRepo.add({ profileId, chapterId, kind, items, completedAt: Date.now() })
  let rewards: RewardRecord[] = []
  if (kind === 'followup') {
    const diag = await assessmentRepo.first(profileId, chapterId, 'diagnostic')
    const chapter = getChapter(chapterId)
    if (diag && chapter) {
      const cmp = compareAssessments(diag, { kind, items, completedAt: Date.now() }, chapter.conceptIds)
      if (cmp.before && cmp.after && cmp.after.correct > cmp.before.correct) rewards = await rewardRepo.grant(profileId, [assessmentImprovedReward(chapterId, chapter.title)])
    }
  }
  return rewards
}
