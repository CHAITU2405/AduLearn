import { describe, expect, it } from 'vitest'
import {
  attemptsLeft,
  bestAttempt,
  blankAssignment,
  gradeAssignment,
  isOverdue,
  sampleAssignment,
  tidyAssignment,
  validateAssignment,
  type Assignment,
  type AssignmentAttempt,
} from './assignments'

function quiz(): Assignment {
  return {
    ...blankAssignment(),
    title: 'Check',
    questions: [
      {
        id: 'q1',
        kind: 'mcq',
        prompt: 'Pick b',
        options: [
          { id: 'a', text: 'A' },
          { id: 'b', text: 'B' },
        ],
        correctId: 'b',
      },
      { id: 'q2', kind: 'short', prompt: 'Green part?', accepted: ['chloroplast', 'chloroplasts'] },
      { id: 'q3', kind: 'number', prompt: '200 ÷ 4', value: 50, unit: 'Pa' },
    ],
  }
}

describe('validateAssignment', () => {
  it('accepts a complete assignment and the sample quiz', () => {
    expect(validateAssignment(quiz())).toEqual([])
    expect(validateAssignment(sampleAssignment())).toEqual([])
  })

  it('reports missing title, prompts, options and answers', () => {
    const a = blankAssignment()
    const problems = validateAssignment(a)
    expect(problems).toContain('Give the assignment a title.')
    expect(problems).toContain('Question 1: write the question.')
    expect(problems).toContain('Question 1: give at least two answer options.')
    expect(validateAssignment({ ...quiz(), questions: [] })).toContain('Add at least one question.')
    expect(validateAssignment({ ...quiz(), questions: [{ id: 'x', kind: 'short', prompt: 'P', accepted: [' '] }] })).toContain('Question 1: add at least one accepted answer.')
  })

  it('catches duplicate options and a blank correct option', () => {
    const a = quiz()
    a.questions[0] = {
      id: 'q1',
      kind: 'mcq',
      prompt: 'Dup',
      options: [
        { id: 'a', text: 'Same' },
        { id: 'b', text: 'same ' },
        { id: 'c', text: '' },
      ],
      correctId: 'c',
    }
    const problems = validateAssignment(a)
    expect(problems).toContain('Question 1: two options are the same.')
    expect(problems).toContain('Question 1: mark which option is correct.')
  })
})

describe('tidyAssignment', () => {
  it('trims text and drops empty options and answers', () => {
    const a = quiz()
    a.title = '  Check  '
    a.questions[0] = {
      ...(a.questions[0] as Extract<Assignment['questions'][number], { kind: 'mcq' }>),
      options: [
        { id: 'a', text: ' A ' },
        { id: 'b', text: 'B' },
        { id: 'c', text: ' ' },
      ],
    }
    a.questions[1] = { id: 'q2', kind: 'short', prompt: ' Q ', accepted: [' x ', ''] }
    const t = tidyAssignment(a)
    expect(t.title).toBe('Check')
    expect(t.questions[0]).toMatchObject({ options: [{ text: 'A' }, { text: 'B' }] })
    expect(t.questions[1]).toMatchObject({ prompt: 'Q', accepted: ['x'] })
  })
})

describe('gradeAssignment', () => {
  it('grades all question kinds with the game grader', () => {
    const r = gradeAssignment(quiz(), { q1: 'b', q2: 'Chloroplasts', q3: '50 pa' })
    expect(r).toMatchObject({ correct: 3, total: 3, percent: 100 })
  })

  it('counts empty answers as wrong and reports given/expected text', () => {
    const r = gradeAssignment(quiz(), { q1: 'a', q3: '' })
    expect(r).toMatchObject({ correct: 0, total: 3, percent: 0 })
    expect(r.results[0]).toEqual({ questionId: 'q1', correct: false, given: 'A', expected: 'B' })
    expect(r.results[1].given).toBe('(no answer)')
    expect(r.results[2].expected).toBe('50 Pa')
  })

  it('rounds the percentage', () => {
    expect(gradeAssignment(quiz(), { q1: 'b' }).percent).toBe(33)
  })
})

describe('attempts', () => {
  const att = (percent: number, submittedAt: number): AssignmentAttempt => ({
    assignmentId: 'a',
    profileId: 'p',
    answers: {},
    results: [],
    correct: 0,
    total: 0,
    percent,
    late: false,
    submittedAt,
  })

  it('counts attempts left, with null for unlimited', () => {
    expect(attemptsLeft({ ...quiz(), maxAttempts: 3 }, 1)).toBe(2)
    expect(attemptsLeft({ ...quiz(), maxAttempts: 1 }, 4)).toBe(0)
    expect(attemptsLeft({ ...quiz(), maxAttempts: null }, 9)).toBeNull()
  })

  it('keeps the first of equal best attempts', () => {
    expect(bestAttempt([])).toBeUndefined()
    expect(bestAttempt([att(40, 1), att(80, 2), att(80, 3), att(60, 4)])?.submittedAt).toBe(2)
  })

  it('knows when an assignment is overdue', () => {
    expect(isOverdue({ ...quiz(), dueAt: 100 }, 101)).toBe(true)
    expect(isOverdue({ ...quiz(), dueAt: 100 }, 100)).toBe(false)
    expect(isOverdue({ ...quiz(), dueAt: undefined }, 1e15)).toBe(false)
  })
})
