import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, CheckCircle2, ChevronRight, HelpCircle, Lightbulb, Sparkles, XCircle } from 'lucide-react'
import { usePrefs } from '@/app/context'
import { Button, Card, cn, Notice, Pill } from '@/components/ui'
import type { QuestionResponse } from '@/core/content/types'
import type { GeneratedQuestion } from '@/core/engine/generator'
import { isResponseComplete } from '@/core/engine/grader'
import { alternativeExplanation, contextualHint } from '@/services/ai/features'
import { vault, type SubmitResult } from '@/services/learning'
import { emptyResponse, expectedCounts, QuestionRenderer } from './QuestionRenderer'

export interface QuestionPlayerProps {
  question: GeneratedQuestion
  conceptName: string
  /** 'none' hides hints; a number limits how many may be used in total. */
  hintAllowance: 'unlimited' | 'none' | number
  /** 'none' = assessment mode: no correctness feedback until the end. */
  feedback: 'full' | 'none'
  supportMode?: boolean
  reason?: string
  onSubmit: (response: QuestionResponse, hintsUsed: number) => Promise<SubmitResult>
  onNext: (result: Extract<SubmitResult, { status: 'graded' }>) => void
  nextLabel?: string
  difficultyLabel?: boolean
}

type Graded = Extract<SubmitResult, { status: 'graded' }>

