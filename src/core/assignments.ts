/**
 * Teacher-made assignments (tests and quizzes). Platform-agnostic: no React,
 * no storage. Questions are graded with the same deterministic grader as the
 * game, so "5/2" = "2.5", accepted spellings, units and so on all work.
 */
import { grade } from './engine/grader'
import type { AnswerKey, QuestionResponse, SubjectId } from './content/types'

export type AssignmentQuestion =
  | { id: string; kind: 'mcq'; prompt: string; options: { id: string; text: string }[]; correctId: string; explanation?: string }
  | { id: string; kind: 'short'; prompt: string; accepted: string[]; explanation?: string }
  | { id: string; kind: 'number'; prompt: string; value: number; tolerance?: number; unit?: string; explanation?: string }

export type AssignmentSubject = SubjectId | 'general'

export interface Assignment {
  id: string
  title: string
  instructions: string
  subject: AssignmentSubject
  questions: AssignmentQuestion[]
  /** Attempts each student may make; null = unlimited. */
  maxAttempts: number | null
  /** Optional due date (epoch ms, end of day). Students can still submit late; it is marked. */
  dueAt?: number
  /** Whether students see the correct answers after submitting. */
  showAnswers: boolean
  status: 'draft' | 'published'
  createdAt: number
  updatedAt: number
}

export interface QuestionResult {
  questionId: string
  correct: boolean
  /** What the student answered, in words. */
  given: string
  /** The correct answer, in words. */
  expected: string
}

export interface AssignmentAttempt {
  id?: number
  assignmentId: string
  profileId: string
  answers: Record<string, string>
  results: QuestionResult[]
  correct: number
  total: number
  /** 0–100 */
  percent: number
  late: boolean
  submittedAt: number
}

