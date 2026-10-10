import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, ChevronRight, Coins, HelpCircle, Lightbulb, Sparkles } from 'lucide-react'
import { usePrefs } from '@/app/context'
import { PlantCell } from '@/components/diagrams/PlantCell'
import { Pip } from '@/components/game/Pip'
import { emptyResponse, expectedCounts } from '@/components/questions/QuestionRenderer'
import { CharacterHead } from '@/components/story/CharacterSprite'
import { cn } from '@/components/ui'
import { getCharacter } from '@/content/characters'
import type { AvatarConfig } from '@/core/avatar'
import type { PartResponse, PartView, QuestionBody, QuestionResponse } from '@/core/content/types'
import type { GeneratedQuestion } from '@/core/engine/generator'
import { isResponseComplete } from '@/core/engine/grader'
import { play } from '@/lib/sfx'
import { alternativeExplanation, contextualHint } from '@/services/ai/features'
import { vault, type SubmitResult } from '@/services/learning'
import { CoinBurst } from './effects'
import { NumberPad, PlankInput, ReplyChoices, SocketBoard, WordBuilder } from './inputs'

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
  /** Character who asks the question in the conversation (a character id; defaults to Pip). */
  speaker?: string
  /** The explorer, shown on their side of the conversation. */
  player?: { avatar: AvatarConfig; name: string }
}

const PRAISE = ['Brilliant!', 'Spot on!', 'Nailed it!', 'Great thinking!', 'Superb!', 'You got it!']

/** How each kind of challenge is framed: a reply in the conversation, or a small puzzle to solve. */
const PUZZLE: Record<QuestionBody['kind'], { title: string; submit: string }> = {
  mcq: { title: 'What do you say?', submit: 'Say it' },
  numeric: { title: 'Crack the code lock', submit: 'Try the code' },
  text: { title: 'Type your reply', submit: 'Send reply' },
  match: { title: 'Puzzle: connect each pair', submit: 'Connect them' },
  label: { title: 'Puzzle: pin the labels on the specimen', submit: 'Pin the labels' },
  order: { title: 'Puzzle: put the scrambled words back in order', submit: 'Read it out' },
  multi: { title: 'Work it out together, one step at a time', submit: 'Share my working' },
}

/** What the explorer "said", in words, for their side of the conversation. */
function describeReply(body: QuestionBody, r: QuestionResponse): string {
  const part = (v: PartView, p: PartResponse) => (p.kind === 'mcq' ? ((v.kind === 'mcq' ? v.choices.find((c) => c.id === p.choiceId)?.text : undefined) ?? '') : p.value.trim())
  if (body.kind === 'multi' && r.kind === 'multi') return body.parts.map((v, i) => part(v, r.parts[i])).join(' · ')
  if (body.kind === 'order' && r.kind === 'order') return r.tokenIds.map((id) => body.tokens.find((t) => t.id === id)?.text ?? '').join(' ')
  if (body.kind === 'match' && r.kind === 'match') return body.left.map((l) => `${l.text} → ${body.right.find((x) => x.id === r.pairs[l.id])?.text ?? '?'}`).join(', ')
  if (body.kind === 'label' && r.kind === 'label') return 'Here are my labels.'
  if ((body.kind === 'mcq' || body.kind === 'numeric' || body.kind === 'text') && (r.kind === 'mcq' || r.kind === 'numeric' || r.kind === 'text')) return part(body, r)
  return ''
}

