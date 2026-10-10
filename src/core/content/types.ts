/**
 * Core content types for AduLearn.
 *
 * Everything under `src/core` is platform-agnostic TypeScript: no React, no DOM,
 * no IndexedDB. A future React Native / Expo app can import these modules as-is.
 */
import type { Rng } from '../engine/rng'

export type SubjectId = 'english' | 'mathematics' | 'science'
export type ScienceSubtopic = 'biology' | 'chemistry' | 'physics'
export type Difficulty = 1 | 2 | 3

export const REVIEW_STATUSES = ['draft', 'pending-review', 'approved', 'rejected'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export const QUESTION_TYPES = ['mcq', 'numeric', 'text', 'match', 'order', 'label', 'multi'] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export interface ReviewMeta {
  status: ReviewStatus
  reviewedBy?: string
  reviewedOn?: string
  notes?: string
}

/**
 * Curriculum alignment is tracked separately from content-quality review.
 * Content can be "approved" for the prototype while its alignment with the
 * official AP SSC Class 8 textbook remains unverified.
 */
export interface CurriculumRef {
  alignment: 'unverified-illustrative' | 'verified'
  source?: string
  note?: string
}

// ---------------------------------------------------------------------------
// Question views (safe to show the student — never contain the answer key)
// ---------------------------------------------------------------------------

export interface Choice {
  id: string
  text: string
}

export type DiagramId = 'plant-cell' | 'animal-cell'

export interface McqPartView {
  kind: 'mcq'
  prompt?: string
  choices: Choice[]
}
export interface NumericPartView {
  kind: 'numeric'
  prompt?: string
  unit?: string
  placeholder?: string
}
export interface TextPartView {
  kind: 'text'
  prompt?: string
  mode: 'fill' | 'correction' | 'short'
  placeholder?: string
}
export type PartView = McqPartView | NumericPartView | TextPartView

export interface MatchView {
  kind: 'match'
  left: Choice[]
  right: Choice[]
}
export interface OrderView {
  kind: 'order'
  tokens: Choice[]
}
export interface LabelView {
  kind: 'label'
  diagram: DiagramId
  /** Marker id -> the number shown on the diagram, and which structure position it sits on. */
  markers: { id: string; number: number; position: string }[]
  options: Choice[]
}
export interface MultiView {
  kind: 'multi'
  parts: PartView[]
}

export type QuestionBody = PartView | MatchView | OrderView | LabelView | MultiView

export interface QuestionView {
  /** Short story framing shown above the prompt. */
  context?: string
  prompt: string
  passage?: { title: string; text: string }
  body: QuestionBody
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export type PartResponse = { kind: 'mcq'; choiceId: string | null } | { kind: 'numeric'; value: string } | { kind: 'text'; value: string }

export type QuestionResponse =
  | PartResponse
  | { kind: 'match'; pairs: Record<string, string> }
  | { kind: 'order'; tokenIds: string[] }
  | { kind: 'label'; pairs: Record<string, string> }
  | { kind: 'multi'; parts: PartResponse[] }

// ---------------------------------------------------------------------------
// Answer keys (kept out of views; held in the session vault)
// ---------------------------------------------------------------------------

export interface MisconceptionHint {
  misconceptionId: string
  feedback: string
}

export interface McqPartKey {
  kind: 'mcq'
  correctId: string
  /** Wrong choices that reveal a specific misconception. */
  distractors?: Record<string, MisconceptionHint>
}
export interface NumericPartKey {
  kind: 'numeric'
  value: number
  tolerance?: number
  /** Units the student may type after the number (e.g. "Pa", "cm"). */
  units?: string[]
  misconceptions?: (MisconceptionHint & { value: number })[]
}
export interface TextPartKey {
  kind: 'text'
  accepted: string[]
  caseSensitive?: boolean
  misconceptions?: (MisconceptionHint & { values: string[] })[]
}
export type PartKey = McqPartKey | NumericPartKey | TextPartKey

export interface MatchKey {
  kind: 'match'
  pairs: Record<string, string>
}
export interface OrderKey {
  kind: 'order'
  /** Accepted orderings, expressed as token texts (handles repeated words). */
  accepted: string[][]
}
export interface LabelKey {
  kind: 'label'
  pairs: Record<string, string>
}
export interface MultiKey {
  kind: 'multi'
  parts: PartKey[]
}

export type AnswerKeyBody = PartKey | MatchKey | OrderKey | LabelKey | MultiKey

export interface AnswerKey {
  body: AnswerKeyBody
  /** Human-readable correct answer, shown only after grading. */
  answerDisplay: string
  /** Approved explanation, shown only after grading. */
  explanation: string
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface IntSpec {
  kind: 'int'
  min: number
  max: number
  step?: number
  exclude?: readonly number[]
}
export interface ChoiceSpec<T> {
  kind: 'choice'
  values: readonly T[]
}
export type VarSpec = IntSpec | ChoiceSpec<unknown>
export type VarSpecs = Record<string, VarSpec>
export type VarsOf<S extends VarSpecs> = {
  [K in keyof S]: S[K] extends IntSpec ? number : S[K] extends ChoiceSpec<infer T> ? T : never
}
export type Vars = Record<string, unknown>

export interface BuiltQuestion {
  view: QuestionView
  key: AnswerKey
  hints: string[]
}

export interface TemplateMeta {
  id: string
  version: number
  grade: 8
  subject: SubjectId
  chapterId: string
  conceptId: string
  objective: string
  difficulty: Difficulty
  type: QuestionType
  review: ReviewMeta
  curriculum: CurriculumRef
  /** Assessment mapping: may this template appear in diagnostic/follow-up checks? */
  assessment?: { eligible: boolean; transfer?: boolean }
  /** Story-free label for teacher views. */
  title: string
}

export interface QuestionTemplate extends TemplateMeta {
  variables: VarSpecs
  /** Return null when the variables form a valid instance, otherwise a reason. */
  constraint?: (v: Vars) => string | null
  build: (v: Vars, rng: Rng) => BuiltQuestion
}

export interface TemplateDef<S extends VarSpecs> extends TemplateMeta {
  variables: S
  constraint?: (v: VarsOf<S>) => string | null
  build: (v: VarsOf<S>, rng: Rng) => BuiltQuestion
}

// ---------------------------------------------------------------------------
// Curriculum structure
// ---------------------------------------------------------------------------

export interface Concept {
  id: string
  chapterId: string
  subject: SubjectId
  subtopic?: ScienceSubtopic
  name: string
  objective: string
}

export interface ConceptWeight {
  conceptId: string
  weight: number
}

export interface MissionGoal {
  /** Correct answers required to complete the mission. */
  correct: number
  /** Of those, how many must be at or above a given difficulty. */
  atDifficulty?: { difficulty: Difficulty; count: number }
}

export interface Mission {
  id: string
  chapterId: string
  title: string
  summary: string
  characterId: string
  introSceneId: string
  outroSceneId: string
  conceptMix: ConceptWeight[]
  difficultyRange: [Difficulty, Difficulty]
  goal: MissionGoal
  lives: number
  /** Optional ungraded exploration activity offered before play. */
  lab?: 'pressure' | 'litmus'
}

export interface BossRound {
  conceptId: string
  difficulty: [Difficulty, Difficulty]
  types?: QuestionType[]
  narrative: string
}

export interface BossBlueprint {
  id: string
  chapterId: string
  tier: 'mini' | 'chapter'
  title: string
  bossName: string
  characterId: string
  introSceneId: string
  outroSceneId: string
  rounds: BossRound[]
  passing: { minCorrectRatio: number; perConceptMin: number }
  lives: number
  hintsAllowed: number
  feedback: 'after-each' | 'end-only'
}

export interface AssessmentBlueprint {
  id: string
  chapterId: string
  items: { conceptId: string; difficulty: Difficulty; transfer?: boolean }[]
}

export type ChapterNode =
  | { kind: 'assessment'; id: string; assessment: 'diagnostic' | 'followup'; requires: string[]; optional?: boolean }
  | { kind: 'mission'; id: string; requires: string[] }
  | { kind: 'boss'; id: string; requires: string[] }

export interface Chapter {
  id: string
  regionId: string
  subject: SubjectId
  title: string
  subtitle: string
  status: 'playable' | 'planned'
  curriculum: CurriculumRef
  conceptIds: string[]
  nodes: ChapterNode[]
  assessmentId?: string
}

export type UnlockRule = { kind: 'always' } | { kind: 'missions-completed'; count: number }

export interface Region {
  id: string
  subject: SubjectId
  name: string
  subjectLabel: string
  tagline: string
  description: string
  characterId: string
  unlock: UnlockRule
  chapterIds: string[]
  theme: { primary: string; soft: string; ink: string }
}
