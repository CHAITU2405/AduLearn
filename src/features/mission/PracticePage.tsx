import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Dumbbell, Map as MapIcon, RotateCcw } from 'lucide-react'
import { useRequiredProfile } from '@/app/context'
import { GameHud } from '@/components/game/GameHud'
import { GameScreen, MissionBanner } from '@/components/game/GameScreen'
import { OutcomeCard } from '@/components/game/Outcome'
import { PipSays } from '@/components/game/Pip'
import { ProgressTrack, themeForSubject } from '@/components/game/Stage'
import { Pill } from '@/components/ui'
import { conceptName, getChapter, getMission } from '@/content'
import type { ConceptWeight, Difficulty } from '@/core/content/types'
import { startRun, type RunState } from '@/core/game/missionRun'
import { play } from '@/lib/sfx'
import { practiceRules, type SubmitResult } from '@/services/learning'
import { RunPlayer } from './RunPlayer'

const RANGE: [Difficulty, Difficulty] = [1, 3]

/** Training ground: no hearts, adaptive, focused on chosen skills. */
export function PracticePage() {
  const { chapterId = '' } = useParams()
  const [params] = useSearchParams()
  const profile = useRequiredProfile()
  const navigate = useNavigate()
  const chapter = getChapter(chapterId)
  const fromMission = getMission(params.get('from') ?? '')
  const requested = params.getAll('concept').filter((c) => chapter?.conceptIds.includes(c))
  const conceptKey = requested.join('|')
  const concepts = useMemo(() => (conceptKey ? conceptKey.split('|') : (chapter?.conceptIds ?? [])), [conceptKey, chapter])
  const mix = useMemo<ConceptWeight[]>(() => concepts.map((conceptId) => ({ conceptId, weight: 1 })), [concepts])
  const rules = useMemo(() => practiceRules(), [])
  const [run, setRun] = useState<RunState>(() => startRun(`practice-${Date.now().toString(36)}`, `practice:${chapterId}`, rules))
  const [done, setDone] = useState(false)
  const [coins, setCoins] = useState(0)
  const onRunEnd = useCallback(() => {
    play('win')
    setDone(true)
  }, [])
  const onResult = useCallback((r: Extract<SubmitResult, { status: 'graded' }>) => setCoins((c) => c + r.coins), [])

  if (!chapter || chapter.status !== 'playable') return <p className="p-8">This chapter is not available.</p>
  const theme = themeForSubject(chapter.subject)
  const back = fromMission ? { to: `/mission/${fromMission.id}`, label: fromMission.title } : { to: `/region/${chapter.regionId}`, label: 'Map' }

  return (
    <GameScreen theme={theme} hud={<GameHud profile={profile} title="Training ground" back={back} compact />}>
      <MissionBanner eyebrow="Training ground · no hearts" title={`Practise: ${concepts.map(conceptName).join(', ')}`} />
      {!done ? (
        <div className="mt-5">
          <PipSays mood="happy" className="mb-4" size="sm">
            No hearts to lose here! Answer {rules.goal.correct} challenges correctly. Ask me for hints any time.
          </PipSays>
          <ProgressTrack
            theme={theme}
            filled={run.correct}
            total={rules.goal.correct}
            caption={`Training ${Math.min(run.correct, rules.goal.correct)}/${rules.goal.correct} · ${run.answered} answered`}
          />
          <RunPlayer
            profileId={profile.id}
            run={run}
            rules={rules}
            mix={mix}
            difficultyRange={RANGE}
            context="practice"
            theme={theme}
            onRunChange={setRun}
            onRunEnd={onRunEnd}
            onResult={onResult}
          />
        </div>
      ) : (
        <div className="mt-14">
          <OutcomeCard
            kind="victory"
            title="Practice complete!"
            subtitle={`${run.correct} of ${run.answered} correct`}
            coins={coins}
            pipLine={run.comebacks.length > 0 ? 'You bounced back after a mistake — that’s exactly how learning works!' : 'Your skills are getting stronger!'}
            actions={
              <>
                {fromMission ? (
                  <button type="button" className="btn-game orange" onClick={() => navigate(`/mission/${fromMission.id}`)}>
                    Try {fromMission.title} again
                  </button>
                ) : (
                  <button type="button" className="btn-game orange" onClick={() => navigate(`/region/${chapter.regionId}`)}>
                    <MapIcon className="size-5" aria-hidden /> Back to the map
                  </button>
                )}
                <button
                  type="button"
                  className="btn-game light"
                  onClick={() => {
                    setRun(startRun(`practice-${Date.now().toString(36)}`, `practice:${chapterId}`, rules))
                    setCoins(0)
                    setDone(false)
                  }}
                >
                  <RotateCcw className="size-5" aria-hidden /> Practise more
                </button>
              </>
            }
          >
            <div className="flex flex-wrap justify-center gap-2">
              <Dumbbell className="size-5 text-[#4338ca]" aria-hidden />
              {concepts.map((c) => (
                <Pill key={c} tone="violet">
                  {conceptName(c)}
                </Pill>
              ))}
            </div>
          </OutcomeCard>
        </div>
      )}
    </GameScreen>
  )
}
