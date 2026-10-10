import { useEffect, useReducer, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Lightbulb, Sparkles, Target } from 'lucide-react'
import { usePrefs } from '@/app/context'
import { Button, Card, cn } from '@/components/ui'
import type { AvatarConfig } from '@/core/avatar'
import { dialogueReducer, initialDialogue } from '@/core/story/machine'
import type { StoryScene } from '@/core/story/types'
import { dialogueVariation } from '@/services/ai/features'
import { CharacterPortrait, speakerName } from './CharacterPortrait'

interface Props {
  scene: StoryScene
  onDone: () => void
  playerAvatar: AvatarConfig
  playerName: string
  doneLabel?: string
}

/** Reusable story dialogue: portrait, text, optional choices, objective and hint. */
export function StoryDialogue({ scene, onDone, playerAvatar, playerName, doneLabel = 'Let’s go' }: Props) {
  const [state, dispatch] = useReducer((s: typeof initialDialogue, e: Parameters<typeof dialogueReducer>[2]) => dialogueReducer(scene, s, e), initialDialogue)
  const [showHint, setShowHint] = useState(false)
  const { prefs } = usePrefs()
  const [variant, setVariant] = useState<{ index: number; text: string } | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiNote, setAiNote] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const continueRef = useRef<HTMLButtonElement>(null)
  const line = scene.lines[state.lineIndex]
  const isLast = state.lineIndex === scene.lines.length - 1
  const needsChoice = !!line.choices?.length && !state.reply

  useEffect(() => {
    if (state.done) onDone()
  }, [state.done, onDone])
  useEffect(() => () => abortRef.current?.abort(), [])
  useEffect(() => {
    setVariant(null)
    setAiNote(null)
    if (!needsChoice) continueRef.current?.focus({ preventScroll: true })
  }, [state.lineIndex, state.reply, needsChoice])

  async function sayDifferently() {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setAiBusy(true)
    setAiNote(null)
    const res = await dialogueVariation(prefs.ai, { characterName: speakerName(line.speaker, playerName), line: line.text }, { signal: ctrl.signal })
    setAiBusy(false)
    if (res.source === 'ai') setVariant({ index: state.lineIndex, text: res.text })
    else setAiNote(`Showing the original line. ${res.reason}`)
  }

  const text = variant?.index === state.lineIndex ? variant.text : line.text

  return (
    <Card className="overflow-hidden">
      {scene.objective && (
        <div className="flex items-start gap-2 border-b border-line bg-brand-soft/60 px-5 py-3 text-sm">
          <Target className="mt-0.5 size-4 shrink-0 text-brand-deep" aria-hidden />
          <p>
            <span className="font-bold">Mission objective: </span>
            {scene.objective}
          </p>
        </div>
      )}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
        <CharacterPortrait speaker={line.speaker} playerAvatar={playerAvatar} playerName={playerName} className="size-20 shrink-0 sm:size-28" />
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="font-display text-lg font-bold text-brand-deep">{speakerName(line.speaker, playerName)}</p>
          <motion.p
            key={`${state.lineIndex}-${text}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-1 text-lg leading-relaxed"
          >
            {text}
          </motion.p>
          {variant?.index === state.lineIndex && <p className="mt-1 text-xs text-ink-muted">Rephrased by local AI from the approved line.</p>}
          {aiNote && <p className="mt-1 text-xs text-ink-muted">{aiNote}</p>}
          {state.reply && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-2xl bg-sun-soft px-4 py-3">
              <span className="font-bold">{speakerName(line.speaker, playerName)}: </span>
              {state.reply}
            </motion.p>
          )}
          {needsChoice && (
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose a reply">
              {line.choices!.map((c, i) => (
                <Button key={c.label} variant="secondary" onClick={() => dispatch({ type: 'choose', index: i })}>
                  {c.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
      {showHint && scene.hint && (
        <div className="mx-5 mb-4 flex gap-2 rounded-2xl bg-sun-soft px-4 py-3 text-sm sm:mx-6">
          <Lightbulb className="size-4 shrink-0 text-[#a16207]" aria-hidden />
          <p>{scene.hint}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper/60 px-5 py-3 sm:px-6">
        <div className="flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'skip' })}>
            Skip story
          </Button>
          {scene.hint && (
            <Button variant="ghost" size="sm" onClick={() => setShowHint((v) => !v)} aria-expanded={showHint}>
              <Lightbulb className="size-4" aria-hidden /> {showHint ? 'Hide tip' : 'Tip'}
            </Button>
          )}
          {prefs.ai.enabled && prefs.ai.model && (
            <Button variant="ghost" size="sm" onClick={sayDifferently} disabled={aiBusy}>
              <Sparkles className={cn('size-4', aiBusy && 'animate-pulse')} aria-hidden /> {aiBusy ? 'Thinking…' : 'Say it differently'}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-muted" aria-hidden>
            {state.lineIndex + 1} / {scene.lines.length}
          </span>
          <Button ref={continueRef} onClick={() => dispatch({ type: 'advance' })} disabled={needsChoice}>
            {isLast ? doneLabel : 'Continue'} <ChevronRight className="size-5" aria-hidden />
          </Button>
        </div>
      </div>
    </Card>
  )
}