export function QuestionPlayer(props: QuestionPlayerProps) {
  const { question: q, hintAllowance, feedback } = props
  const { prefs } = usePrefs()
  const [response, setResponse] = useState<QuestionResponse>(() => emptyResponse(q.view))
  const [hintsShown, setHintsShown] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Graded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showWhy, setShowWhy] = useState(false)
  const [ai, setAi] = useState<{ kind: 'hint' | 'explain'; text: string; source: 'ai' | 'fallback'; note?: string } | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const submittingRef = useRef(false)
  const nextRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => abortRef.current?.abort(), [])
  useEffect(() => {
    if (result) nextRef.current?.focus({ preventScroll: false })
  }, [result])
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [q.instanceId])

  const complete = isResponseComplete(response, expectedCounts(q.view))
  const maxHints = hintAllowance === 'none' ? 0 : hintAllowance === 'unlimited' ? q.hints.length : Math.min(q.hints.length, hintAllowance)
  const aiReady = prefs.ai.enabled && !!prefs.ai.model

  async function submit() {
    // Guard against double clicks / repeated Enter presses for this attempt.
    if (submittingRef.current || result || !complete) return
    submittingRef.current = true
    setSubmitting(true)
    setError(null)
    abortRef.current?.abort()
    try {
      const r = await props.onSubmit(response, hintsShown)
      if (r.status === 'graded') {
        setResult(r)
        if (feedback === 'none') props.onNext(r)
      } else if (r.status === 'duplicate') {
        setError('This answer was already submitted.')
      } else {
        setError(r.message)
      }
    } catch (err) {
      setError(`Something went wrong saving your answer: ${(err as Error).message}`)
    } finally {
      setSubmitting(false)
      submittingRef.current = false
    }
  }

  async function askAi(kind: 'hint' | 'explain') {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setAiBusy(true)
    const res =
      kind === 'explain' && result
        ? await alternativeExplanation(
            prefs.ai,
            { conceptName: props.conceptName, prompt: q.view.prompt, approvedExplanation: result.grade.explanation, answerDisplay: result.grade.answerDisplay },
            { signal: ctrl.signal },
          )
        : await contextualHint(
            prefs.ai,
            {
              conceptName: props.conceptName,
              prompt: q.view.prompt,
              approvedHint: q.hints[Math.max(0, hintsShown - 1)] ?? q.hints[0],
              revealsAnswer: (t) => vault.revealsAnswer(q.instanceId, t),
            },
            { signal: ctrl.signal },
          )
    if (!ctrl.signal.aborted) {
      setAi({ kind, text: res.text, source: res.source, note: res.source === 'fallback' ? res.reason : undefined })
      setAiBusy(false)
    }
  }

  const g = result?.grade
  return (
    <div data-instance-id={q.instanceId} data-graded={result ? (result.grade.correct ? 'correct' : 'incorrect') : undefined}>
      <Card className="overflow-hidden">
        <div ref={headingRef} tabIndex={-1} className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3 outline-none sm:px-6" aria-label="Question">
          <Pill tone="violet">{props.conceptName}</Pill>
          {props.difficultyLabel !== false && <Pill tone="muted">Level {q.difficulty}</Pill>}
          {props.reason && prefs.showReasons && feedback === 'full' && (
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-bold text-ink-muted hover:bg-brand-soft"
            >
              <HelpCircle className="size-4" aria-hidden /> Why this question?
            </button>
          )}
        </div>
        {showWhy && props.reason && <p className="border-b border-line bg-brand-soft/50 px-5 py-2 text-sm sm:px-6">{props.reason}</p>}

        <form
          className="p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <QuestionRenderer view={q.view} response={response} onChange={setResponse} disabled={!!result || submitting} onSubmitShortcut={() => void submit()} />

          {props.supportMode && hintsShown === 0 && maxHints > 0 && !result && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#fde68a] bg-sun-soft px-4 py-3">
              <Lightbulb className="size-5 shrink-0 text-[#a16207]" aria-hidden />
              <p className="flex-1">This idea has been tricky. A hint is ready if you want it — using hints is fine.</p>
              <Button size="sm" variant="secondary" onClick={() => setHintsShown(1)}>
                Show hint
              </Button>
            </div>
          )}
          {hintsShown > 0 && !result && (
            <div className="mt-5 flex flex-col gap-2" aria-live="polite">
              {q.hints.slice(0, hintsShown).map((h, i) => (
                <div key={i} className="flex gap-2 rounded-2xl bg-sun-soft px-4 py-3">
                  <Lightbulb className="mt-0.5 size-5 shrink-0 text-[#a16207]" aria-hidden />
                  <p>
                    <span className="font-bold">Hint {i + 1}: </span>
                    {h}
                  </p>
                </div>
              ))}
            </div>
          )}
          {ai?.kind === 'hint' && !result && <AiNote ai={ai} />}
          {error && (
            <Notice tone="error" className="mt-4">
              {error}
            </Notice>
          )}

          {!result && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button type="submit" size="lg" disabled={!complete || submitting}>
                {submitting ? 'Checking…' : feedback === 'none' ? 'Submit answer' : 'Check answer'}
              </Button>
              {maxHints > 0 && (
                <Button variant="secondary" onClick={() => setHintsShown((n) => Math.min(maxHints, n + 1))} disabled={hintsShown >= maxHints}>
                  <Lightbulb className="size-4" aria-hidden />
                  {hintsShown >= maxHints ? 'No more hints' : `Hint (${maxHints - hintsShown} left)`}
                </Button>
              )}
              {aiReady && maxHints > 0 && hintsShown > 0 && (
                <Button variant="ghost" onClick={() => void askAi('hint')} disabled={aiBusy}>
                  <Sparkles className={cn('size-4', aiBusy && 'animate-pulse')} aria-hidden /> {aiBusy ? 'Thinking…' : 'Ask for another hint'}
                </Button>
              )}
              {!complete && (
                <span className="text-sm text-ink-muted">
                  {q.view.body.kind === 'multi' || q.view.body.kind === 'match' || q.view.body.kind === 'label' || q.view.body.kind === 'order'
                    ? 'Complete every part to check.'
                    : 'Choose or enter an answer first.'}
                </span>
              )}
            </div>
          )}
        </form>

        <AnimatePresence>
          {result && g && feedback === 'full' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('border-t-4 px-5 py-5 sm:px-6', g.correct ? 'border-leaf bg-leaf-soft' : 'border-coral bg-coral-soft')}
              role="status"
              aria-live="assertive"
            >
              <div className="flex items-start gap-3">
                {g.correct ? <CheckCircle2 className="size-8 shrink-0 text-leaf-deep" aria-hidden /> : <XCircle className="size-8 shrink-0 text-coral-deep" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl font-bold">
                    {g.correct ? (result.mastery.state.streakCorrect > 1 ? 'Correct — nicely done!' : 'Correct!') : g.score > 0 ? 'Partly right' : 'Not quite'}
                  </p>
                  {!g.correct && g.feedback && <p className="mt-1 font-semibold">{g.feedback}</p>}
                  {!g.correct && (
                    <p className="mt-2">
                      <span className="font-bold">Correct answer: </span>
                      {g.answerDisplay}
                    </p>
                  )}
                  <p className="mt-2 text-ink-soft">
                    <span className="font-bold text-ink">Why: </span>
                    {g.explanation}
                  </p>
                  {ai?.kind === 'explain' && <AiNote ai={ai} />}
                  {result.mastery.notes.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                      {result.mastery.notes.map((n) => (
                        <li key={n}>• {n}</li>
                      ))}
                    </ul>
                  )}
                  {result.rewards.map((r) => (
                    <p key={r.refId + r.kind} className="mt-3 inline-flex items-center gap-2 rounded-full bg-sun px-3 py-1 text-sm font-bold text-ink">
                      <Award className="size-4" aria-hidden /> {r.title}
                    </p>
                  ))}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button ref={nextRef} size="lg" variant={g.correct ? 'success' : 'primary'} onClick={() => props.onNext(result)}>
                      {props.nextLabel ?? 'Next'} <ChevronRight className="size-5" aria-hidden />
                    </Button>
                    {aiReady && !g.correct && (
                      <Button variant="secondary" onClick={() => void askAi('explain')} disabled={aiBusy}>
                        <Sparkles className={cn('size-4', aiBusy && 'animate-pulse')} aria-hidden /> {aiBusy ? 'Thinking…' : 'Explain it another way'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}

function AiNote({ ai }: { ai: { text: string; source: 'ai' | 'fallback'; note?: string } }) {
  return (
    <div className="mt-3 rounded-2xl border border-[#c7d2fe] bg-white px-4 py-3">
      <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#4338ca]">
        <Sparkles className="size-3.5" aria-hidden /> {ai.source === 'ai' ? 'Local AI (checked)' : 'Approved content'}
      </p>
      <p className="mt-1">{ai.text}</p>
      {ai.note && <p className="mt-1 text-xs text-ink-muted">Local AI was not used: {ai.note}</p>}
    </div>
  )
}
