import { useEffect, useReducer, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, FastForward, Lightbulb, Sparkles, Target } from 'lucide-react'
import { usePrefs } from '@/app/context'
import type { Mood } from '@/components/avatar/AvatarFigure'
import { CharacterSprite, paintedArt } from '@/components/story/CharacterSprite'
import { cn } from '@/components/ui'
import { getCharacter } from '@/content/characters'
import type { AvatarConfig } from '@/core/avatar'
import { dialogueReducer, initialDialogue } from '@/core/story/machine'
import type { StoryScene } from '@/core/story/types'
import { play } from '@/lib/sfx'
import { dialogueVariation } from '@/services/ai/features'

function Speaker({ speaker, avatar, mood, side }: { speaker: string; avatar: AvatarConfig; mood: Mood; side: 'left' | 'right' }) {
  const painted = !!paintedArt(speaker, avatar)
  return (
    <motion.div
      key={speaker}
      initial={{ x: side === 'left' ? -80 : 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        'pointer-events-none absolute bottom-full',
        painted ? 'mb-[-6px] h-[230px] w-[190px] sm:h-[340px] sm:w-[280px]' : 'mb-[-12px] h-[200px] w-[150px] sm:h-[280px] sm:w-[200px]',
        side === 'left' ? 'left-2 sm:left-6' : 'right-2 sm:right-6',
      )}
    >
      <CharacterSprite speaker={speaker} avatar={avatar} mood={mood} face={side === 'left' ? 'right' : 'left'} className="size-full" />
    </motion.div>
  )
}

/** Visual-novel style dialogue for story scenes inside game screens. */
export function VnDialogue({
  scene,
  avatar,
  playerName,
  onDone,
  doneLabel = 'Let’s go!',
}: {
  scene: StoryScene
  avatar: AvatarConfig
  playerName: string
  onDone: () => void
  doneLabel?: string
}) {
  const [state, dispatch] = useReducer((s: typeof initialDialogue, e: Parameters<typeof dialogueReducer>[2]) => dialogueReducer(scene, s, e), initialDialogue)
  const { prefs } = usePrefs()
  const reduce = prefs.motion === 'reduce' || (prefs.motion === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  const line = scene.lines[state.lineIndex]
  const [variant, setVariant] = useState<string | null>(null)
  const text = variant ?? line.text
  const [shown, setShown] = useState(reduce ? text.length : 0)
  const [showTip, setShowTip] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const nextRef = useRef<HTMLButtonElement>(null)
  const typing = shown < text.length
  const needsChoice = !!line.choices?.length && !state.reply
  const isLast = state.lineIndex === scene.lines.length - 1

  useEffect(() => {
    if (state.done) onDone()
  }, [state.done, onDone])
  useEffect(() => {
    setVariant(null)
  }, [state.lineIndex])
  useEffect(() => {
    if (reduce) {
      setShown(text.length)
      return
    }
    setShown(0)
    const id = setInterval(() => setShown((n) => (n >= text.length ? n : n + 2)), 22)
    return () => clearInterval(id)
  }, [text, reduce])
  useEffect(() => {
    if (!typing && !needsChoice) nextRef.current?.focus({ preventScroll: true })
  }, [typing, needsChoice])

  const advance = () => {
    if (typing) {
      setShown(text.length)
      return
    }
    play('tap')
    dispatch({ type: 'advance' })
  }

  const name = line.speaker === 'player' ? playerName : getCharacter(line.speaker).name
  const mood: Mood = state.reply ? 'happy' : line.choices ? 'thinking' : 'happy'

  return (
    <div className="relative z-20 mx-auto w-full max-w-4xl px-3 pb-4 sm:px-6">
      <AnimatePresence mode="popLayout">
        <Speaker key={line.speaker} speaker={line.speaker} avatar={avatar} mood={mood} side={line.speaker === 'player' ? 'right' : 'left'} />
      </AnimatePresence>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative rounded-[1.75rem] border-[5px] border-[#1e293b] bg-[#fffdf7] shadow-[0_8px_0_#1e293b,0_24px_40px_-12px_rgb(0_0_0/0.5)]"
      >
        <span
          className={cn(
            'absolute -top-5 rounded-xl border-[4px] border-[#1e293b] bg-sun px-4 py-1 font-display text-lg font-bold text-[#1e293b]',
            line.speaker === 'player' ? 'right-6' : 'left-6',
          )}
        >
          {name}
        </span>
        {scene.objective && (
          <p className="flex items-start gap-2 rounded-t-[1.4rem] border-b-2 border-[#e2e8f0] bg-[#eff6ff] px-5 pt-5 pb-2 text-sm">
            <Target className="mt-0.5 size-4 shrink-0 text-brand-deep" aria-hidden />
            <span>
              <span className="font-bold">Mission: </span>
              {scene.objective}
            </span>
          </p>
        )}
        <div className={cn('px-5 pb-4', scene.objective ? 'pt-3' : 'pt-7')} aria-live="polite">
          <p className="min-h-[3.5rem] text-lg leading-relaxed font-semibold sm:text-xl" onClick={advance}>
            <span className="sr-only">{text}</span>
            <span aria-hidden>{text.slice(0, shown)}</span>
            {typing && <span className="ml-0.5 inline-block h-5 w-2 animate-pulse bg-ink align-middle" aria-hidden />}
          </p>
          {variant && <p className="text-xs text-ink-muted">Rephrased by local AI from the approved line.</p>}
          {state.reply && (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 rounded-2xl bg-sun-soft px-4 py-3 font-semibold">
              {state.reply}
            </motion.p>
          )}
          {needsChoice && !typing && (
            <div className="mt-3 flex flex-wrap gap-3" role="group" aria-label="Choose a reply">
              {line.choices!.map((c, i) => (
                <button
                  key={c.label}
                  type="button"
                  className="btn-game violet !text-base"
                  onClick={() => {
                    play('tap')
                    dispatch({ type: 'choose', index: i })
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
          {showTip && scene.hint && (
            <p className="mt-3 flex gap-2 rounded-2xl bg-sun-soft px-4 py-2 text-sm">
              <Lightbulb className="size-4 shrink-0 text-[#a16207]" aria-hidden /> {scene.hint}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#e2e8f0] px-4 py-3">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:bg-paper"
              onClick={() => dispatch({ type: 'skip' })}
            >
              <FastForward className="size-4" aria-hidden /> Skip story
            </button>
            {scene.hint && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:bg-paper"
                onClick={() => setShowTip((v) => !v)}
                aria-expanded={showTip}
              >
                <Lightbulb className="size-4" aria-hidden /> Tip
              </button>
            )}
            {prefs.ai.enabled && prefs.ai.model && (
              <button
                type="button"
                disabled={aiBusy}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:bg-paper"
                onClick={async () => {
                  setAiBusy(true)
                  const r = await dialogueVariation(prefs.ai, { characterName: name, line: line.text })
                  setAiBusy(false)
                  if (r.source === 'ai') setVariant(r.text)
                }}
              >
                <Sparkles className={cn('size-4', aiBusy && 'animate-pulse')} aria-hidden /> Say it differently
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-muted" aria-hidden>
              {state.lineIndex + 1}/{scene.lines.length}
            </span>
            <button ref={nextRef} type="button" className="btn-game orange" onClick={advance} disabled={needsChoice && !typing}>
              {typing ? 'Skip text' : isLast ? doneLabel : 'Continue'} <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
