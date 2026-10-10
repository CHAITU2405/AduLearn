import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, ChevronRight, Coins, HelpCircle, Lightbulb, Sparkles } from 'lucide-react'
import { usePrefs } from '@/app/context'
import { PlantCell } from '@/components/diagrams/PlantCell'
import { Pip, PipSays } from '@/components/game/Pip'
import { emptyResponse, expectedCounts } from '@/components/questions/QuestionRenderer'
import { cn } from '@/components/ui'
import type { PartResponse, PartView, QuestionResponse } from '@/core/content/types'
import type { GeneratedQuestion } from '@/core/engine/generator'
import { isResponseComplete } from '@/core/engine/grader'
import { play } from '@/lib/sfx'
import { alternativeExplanation, contextualHint } from '@/services/ai/features'
import { vault, type SubmitResult } from '@/services/learning'
import { CoinBurst } from './effects'
import { AnswerStones, NumberPad, PlankInput, SocketBoard, WordBuilder } from './inputs'

export type ChallengeTheme = 'numbers' | 'words' | 'discovery' | 'boss'
type Graded = Extract<SubmitResult, { status: 'graded' }>

export interface ChallengePanelProps {
  question: GeneratedQuestion
  conceptName: string
  theme: ChallengeTheme
  hintAllowance: 'unlimited' | 'none' | number
  feedback: 'full' | 'none'
  supportMode?: boolean
  reason?: string
  onSubmit: (response: QuestionResponse, hintsUsed: number) => Promise<SubmitResult>
  onNext: (result: Graded) => void
  /** Lets the surrounding scene react (characters, track, boss). */
  onResult?: (result: Graded) => void
  nextLabel?: string
  submitLabel?: string
  header?: ReactNode
}

const PRAISE = ['Brilliant!', 'Spot on!', 'Nailed it!', 'Great thinking!', 'Superb!', 'You got it!']