export const SUBJECT_LABELS: Record<AssignmentSubject, string> = {
  general: 'General',
  english: 'English',
  mathematics: 'Mathematics',
  science: 'Science',
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export function blankQuestion(kind: AssignmentQuestion['kind']): AssignmentQuestion {
  const id = newId('q')
  if (kind === 'mcq')
    return {
      id,
      kind,
      prompt: '',
      options: [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
      ],
      correctId: 'a',
    }
  if (kind === 'short') return { id, kind, prompt: '', accepted: [''] }
  return { id, kind, prompt: '', value: 0 }
}

export function blankAssignment(): Assignment {
  const now = Date.now()
  return {
    id: newId('asg'),
    title: '',
    instructions: '',
    subject: 'general',
    questions: [blankQuestion('mcq')],
    maxAttempts: 2,
    showAnswers: true,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  }
}

/** Problems that stop an assignment from being published (empty = ready). */
export function validateAssignment(a: Assignment): string[] {
  const problems: string[] = []
  if (!a.title.trim()) problems.push('Give the assignment a title.')
  if (a.questions.length === 0) problems.push('Add at least one question.')
  if (a.maxAttempts !== null && (!Number.isInteger(a.maxAttempts) || a.maxAttempts < 1)) problems.push('Attempts must be 1 or more (or unlimited).')
  a.questions.forEach((q, i) => {
    const n = `Question ${i + 1}`
    if (!q.prompt.trim()) problems.push(`${n}: write the question.`)
    if (q.kind === 'mcq') {
      const filled = q.options.filter((o) => o.text.trim())
      if (filled.length < 2) problems.push(`${n}: give at least two answer options.`)
      if (!q.options.some((o) => o.id === q.correctId && o.text.trim())) problems.push(`${n}: mark which option is correct.`)
      const texts = filled.map((o) => o.text.trim().toLowerCase())
      if (new Set(texts).size !== texts.length) problems.push(`${n}: two options are the same.`)
    }
    if (q.kind === 'short' && !q.accepted.some((x) => x.trim())) problems.push(`${n}: add at least one accepted answer.`)
    if (q.kind === 'number' && !Number.isFinite(q.value)) problems.push(`${n}: the correct answer must be a number.`)
  })
  return problems
}

/** Clean up an assignment before saving: trim text and drop empty options/answers. */
export function tidyAssignment(a: Assignment): Assignment {
  return {
    ...a,
    title: a.title.trim(),
    instructions: a.instructions.trim(),
    questions: a.questions.map((q) => {
      const base = { ...q, prompt: q.prompt.trim(), explanation: q.explanation?.trim() || undefined }
      if (q.kind === 'mcq') return { ...base, kind: 'mcq', options: q.options.filter((o) => o.text.trim()).map((o) => ({ ...o, text: o.text.trim() })), correctId: q.correctId }
      if (q.kind === 'short') return { ...base, kind: 'short', accepted: q.accepted.map((x) => x.trim()).filter(Boolean) }
      return { ...base, kind: 'number', value: q.value, tolerance: q.tolerance, unit: q.unit?.trim() || undefined }
    }) as AssignmentQuestion[],
  }
}

function keyFor(q: AssignmentQuestion): AnswerKey {
  const explanation = q.explanation || 'No explanation was added.'
  if (q.kind === 'mcq') return { body: { kind: 'mcq', correctId: q.correctId }, answerDisplay: expectedText(q), explanation }
  if (q.kind === 'short') return { body: { kind: 'text', accepted: q.accepted }, answerDisplay: expectedText(q), explanation }
  return { body: { kind: 'numeric', value: q.value, tolerance: q.tolerance, units: q.unit ? [q.unit.toLowerCase()] : undefined }, answerDisplay: expectedText(q), explanation }
}

export function expectedText(q: AssignmentQuestion): string {
  if (q.kind === 'mcq') return q.options.find((o) => o.id === q.correctId)?.text ?? ''
  if (q.kind === 'short') return q.accepted[0] ?? ''
  return `${q.value}${q.unit ? ` ${q.unit}` : ''}`
}

function givenText(q: AssignmentQuestion, answer: string): string {
  if (!answer.trim()) return '(no answer)'
  if (q.kind === 'mcq') return q.options.find((o) => o.id === answer)?.text ?? '(no answer)'
  return answer.trim()
}

/** Grade a full submission. Unanswered questions count as wrong. */
export function gradeAssignment(a: Assignment, answers: Record<string, string>): Pick<AssignmentAttempt, 'results' | 'correct' | 'total' | 'percent'> {
  const results = a.questions.map((q): QuestionResult => {
    const answer = answers[q.id] ?? ''
    let correct = false
    if (answer.trim()) {
      const response: QuestionResponse =
        q.kind === 'mcq' ? { kind: 'mcq', choiceId: answer } : q.kind === 'short' ? { kind: 'text', value: answer } : { kind: 'numeric', value: answer }
      correct = grade(keyFor(q), response).correct
    }
    return { questionId: q.id, correct, given: givenText(q, answer), expected: expectedText(q) }
  })
  const correct = results.filter((r) => r.correct).length
  const total = results.length
  return { results, correct, total, percent: total ? Math.round((correct / total) * 100) : 0 }
}

export function attemptsLeft(a: Assignment, used: number): number | null {
  return a.maxAttempts === null ? null : Math.max(0, a.maxAttempts - used)
}

export const isOverdue = (a: Assignment, now = Date.now()) => a.dueAt !== undefined && now > a.dueAt

export function bestAttempt(attempts: AssignmentAttempt[]): AssignmentAttempt | undefined {
  return attempts.reduce<AssignmentAttempt | undefined>((best, x) => (!best || x.percent > best.percent ? x : best), undefined)
}

/** A ready-made quiz so a teacher can see the flow straight away. */
export function sampleAssignment(): Assignment {
  const now = Date.now()
  return {
    id: newId('asg'),
    title: 'Weekly check: equations, articles and pressure',
    instructions: 'Answer every question. You can use rough paper. Your best score counts.',
    subject: 'general',
    maxAttempts: 3,
    showAnswers: true,
    dueAt: endOfDay(now + 7 * 24 * 3600 * 1000),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    questions: [
      { id: newId('q'), kind: 'number', prompt: 'Solve for x: x + 7 = 19', value: 12, explanation: 'Subtract 7 from both sides: x = 19 − 7 = 12.' },
      {
        id: newId('q'),
        kind: 'mcq',
        prompt: 'Choose the right article: “She ate ___ apple.”',
        options: [
          { id: 'a', text: 'a' },
          { id: 'b', text: 'an' },
          { id: 'c', text: 'the' },
        ],
        correctId: 'b',
        explanation: '“Apple” starts with a vowel sound, so we use “an”.',
      },
      {
        id: newId('q'),
        kind: 'number',
        prompt: 'A box pushes down with 200 N on an area of 4 m². What is the pressure?',
        value: 50,
        unit: 'Pa',
        explanation: 'Pressure = force ÷ area = 200 ÷ 4 = 50 Pa.',
      },
      {
        id: newId('q'),
        kind: 'short',
        prompt: 'Which part of a plant cell makes food using sunlight?',
        accepted: ['chloroplast', 'chloroplasts'],
        explanation: 'Chloroplasts contain chlorophyll and make food by photosynthesis.',
      },
      {
        id: newId('q'),
        kind: 'mcq',
        prompt: 'Which of these is a non-metal?',
        options: [
          { id: 'a', text: 'Copper' },
          { id: 'b', text: 'Sulphur' },
          { id: 'c', text: 'Iron' },
          { id: 'd', text: 'Zinc' },
        ],
        correctId: 'b',
        explanation: 'Sulphur is a brittle, dull, non-conducting non-metal.',
      },
    ],
  }
}

export function endOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}
