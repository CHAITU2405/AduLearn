import { useCallback, useEffect, useRef, useState } from 'react'
import { ChallengePanel, type ChallengeTheme } from '@/components/game/challenge/ChallengePanel'
import { PipSays } from '@/components/game/Pip'
import { Spinner } from '@/components/ui'
import { conceptName } from '@/content'
import type { AvatarConfig } from '@/core/avatar'
import type { ConceptWeight, Difficulty, QuestionResponse } from '@/core/content/types'
import type { RunRules, RunState } from '@/core/game/missionRun'
import type { RewardRecord } from '@/data/db'
import { nextAdaptiveQuestion, recordRunOutcome, submitAnswer, type PreparedQuestion, type SubmitResult } from '@/services/learning'

interface Props {
  profileId: string
  run: RunState
  rules: RunRules
  mix: ConceptWeight[]
  difficultyRange: [Difficulty, Difficulty]
  context: 'mission' | 'practice'
  theme: ChallengeTheme
  /** Called after each accepted outcome (lives/progress changed). */
  onRunChange: (run: RunState) => void
  /** Called when the student continues after the run has ended. */
  onRunEnd: (run: RunState) => void
  /** Called when the run's goal is met (before the student continues). */
  onGoalMet?: (run: RunState) => Promise<RewardRecord[]>
  /** Lets the stage react to each graded answer. */
  onResult?: (result: Extract<SubmitResult, { status: 'graded' }>) => void
  /** Character who talks the explorer through each challenge. */
  speaker?: string
  player?: { avatar: AvatarConfig; name: string }
}

/**
 * Plays an adaptive sequence of challenges for a run. Each question is chosen
 * by the adaptive engine; every answer is graded, recorded and applied.
 */
export function RunPlayer({ profileId, run, rules, mix, difficultyRange, context, theme, onRunChange, onRunEnd, onGoalMet, onResult, speaker, player }: Props) {
  const [prepared, setPrepared] = useState<PreparedQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const runRef = useRef(run)
  runRef.current = run
  const loadSeq = useRef(0)

  const load = useCallback(async () => {
    const seq = ++loadSeq.current
    setLoading(true)
    setError(null)
    try {
      const p = await nextAdaptiveQuestion(profileId, mix, difficultyRange, runRef.current.recent)
      if (seq !== loadSeq.current) return
      if (!p) setError('No approved questions are available for this activity right now. A teacher may need to approve content in the review screen.')
      setPrepared(p)
    } catch (err) {
      if (seq === loadSeq.current) setError(`Could not prepare the next challenge: ${(err as Error).message}`)
    } finally {
      if (seq === loadSeq.current) setLoading(false)
    }
  }, [profileId, mix, difficultyRange])

  useEffect(() => {
    void load()
  }, [load])

  const onSubmit = useCallback(
    async (response: QuestionResponse, hintsUsed: number) => {
      const p = prepared!
      const res = await submitAnswer({ profileId, question: p.question, response, hintsUsed, context, refId: run.refId, selectionReason: p.decision?.reason })
      if (res.status === 'graded') {
        const applied = await recordRunOutcome(profileId, runRef.current, rules, p.question, res.grade, hintsUsed)
        if (applied.accepted) {
          runRef.current = applied.state
          onRunChange(applied.state)
          if (applied.state.status === 'complete' && onGoalMet) {
            const extra = await onGoalMet(applied.state)
            return { ...res, rewards: [...res.rewards, ...extra] }
          }
        }
      }
      return res
    },
    [prepared, profileId, context, run.refId, rules, onRunChange, onGoalMet],
  )

  const onNext = useCallback(() => {
    if (runRef.current.status !== 'active') onRunEnd(runRef.current)
    else void load()
  }, [load, onRunEnd])

  if (loading && !prepared) return <Spinner label="Preparing a fresh challenge" />
  if (error)
    return (
      <PipSays
        mood="thinking"
        actions={
          <button type="button" className="btn-game light !min-h-10 !text-base" onClick={() => void load()}>
            Try again
          </button>
        }
      >
        {error}
      </PipSays>
    )
  if (!prepared) return null
  const ended = run.status !== 'active'
  return (
    <div className={loading ? 'pointer-events-none opacity-60 transition-opacity' : undefined}>
      <ChallengePanel
        key={prepared.question.instanceId}
        question={prepared.question}
        conceptName={conceptName(prepared.question.conceptId)}
        theme={theme}
        hintAllowance="unlimited"
        feedback="full"
        supportMode={prepared.decision?.supportMode}
        reason={prepared.decision?.reason}
        onSubmit={onSubmit}
        onNext={onNext}
        onResult={onResult}
        speaker={speaker}
        player={player}
        nextLabel={ended ? (run.status === 'complete' ? 'Finish mission' : 'Continue') : 'Next challenge'}
      />
    </div>
  )
}