function partComplete(r: PartResponse): boolean {
  return r.kind === 'mcq' ? r.choiceId !== null : r.value.trim() !== ''
}

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

  const reduce = prefs.motion === 'reduce' || (prefs.motion === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [stepsShown, setStepsShown] = useState(1)
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
  const speaker = props.speaker ?? 'pip'
  const speakerName = speaker === 'pip' ? 'Pip' : getCharacter(speaker).name
  const puzzle = PUZZLE[b.kind]
  const verdict = g ? (g.correct ? 'correct' : 'incorrect') : undefined

  // Multi-step challenges unfold like a conversation: the next step is asked once the current one has an answer.
  const leading = b.kind === 'multi' && response.kind === 'multi' ? response.parts.findIndex((p) => !partComplete(p)) : -1
  const wantSteps = b.kind === 'multi' ? (leading === -1 ? b.parts.length : leading + 1) : 1
  useEffect(() => {
    if (wantSteps > stepsShown) setStepsShown(wantSteps)
  }, [wantSteps, stepsShown])
  const visibleSteps = Math.max(stepsShown, wantSteps)

  // The opening lines pop in one after another, like a chat — only the first time (not when a wrong answer shakes the panel).
  let beat = 0
  const intro = !reduce && shake === 0 && !result
  const nextDelay = () => (intro ? 0.1 + 0.3 * beat++ : 0)

  const npcLine = (key: string, children: ReactNode, opts: { tone?: 'good' | 'bad'; id?: string; delay?: number; grouped?: boolean } = {}) => (
    <ChatLine key={key} side="npc" speaker={speaker} name={speakerName} tone={opts.tone} id={opts.id} grouped={opts.grouped} delay={opts.delay ?? nextDelay()}>
      {children}
    </ChatLine>
  )

  const renderPart = (part: PartView, value: PartResponse, set: (v: PartResponse) => void, labelledBy: string) => {
    if (part.kind === 'mcq' && value.kind === 'mcq')
      return (
        <ReplyChoices
          choices={part.choices}
          value={value.choiceId}
          onChange={(id) => set({ kind: 'mcq', choiceId: id })}
          disabled={disabled}
          labelledBy={labelledBy}
          verdict={verdict}
        />
      )
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
          lock={b.kind === 'numeric' ? (g ? (g.correct ? 'open' : 'jammed') : 'locked') : undefined}
        />
      )
    if (part.kind === 'text' && value.kind === 'text')
      return (
        <PlankInput
          value={value.value}
          onChange={(v) => set({ kind: 'text', value: v })}
          disabled={disabled}
          placeholder={part.placeholder ?? 'Type your reply…'}
          wide={part.mode !== 'fill'}
          onEnter={() => void submit()}
          labelledBy={labelledBy}
        />
      )
    return null
  }

  const promptText =
    inlineFill && response.kind === 'text'
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
      : q.view.prompt

  return (
    <div data-instance-id={q.instanceId} data-graded={result ? (result.grade.correct ? 'correct' : 'incorrect') : undefined} className="relative">
      <motion.div key={shake} className={cn('panel-game overflow-hidden', `theme-${theme}`, shake > 0 && 'shake')}>
        {/* Who you're talking to */}
        <div className="flex flex-wrap items-center gap-2 border-b-[3px] border-black/10 bg-white/70 px-3 py-2 sm:px-4">
          <CharacterHead speaker={speaker} className="size-10 border-2" />
          <span className="mr-1 font-display text-lg font-bold">{speakerName}</span>
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
              <HelpCircle className="size-4" aria-hidden /> <span className="hidden sm:inline">Why this question?</span>
              <span className="sr-only sm:hidden">Why this question?</span>
            </button>
          )}
        </div>
        {showWhy && props.reason && <p className="border-b-2 border-black/5 bg-white/70 px-4 py-2 text-sm">{props.reason}</p>}

        <form
          className="chat-thread flex flex-col gap-3 px-3 py-4 sm:px-6 sm:py-5"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          {q.view.context && npcLine('context', q.view.context, { grouped: true })}
          {q.view.passage &&
            npcLine(
              'passage',
              <>
                <span className="block">Here — read this page first.</span>
                <details open className="mt-2 rounded-2xl border-[3px] border-[#c7d2fe] bg-white p-3">
                  <summary className="flex cursor-pointer items-center gap-2 font-display text-lg font-bold text-[#3730a3]">
                    <BookOpen className="size-5" aria-hidden /> {q.view.passage.title}
                  </summary>
                  {q.view.passage.text.split('\n\n').map((para, i) => (
                    <p key={i} className="mt-2 leading-relaxed font-normal">
                      {para}
                    </p>
                  ))}
                </details>
              </>,
              { grouped: true },
            )}

          {b.kind === 'multi' && response.kind === 'multi' ? (
            <>
              {npcLine('prompt', <span className="font-display text-xl leading-snug sm:text-2xl">{q.view.prompt}</span>, { id: promptId })}
              <ol className="flex flex-col gap-3">
                {b.parts.slice(0, visibleSteps).map((part, i) => (
                  <li key={i} data-part-index={i} className="flex flex-col gap-2">
                    <ChatLine side="npc" speaker={speaker} name={speakerName} id={`${promptId}-p${i}`} delay={i === 0 ? nextDelay() : 0}>
                      <span className="flex items-start gap-2">
                        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm text-white" aria-label={`Step ${i + 1}`}>
                          {i + 1}
                        </span>
                        <span>
                          {i > 0 && <span className="text-ink-soft">{['Good. ', 'Next: ', 'And now: '][(i - 1) % 3]}</span>}
                          {part.prompt ?? `Step ${i + 1}`}
                        </span>
                      </span>
                    </ChatLine>
                    <motion.div
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i === 0 ? nextDelay() : 0.2 }}
                      className="pl-0 sm:pl-14"
                    >
                      {renderPart(part, response.parts[i], (v) => setResponse({ kind: 'multi', parts: response.parts.map((x, j) => (j === i ? v : x)) }), `${promptId}-p${i}`)}
                    </motion.div>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            npcLine('prompt', <span className="font-display text-xl leading-snug sm:text-2xl">{promptText}</span>, { id: promptId })
          )}

          {/* Your move: a reply or a puzzle */}
          {b.kind !== 'multi' && !inlineFill && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: nextDelay() }}
              className={cn('flex flex-col gap-2', b.kind === 'mcq' || b.kind === 'text' ? 'items-stretch sm:pl-14' : 'puzzle-tray rounded-3xl p-3 sm:p-4')}
            >
              <p className={cn('flex items-center gap-2 text-sm font-bold tracking-wide text-ink-soft uppercase', b.kind === 'mcq' && 'self-end')}>
                {b.kind !== 'mcq' && b.kind !== 'text' && <Sparkles className="size-4 text-[#d97706]" aria-hidden />}
                {puzzle.title}
              </p>
              {(b.kind === 'mcq' || b.kind === 'numeric' || b.kind === 'text') && renderPart(b, response as PartResponse, setResponse, promptId)}
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
            </motion.div>
          )}

          {/* Pip chimes in with hints */}
          {!result && props.supportMode && hintsShown === 0 && maxHints > 0 && (
            <ChatLine side="npc" speaker="pip" name="Pip" delay={nextDelay()}>
              This one’s been tricky. Want a hint? Using hints is totally fine!
              <span className="mt-2 block">
                <button type="button" className="btn-game yellow !min-h-9 !px-3 !text-sm" onClick={askPip}>
                  Yes, give me a hint
                </button>
              </span>
            </ChatLine>
          )}
          {!result &&
            q.hints.slice(0, hintsShown).map((h, i) => (
              <ChatLine key={`hint-${i}`} side="npc" speaker="pip" name="Pip" tone="hint" delay={0}>
                <span className="flex items-start gap-1.5">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-[#d97706]" aria-hidden />
                  <span>{h}</span>
                </span>
              </ChatLine>
            ))}
          {ai?.kind === 'hint' && !result && <AiNote ai={ai} />}
          {error && (
            <p className="rounded-2xl bg-coral-soft p-3 font-semibold text-coral-deep" role="alert">
              {error}
            </p>
          )}

          {!result && (
            <div className="mt-2 grid grid-cols-2 items-center gap-3 sm:flex sm:flex-wrap sm:justify-end">
              {maxHints > 0 && (
                <button type="button" className="btn-game yellow !px-3 whitespace-nowrap sm:mr-auto sm:!px-[1.4rem]" onClick={askPip} disabled={hintsShown >= maxHints}>
                  <Pip mood="idle" className="size-7" title="" /> {hintsShown >= maxHints ? 'No more hints' : `Ask Pip (${maxHints - hintsShown})`}
                </button>
              )}
              {aiReady && maxHints > 0 && hintsShown > 0 && (
                <button type="button" className="btn-game light col-span-2 sm:col-span-1" onClick={() => void askAi('hint')} disabled={aiBusy}>
                  <Sparkles className={cn('size-5', aiBusy && 'animate-pulse')} aria-hidden /> {aiBusy ? 'Thinking…' : 'Ask for another hint'}
                </button>
              )}
              <button
                ref={checkRef}
                type="submit"
                data-submit
                className={cn(
                  'btn-game orange !px-3 whitespace-nowrap sm:min-w-44 sm:!px-[1.4rem]',
                  maxHints === 0 && 'col-span-2',
                  aiReady && maxHints > 0 && hintsShown > 0 && 'col-span-2 sm:col-span-1',
                )}
                disabled={!complete || submitting}
              >
                {submitting ? 'Checking…' : (props.submitLabel ?? puzzle.submit)}
              </button>
            </div>
          )}
          {!result && !complete && (
            <p className="-mt-1 text-right text-xs text-ink-muted">
              {b.kind === 'mcq' ? 'Pick your reply (or press 1–4).' : b.kind === 'multi' ? 'Answer each step to keep the conversation going.' : 'Finish the puzzle to check it.'}
            </p>
          )}
        </form>

        <AnimatePresence>
          {result && g && feedback === 'full' && (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn('chat-thread flex flex-col gap-3 border-t-[5px] px-3 py-5 sm:px-6', g.correct ? 'border-leaf bg-[#dcfce7]/70' : 'border-coral bg-[#ffe4e6]/70')}
              role="status"
              aria-live="assertive"
            >
              {props.player && (
                <ChatLine side="player" speaker="player" avatar={props.player.avatar} name={props.player.name} delay={0}>
                  {describeReply(b, response)}
                </ChatLine>
              )}
              <ChatLine side="npc" speaker={speaker} name={speakerName} tone={g.correct ? 'good' : 'bad'} delay={reduce ? 0 : 0.25}>
                <span className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-2xl font-bold">{g.correct ? praise : g.score > 0 ? 'So close!' : 'Not quite!'}</span>
                  {g.correct && result.coins > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sun px-3 py-1 font-display font-bold text-[#422006]">
                      <Coins className="size-4" aria-hidden /> +{result.coins}
                    </span>
                  )}
                </span>
                {!g.correct && g.feedback && <span className="mt-1 block text-lg">{g.feedback}</span>}
                {!g.correct && (
                  <span className="mt-1 block text-lg">
                    <span className="font-bold">Correct answer: </span>
                    {g.answerDisplay}
                  </span>
                )}
              </ChatLine>
              <ChatLine side="npc" speaker="pip" name="Pip" tone="hint" delay={reduce ? 0 : 0.6}>
                <span className="font-bold">{g.correct ? 'Why it works: ' : 'Pip explains: '}</span>
                {g.explanation}
              </ChatLine>
              {ai?.kind === 'explain' && <AiNote ai={ai} />}
              {result.mastery.notes.length > 0 && (
                <ul className="space-y-0.5 text-sm text-ink-soft sm:pl-14">
                  {result.mastery.notes.map((n) => (
                    <li key={n}>• {n}</li>
                  ))}
                </ul>
              )}
              {result.rewards.map((r) => (
                <p key={r.kind + r.refId} className="inline-flex w-fit items-center gap-2 rounded-full bg-sun px-3 py-1 text-sm font-bold sm:ml-14">
                  🏅 {r.title}
                </p>
              ))}
              <div className="mt-1 flex flex-wrap justify-end gap-3">
                {aiReady && !g.correct && (
                  <button type="button" className="btn-game light" onClick={() => void askAi('explain')} disabled={aiBusy}>
                    <Sparkles className={cn('size-5', aiBusy && 'animate-pulse')} aria-hidden /> {aiBusy ? 'Thinking…' : 'Explain it another way'}
                  </button>
                )}
                <button ref={nextRef} type="button" className={cn('btn-game', g.correct ? 'green' : '')} onClick={() => props.onNext(result)}>
                  {props.nextLabel ?? 'Continue'} <ChevronRight className="size-5" aria-hidden />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {burst && <CoinBurst key={burst.key} count={burst.n} from={burst.from} />}
    </div>
  )
}

