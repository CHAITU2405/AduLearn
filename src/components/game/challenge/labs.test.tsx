import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PrefsProvider } from '@/app/context'
import { getTemplate } from '@/content'
import { generateQuestion } from '@/core/engine/generator'
import { initialMastery } from '@/core/learning/mastery'
import type { SubmitResult } from '@/services/learning'
import { ChallengePanel } from './ChallengePanel'

const graded = (correct: boolean): SubmitResult => ({
  status: 'graded',
  grade: { correct, score: correct ? 1 : 0, answerDisplay: 'answer', explanation: 'Because.', responseSummary: 'x' },
  mastery: { state: initialMastery('c'), notes: [], levelChanged: null },
  rewards: [],
  coins: 0,
})

function setup(templateId: string, seed = 5, onSubmit = vi.fn(async () => graded(true))) {
  const q = generateQuestion(getTemplate(templateId)!, { seed })!.question
  render(
    <PrefsProvider>
      <ChallengePanel question={q} conceptName="c" theme="discovery" hintAllowance="unlimited" feedback="full" onSubmit={onSubmit} onNext={vi.fn()} speaker="nova" />
    </PrefsProvider>,
  )
  return { q, onSubmit }
}

describe('hands-on labs', () => {
  it('sample test: run tests with tools, then shelve the sample to answer', async () => {
    const { q, onSubmit } = setup('sci.chem.classify')
    expect(q.view.lab?.kind).toBe('sample-test')
    const submit = screen.getByRole('button', { name: /shelve the sample/i })
    expect(submit).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /circuit tester/i }))
    expect(screen.getByText(/Circuit tester: The bulb/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /circuit tester \(done\)/i })).toBeDisabled()
    await userEvent.click(screen.getAllByRole('radio')[0])
    expect(submit).toBeEnabled()
    await userEvent.click(submit)
    expect(onSubmit).toHaveBeenCalledWith({ kind: 'mcq', choiceId: expect.any(String) }, 0)
  })

  it('oxide: the notebook opens only after burning and dissolving', async () => {
    setup('sci.chem.oxide-litmus')
    expect(screen.getByText(/Finish the experiment above/)).toBeInTheDocument()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    await userEvent.click(screen.getByRole('button', { name: /^burn the/i }))
    const dissolve = screen.getByRole('button', { name: /to water/i })
    expect(dissolve).toBeDisabled()
    await waitFor(() => expect(dissolve).toBeEnabled(), { timeout: 3000 })
    await userEvent.click(dissolve)
    await waitFor(() => expect(screen.getAllByRole('radio').length).toBeGreaterThan(1))
    expect(screen.getByRole('button', { name: /dip the litmus/i })).toBeDisabled()
  })

  it('sand pit: choosing a base plate sets the answer and shows whether it sinks', async () => {
    let q = generateQuestion(getTemplate('sci.phy.pressure-reverse')!, { seed: 1 })!.question
    for (let s = 2; q.view.lab?.kind !== 'pressure-sand' || q.view.lab.mode !== 'area'; s++) q = generateQuestion(getTemplate('sci.phy.pressure-reverse')!, { seed: s })!.question
    const lab = q.view.lab
    if (lab?.kind !== 'pressure-sand' || lab.mode !== 'area') throw new Error('expected area mode')
    render(
      <PrefsProvider>
        <ChallengePanel question={q} conceptName="c" theme="discovery" hintAllowance="none" feedback="full" onSubmit={vi.fn(async () => graded(true))} onNext={vi.fn()} />
      </PrefsProvider>,
    )
    const smallest = lab.plates[0]
    await userEvent.click(screen.getByRole('radio', { name: `${smallest} m²` }))
    expect(screen.getByRole('textbox')).toHaveValue(String(smallest))
    const sinks = lab.force / smallest > lab.maxPressure
    expect(screen.getByRole('img', { name: sinks ? /sinking/i : /holding/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lock it in/i })).toBeEnabled()
  })
})