export function ChallengePanel(props: ChallengePanelProps) {
  const { question: q, hintAllowance, feedback, theme } = props
  const { prefs } = usePrefs()
  const promptId = useId()
  const [response, setResponse] = useState<QuestionResponse>(() => emptyResponse(q.view))
  const [hintsShown, setHintsShown] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Graded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showWhy, setShowWhy] = useState(false)
  const [shake, setShake] = useState(0)
  const [burst, setBurst] = useState<{ n: number; key: number; from: DOMRect | null } | null>(null)
  const [ai, setAi] = useState<{ text: string; source: 'ai' | 'fallback'; note?: string; kind: 'hint' | 'explain' } | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const submittingRef = useRef(false)
  const checkRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const complete = isResponseComplete(response, expectedCounts(q.view))
  const maxHints = hintAllowance === 'none' ? 0 : hintAllowance === 'unlimited' ? q.hints.length : Math.min(q.hints.length, hintAllowance)
  const aiReady = prefs.ai.enabled && !!prefs.ai.model

  useEffect(() => () => abortRef.current?.abort(), [])
  useEffect(() => {
    if (result) nextRef.current?.focus({ preventScroll: true })
  }, [result])

  async function submit() {
    if (submittingRef.current || result || !complete) return
    submittingRef.current = true
    setSubmitting(true)
    setError(null)
    try {
      const origin = checkRef.current?.getBoundingClientRect() ?? null
      const r = await props.onSubmit(response, hintsShown)
      if (r.status === 'graded') {
        setResult(r)
        props.onResult?.(r)
        if (feedback === 'none') {
          play('tap')
          props.onNext(r)
          return
        }
        if (r.grade.correct) {
          play('correct')
          if (r.coins > 0) {
            setBurst({ n: Math.min(8, Math.ceil(r.coins / 2)), key: Date.now(), from: origin })
            setTimeout(() => play('coin'), 450)
          }
        } else {
          play('wrong')
          setShake((s) => s + 1)
        }
      } else if (r.status === 'duplicate') setError('This answer was already submitted.')
      else setError(r.message)
    } catch (err) {
      setError(`Something went wrong saving your answer: ${(err as Error).message}`)
    } finally {
      setSubmitting(false)
      submittingRef.current = false
    }
  }

  function askPip() {
    if (hintsShown >= maxHints) return
    play('open')
    setHintsShown((n) => n + 1)
  }

  // Keyboard shortcuts: number keys pick answer stones, H asks Pip.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (result) return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select')) return
      if (q.view.body.kind === 'mcq' && /^[1-6]$/.test(e.key)) {
        const c = q.view.body.choices[Number(e.key) - 1]
        if (c) {
          play('tap')
          setResponse({ kind: 'mcq', choiceId: c.id })
        }
      } else if (e.key.toLowerCase() === 'h' && maxHints > 0) askPip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

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

  const disabled = !!result || submitting
  const b = q.view.body
  const inlineFill = b.kind === 'text' && b.mode === 'fill' && q.view.prompt.includes('____')
  const g = result?.grade
  const praise = PRAISE[q.instanceId.charCodeAt(q.instanceId.length - 1) % PRAISE.length]

  const renderPart = (part: PartView, value: PartResponse, set: (v: PartResponse) => void, labelledBy: string) => {
    if (part.kind === 'mcq' && value.kind === 'mcq')
      return <AnswerStones choices={part.choices} value={value.choiceId} onChange={(id) => set({ kind: 'mcq', choiceId: id })} disabled={disabled} labelledBy={labelledBy} />
    if (part.kind === 'numeric' && value.kind === 'numeric')
      return (
        <NumberPad
          value={value.value}
          onChange={(v) => set({ kind: 'numeric', value: v })}
          unit={part.unit}
          disabled={disabled}
          placeholder={part.placeholder}
          onEnter={() => void submit()}
          labelledBy={labelledBy}
        />
      )
    if (part.kind === 'text' && value.kind === 'text')
      return (
        <PlankInput
          value={value.value}
          onChange={(v) => set({ kind: 'text', value: v })}
          disabled={disabled}
          placeholder={part.placeholder}
          wide={part.mode !== 'fill'}
          onEnter={() => void submit()}
          labelledBy={labelledBy}
        />
      )
    return null
  }

  return (
    <div data-instance-id={q.instanceId} data-graded={result ? (result.grade.correct ? 'correct' : 'incorrect') : undefined} className="relative">
      <motion.div key={shake} className={cn('panel-game overflow-hidden', `theme-${theme}`, shake > 0 && 'shake')}>
        <div className="flex flex-wrap items-center gap-2 border-b-[3px] border-black/10 bg-white/60 px-4 py-2">
          {props.header}
          <span className="rounded-full bg-[#ede9fe] px-3 py-1 text-xs font-bold text-[#4338ca]">{props.conceptName}</span>
          <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold text-ink-soft" aria-label={`Difficulty level ${q.difficulty}`}>
            {'◆'.repeat(q.difficulty)}
            <span className="text-[#cbd5e1]">{'◆'.repeat(3 - q.difficulty)}</span>
          </span>
          {props.reason && prefs.showReasons && feedback === 'full' && (
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-ink-muted hover:bg-white"
            >
              <HelpCircle className="size-4" aria-hidden /> Why this question?
            </button>
          )}
        </div>
        {showWhy && props.reason && <p className="border-b-2 border-black/5 bg-white/70 px-4 py-2 text-sm">{props.reason}</p>}

        <form
          className="p-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          {q.view.passage && (
            <details open className="mb-4 rounded-2xl border-[3px] border-[#c7d2fe] bg-white/80 p-4">
              <summary className="flex cursor-pointer items-center gap-2 font-display text-lg font-bold text-[#3730a3]">
                <BookOpen className="size-5" aria-hidden /> {q.view.passage.title}
              </summary>
              {q.view.passage.text.split('\n\n').map((para, i) => (
                <p key={i} className="mt-2 leading-relaxed">
                  {para}
                </p>
              ))}
            </details>
          )}
          {q.view.context && <p className="mb-1 text-ink-soft italic">{q.view.context}</p>}
          <p id={promptId} className="mb-5 font-display text-2xl leading-snug font-bold sm:text-[1.7rem]">
            {inlineFill && response.kind === 'text'
              ? q.view.prompt.split('____').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="mx-1 inline-block align-middle">
                        <PlankInput
                          value={response.value}
                          onChange={(v) => setResponse({ kind: 'text', value: v })}
                          disabled={disabled}
                          placeholder="?"
                          onEnter={() => void submit()}
                          labelledBy={promptId}
                        />
                      </span>
                    )}
                  </span>
                ))
              : q.view.prompt}
          </p>

          {!inlineFill && (b.kind === 'mcq' || b.kind === 'numeric' || b.kind === 'text') && renderPart(b, response as PartResponse, setResponse, promptId)}
          {b.kind === 'multi' && response.kind === 'multi' && (
            <ol className="flex flex-col gap-4">
              {b.parts.map((part, i) => (
                <li key={i} data-part-index={i} className="rounded-2xl border-[3px] border-white bg-white/60 p-4">
                  <p id={`${promptId}-p${i}`} className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
                    <span className="grid size-8 place-items-center rounded-full bg-ink text-sm text-white">{i + 1}</span>
                    {part.prompt ?? `Step ${i + 1}`}
                  </p>
                  {renderPart(part, response.parts[i], (v) => setResponse({ kind: 'multi', parts: response.parts.map((x, j) => (j === i ? v : x)) }), `${promptId}-p${i}`)}
                </li>
              ))}
            </ol>
          )}
          {b.kind === 'match' && response.kind === 'match' && (
            <SocketBoard
              kind="match"
              rows={b.left.map((l) => ({ id: l.id, label: l.text, ariaLabel: l.text }))}
              options={b.right}
              pairs={response.pairs}
              onChange={(pairs) => setResponse({ kind: 'match', pairs })}
              disabled={disabled}
            />
          )}
          {b.kind === 'label' && response.kind === 'label' && (
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-start">
              <div className="rounded-2xl border-[3px] border-white bg-white p-2 shadow-soft">
                {b.diagram === 'plant-cell' && <PlantCell markers={b.markers} className="w-full" />}
              </div>
              <SocketBoard
                kind="label"
                rows={b.markers.map((m) => ({
                  id: m.id,
                  label: (
                    <span className="inline-flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-full bg-ink font-display text-white">{m.number}</span>Part {m.number}
                    </span>
                  ),
                  ariaLabel: `Part ${m.number}`,
                }))}
                options={b.options}
                pairs={response.pairs}
                onChange={(pairs) => setResponse({ kind: 'label', pairs })}
                disabled={disabled}
              />
            </div>
          )}
          {b.kind === 'order' && response.kind === 'order' && (
            <WordBuilder tokens={b.tokens} value={response.tokenIds} onChange={(tokenIds) => setResponse({ kind: 'order', tokenIds })} disabled={disabled} />
          )}

          {/* Pip's hints */}
          {!result && props.supportMode && hintsShown === 0 && maxHints > 0 && (
            <PipSays
              className="mt-5"
              size="sm"
              mood="thinking"
              actions={
                <button type="button" className="btn-game yellow !min-h-9 !px-3 !text-sm" onClick={askPip}>
                  Yes, give me a hint
                </button>
              }
            >
              This one’s been tricky. Want a hint? Using hints is totally fine!
            </PipSays>
          )}
          {!result && hintsShown > 0 && (
            <PipSays className="mt-5" size="sm" mood="talking">
              <span className="flex items-start gap-1.5">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-[#d97706]" aria-hidden />
                <span>
                  {q.hints.slice(0, hintsShown).map((h, i) => (
                    <span key={i} className="block">
                      {h}
                    </span>
                  ))}
                </span>
              </span>
            </PipSays>
          )}
          {ai?.kind === 'hint' && !result && <AiNote ai={ai} />}
          {error && (
            <p className="mt-4 rounded-2xl bg-coral-soft p-3 font-semibold text-coral-deep" role="alert">
              {error}
            </p>
          )}

          {!result && (
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              {maxHints > 0 && (
                <button type="button" className="btn-game yellow mr-auto" onClick={askPip} disabled={hintsShown >= maxHints}>
                  <Pip mood="idle" className="size-7" title="" /> {hintsShown >= maxHints ? 'No more hints' : `Ask Pip (${maxHints - hintsShown})`}
                </button>
              )}
              {aiReady && maxHints > 0 && hintsShown > 0 && (
                <button type="button" className="btn-game light" onClick={() => void askAi('hint')} disabled={aiBusy}>
                  <Sparkles className={cn('size-5', aiBusy && 'animate-pulse')} aria-hidden /> {aiBusy ? 'Thinking…' : 'Ask for another hint'}
                </button>
              )}
              <button ref={checkRef} type="submit" className="btn-game orange min-w-44" disabled={!complete || submitting}>
                {submitting ? 'Checking…' : (props.submitLabel ?? 'Check answer')}
              </button>
            </div>
          )}
          {!result && !complete && (
            <p className="mt-2 text-right text-xs text-ink-muted">{b.kind === 'mcq' ? 'Pick an answer stone (or press 1–4).' : 'Finish your answer to check it.'}</p>
          )}
        </form>

        <AnimatePresence>
          {result && g && feedback === 'full' && (
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn('border-t-[5px] px-4 py-5 sm:px-6', g.correct ? 'border-leaf bg-[#dcfce7]' : 'border-coral bg-[#ffe4e6]')}
              role="status"
              aria-live="assertive"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="size-20 shrink-0 self-center sm:self-start">
                  <Pip mood={g.correct ? 'cheer' : 'sad'} className="size-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-display text-3xl font-bold">{g.correct ? praise : g.score > 0 ? 'So close!' : 'Not quite!'}</p>
                    {g.correct && result.coins > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sun px-3 py-1 font-display font-bold text-[#422006]">
                        <Coins className="size-4" aria-hidden /> +{result.coins}
                      </span>
                    )}
                  </div>
                  {!g.correct && g.feedback && <p className="mt-1 text-lg font-semibold">{g.feedback}</p>}
                  {!g.correct && (
                    <p className="mt-2 text-lg">
                      <span className="font-bold">Correct answer: </span>
                      {g.answerDisplay}
                    </p>
                  )}
                  <p className="mt-2 rounded-2xl bg-white/70 p-3">
                    <span className="font-bold">{g.correct ? 'Why it works: ' : 'Pip explains: '}</span>
                    {g.explanation}
                  </p>
                  {ai?.kind === 'explain' && <AiNote ai={ai} />}
                  {result.mastery.notes.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-sm text-ink-soft">
                      {result.mastery.notes.map((n) => (
                        <li key={n}>• {n}</li>
                      ))}
                    </ul>
                  )}
                  {result.rewards.map((r) => (
                    <p key={r.kind + r.refId} className="mt-2 inline-flex items-center gap-2 rounded-full bg-sun px-3 py-1 text-sm font-bold">
                      🏅 {r.title}
                    </p>
                  ))}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button ref={nextRef} type="button" className={cn('btn-game', g.correct ? 'green' : '')} onClick={() => props.onNext(result)}>
                      {props.nextLabel ?? 'Continue'} <ChevronRight className="size-5" aria-hidden />
                    </button>
                    {aiReady && !g.correct && (
                      <button type="button" className="btn-game light" onClick={() => void askAi('explain')} disabled={aiBusy}>
                        <Sparkles className={cn('size-5', aiBusy && 'animate-pulse')} aria-hidden /> {aiBusy ? 'Thinking…' : 'Explain it another way'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {burst && <CoinBurst key={burst.key} count={burst.n} from={burst.from} />}
    </div>
  )
}

function AiNote({ ai }: { ai: { text: string; source: 'ai' | 'fallback'; note?: string } }) {
  return (
    <div className="mt-3 rounded-2xl border-2 border-[#c7d2fe] bg-white px-4 py-3">
      <p className="flex items-center gap-1 text-xs font-bold tracking-wide text-[#4338ca] uppercase">
        <Sparkles className="size-3.5" aria-hidden /> {ai.source === 'ai' ? 'Local AI (checked)' : 'Approved content'}
      </p>
      <p className="mt-1">{ai.text}</p>
      {ai.note && <p className="mt-1 text-xs text-ink-muted">Local AI was not used: {ai.note}</p>}
    </div>
  )
}