/** One line of the conversation: a portrait and a speech bubble. */
function ChatLine({
  side,
  speaker,
  avatar,
  name,
  tone,
  id,
  delay,
  grouped,
  children,
}: {
  side: 'npc' | 'player'
  speaker: string
  avatar?: AvatarConfig
  name: string
  tone?: 'good' | 'bad' | 'hint'
  id?: string
  delay: number
  /** More lines from the same speaker follow, so the portrait is shown on the last one only. */
  grouped?: boolean
  children: ReactNode
}) {
  const npc = side === 'npc'
  return (
    <motion.div
      initial={delay > 0 ? { opacity: 0, y: 10, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 320, damping: 24 }}
      className={cn('flex items-end gap-2 sm:gap-3', !npc && 'flex-row-reverse')}
    >
      {grouped ? (
        <span className="size-10 shrink-0 sm:size-12" aria-hidden />
      ) : (
        <CharacterHead speaker={speaker} avatar={avatar} title={name} className="size-10 shrink-0 border-2 sm:size-12" />
      )}
      <div
        id={id}
        className={cn(
          'relative max-w-[min(40rem,100%)] min-w-0 rounded-[1.4rem] border-[3px] px-4 py-2.5 font-semibold shadow-[0_3px_0_rgb(0_0_0/0.1)]',
          npc ? 'rounded-bl-md' : 'rounded-br-md',
          tone === 'good'
            ? 'border-leaf bg-white'
            : tone === 'bad'
              ? 'border-coral bg-white'
              : tone === 'hint'
                ? 'border-[#f59e0b] bg-[#fffbeb]'
                : npc
                  ? 'border-white bg-white'
                  : 'border-[#fed7aa] bg-[#ffedd5]',
        )}
      >
        {children}
      </div>
    </motion.div>
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
