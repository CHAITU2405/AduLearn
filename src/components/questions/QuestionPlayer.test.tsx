import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PrefsProvider } from '@/app/context'
import { getTemplate } from '@/content'
import { generateQuestion } from '@/core/engine/generator'
import type { SubmitResult } from '@/services/learning'
import { initialMastery } from '@/core/learning/mastery'
import { QuestionPlayer } from './QuestionPlayer'

function setup(onSubmit: () => Promise<SubmitResult>) {
  const q = generateQuestion(getTemplate('math.eq.add-one-step')!, { seed: 11 })!.question
  const onNext = vi.fn()
  render(
    <PrefsProvider>
      <QuestionPlayer question={q} conceptName="One-step equations" hintAllowance="unlimited" feedback="full" onSubmit={onSubmit} onNext={onNext} />
    </PrefsProvider>,
  )
  return { q, onNext }
}

const graded = (correct: boolean): SubmitResult => ({
  status: 'graded',
  grade: {
    correct,
    score: correct ? 1 : 0,
    answerDisplay: 'x = 5',
    explanation: 'Subtract 3 from both sides.',
    responseSummary: '5',
    feedback: correct ? undefined : 'You added instead of subtracting.',
  },
  mastery: { state: initialMastery('c'), notes: [], levelChanged: null },
  rewards: [],
  coins: 0,
})

describe('QuestionPlayer', () => {
  it('submits only once even if the button is clicked repeatedly', async () => {
    let resolve!: (r: SubmitResult) => void
    const onSubmit = vi.fn(() => new Promise<SubmitResult>((r) => (resolve = r)))
    setup(onSubmit)
    await userEvent.type(screen.getByRole('textbox'), '5')
    const button = screen.getByRole('button', { name: /check answer/i })
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.submit(button.closest('form')!)
    resolve(graded(true))
    await screen.findByText(/correct/i)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('does not allow submitting an empty answer', async () => {
    const onSubmit = vi.fn(async () => graded(true))
    setup(onSubmit)
    expect(screen.getByRole('button', { name: /check answer/i })).toBeDisabled()
  })

  it('shows meaningful feedback, the correct answer and the explanation for a wrong answer', async () => {
    setup(async () => graded(false))
    await userEvent.type(screen.getByRole('textbox'), '9{Enter}')
    await screen.findByText('Not quite')
    expect(screen.getByText('You added instead of subtracting.')).toBeInTheDocument()
    expect(screen.getByText(/x = 5/)).toBeInTheDocument()
    expect(screen.getByText(/Subtract 3 from both sides/)).toBeInTheDocument()
  })

  it('reveals hints one at a time', async () => {
    const { q } = setup(async () => graded(true))
    await userEvent.click(screen.getByRole('button', { name: /hint \(2 left\)/i }))
    expect(screen.getByText(q.hints[0])).toBeInTheDocument()
    expect(screen.queryByText(q.hints[1])).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /hint \(1 left\)/i }))
    await waitFor(() => expect(screen.getByText(q.hints[1])).toBeInTheDocument())
  })
})
