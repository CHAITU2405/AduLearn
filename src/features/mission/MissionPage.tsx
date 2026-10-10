import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Dumbbell, Map as MapIcon, RotateCcw } from 'lucide-react'
import { useRequiredProfile } from '@/app/context'
import type { Mood } from '@/components/avatar/AvatarFigure'
import { HeartsBar } from '@/components/game/challenge/effects'
import { GameHud } from '@/components/game/GameHud'
import { GameScreen, MissionBanner } from '@/components/game/GameScreen'
import { OutcomeCard } from '@/components/game/Outcome'
import { PipSays } from '@/components/game/Pip'
import { ProgressTrack, StageCharacters, themeForSubject } from '@/components/game/Stage'
import { VnDialogue } from '@/components/game/VnDialogue'
import { LitmusLab, PressureLab } from '@/components/labs/Labs'
import { Pill, Spinner } from '@/components/ui'
import { chapterNodeStates, conceptName, getChapter, getMission, getRegion, SCENES } from '@/content'
import type { Mission } from '@/core/content/types'
import { missionStars } from '@/core/game/economy'
import { conceptsToPractise, type RunState } from '@/core/game/missionRun'
import { BAND_LABELS, masteryBand } from '@/core/learning/mastery'
import { flowReducer, type FlowPhase } from '@/core/story/machine'
import type { RewardRecord } from '@/data/db'
import { useMastery, useSnapshot } from '@/data/hooks'
import { play } from '@/lib/sfx'
import { completeMission, missionRules, resumeOrStartMission, type SubmitResult } from '@/services/learning'
import { RunPlayer } from './RunPlayer'

const TRACK_LABEL = { numbers: 'Bridge planks', words: 'Books restored', discovery: 'Energy cells', boss: 'Power' } as const

export function MissionPage() {
  const { missionId = '' } = useParams()
  const mission = getMission(missionId)
  if (!mission) return <p className="p-8">This mission does not exist.</p>
  return <MissionFlow key={mission.id} mission={mission} />
}

function MissionFlow({ mission }: { mission: Mission }) {
  const profile = useRequiredProfile()
  const snapshot = useSnapshot(profile.id)
  const chapter = getChapter(mission.chapterId)!
  const region = getRegion(chapter.regionId)!
  const theme = themeForSubject(chapter.subject)
  const [phase, dispatch] = useReducer(flowReducer, 'intro' as FlowPhase)
  const [run, setRun] = useState<RunState | null>(null)
  const [rewards, setRewards] = useState<RewardRecord[]>([])
  const [coins, setCoins] = useState(0)
  const [moods, setMoods] = useState<{ npc: Mood; me: Mood }>({ npc: 'happy', me: 'happy' })
  const rules = useMemo(() => missionRules(mission), [mission])

  useEffect(() => {
    let cancelled = false
    void resumeOrStartMission(profile.id, mission).then((r) => {
      if (!cancelled) setRun(r)
    })
    return () => {
      cancelled = true
    }
  }, [profile.id, mission])

  const onGoalMet = useCallback(
    async (r: RunState) => {
      const earned = await completeMission(profile.id, mission.id, r)
      setRewards(earned)
      return earned
    },
    [profile.id, mission.id],
  )
  const onRunEnd = useCallback((r: RunState) => {
    if (r.status === 'complete') play('win')
    else play('lose')
    dispatch({ type: r.status === 'complete' ? 'run-complete' : 'run-failed' })
  }, [])
  const onResult = useCallback((res: Extract<SubmitResult, { status: 'graded' }>) => {
    setCoins((c) => c + res.coins)
    setMoods(res.grade.correct ? { npc: 'excited', me: 'excited' } : { npc: 'surprised', me: 'sad' })
    setTimeout(() => setMoods({ npc: 'happy', me: 'thinking' }), 1400)
  }, [])
  const retry = useCallback(async () => {
    const fresh = await resumeOrStartMission(profile.id, mission, { fresh: true })
    setRun(fresh)
    setRewards([])
    setCoins(0)
    dispatch({ type: 'retry' })
  }, [profile.id, mission])
  const introDone = useCallback(() => dispatch({ type: 'intro-done', hasLab: !!mission.lab }), [mission.lab])
  const outroDone = useCallback(() => dispatch({ type: 'outro-done' }), [])

  if (!snapshot || !run) return <Spinner label="Preparing the mission" />
  const locked = chapterNodeStates(chapter, snapshot)[mission.id] === 'locked'
  const playing = phase === 'play' && run.lives !== null && run.maxLives !== null
  const hud = (
    <GameHud
      profile={profile}
      title={mission.title}
      back={{ to: `/region/${region.id}`, label: region.name }}
      compact
      center={playing ? <HeartsBar lives={run.lives!} max={run.maxLives!} /> : undefined}
    />
  )

  if (locked) {
    return (
      <GameScreen theme={theme} hud={hud}>
        <PipSays
          mood="thinking"
          actions={
            <Link to={`/region/${region.id}`} className="btn-game light !min-h-10 !text-base">
              Back to the map
            </Link>
          }
        >
          This mission is still locked. Finish the earlier places in {region.name} first!
        </PipSays>
      </GameScreen>
    )
  }

  const goal = mission.goal
  const caption = (
    <>
      {TRACK_LABEL[theme]} {Math.min(run.correct, goal.correct)}/{goal.correct}
      {goal.atDifficulty && (
        <span className="ml-2 text-[#a16207]">
          ◆ harder challenges {Math.min(run.correctAtDifficulty, goal.atDifficulty.count)}/{goal.atDifficulty.count}
        </span>
      )}
    </>
  )

  return (
    <GameScreen
      theme={theme}
      hud={hud}
      characters={phase === 'play' ? <StageCharacters npcId={mission.characterId} avatar={profile.avatar} npcMood={moods.npc} playerMood={moods.me} /> : undefined}
      bottom={
        phase === 'intro' ? (
          <VnDialogue
            scene={SCENES[mission.introSceneId]}
            avatar={profile.avatar}
            playerName={profile.nickname}
            onDone={introDone}
            doneLabel={mission.lab ? 'To the lab!' : 'Start mission!'}
          />
        ) : phase === 'outro' ? (
          <VnDialogue scene={SCENES[mission.outroSceneId]} avatar={profile.avatar} playerName={profile.nickname} onDone={outroDone} doneLabel="See rewards" />
        ) : undefined
      }
    >
      {(phase === 'intro' || phase === 'outro') && (
        <>
          <MissionBanner eyebrow={phase === 'intro' ? `${region.subjectLabel} mission` : 'Mission complete'} title={mission.title} subtitle={mission.summary} />
          {phase === 'intro' && run.answered > 0 && (
            <div className="mt-4">
              <PipSays mood="happy">
                Welcome back! You’re part-way through: {run.correct} correct so far and {run.lives} heart{run.lives === 1 ? '' : 's'} left.
              </PipSays>
            </div>
          )}
          {phase === 'outro' && (
            <div className="mt-6">
              <ProgressTrack theme={theme} filled={goal.correct} total={goal.correct} caption={`${TRACK_LABEL[theme]} complete!`} />
            </div>
          )}
          <div className="mx-auto mt-3 w-fit">
            <Pill tone="sun">Illustrative sample content</Pill>
          </div>
        </>
      )}

      {phase === 'lab' &&
        (mission.lab === 'pressure' ? <PressureLab onDone={() => dispatch({ type: 'lab-done' })} /> : <LitmusLab onDone={() => dispatch({ type: 'lab-done' })} />)}

      {phase === 'play' && (
        <>
          <ProgressTrack theme={theme} filled={run.correct} total={goal.correct} caption={caption} />
          <RunPlayer
            profileId={profile.id}
            run={run}
            rules={rules}
            mix={mission.conceptMix}
            difficultyRange={mission.difficultyRange}
            context="mission"
            theme={theme}
            onRunChange={setRun}
            onRunEnd={onRunEnd}
            onGoalMet={onGoalMet}
            onResult={onResult}
          />
        </>
      )}

      {phase === 'summary' && <Victory mission={mission} run={run} rewards={rewards} coins={coins} onRetry={retry} />}
      {phase === 'failed' && <Defeat mission={mission} run={run} onRetry={retry} theme={theme} />}
    </GameScreen>
  )
}

function Victory({ mission, run, rewards, coins, onRetry }: { mission: Mission; run: RunState; rewards: RewardRecord[]; coins: number; onRetry: () => void }) {
  const profile = useRequiredProfile()
  const mastery = useMastery(profile.id)
  const navigate = useNavigate()
  const chapter = getChapter(mission.chapterId)!
  const stars = missionStars(run) || 1
  const accuracy = run.answered ? Math.round((run.correct / run.answered) * 100) : 0
  return (
    <div className="mt-14">
      <OutcomeCard
        kind="victory"
        title="Mission complete!"
        subtitle={mission.title}
        stars={stars}
        coins={coins}
        pipLine={stars === 3 ? 'Three stars — no hearts lost! Amazing!' : 'Great job! Keep all your hearts next time for three stars.'}
        actions={
          <>
            <button type="button" className="btn-game orange" onClick={() => navigate(`/region/${chapter.regionId}`)}>
              <MapIcon className="size-5" aria-hidden /> Back to the map
            </button>
            <button type="button" className="btn-game light" onClick={onRetry}>
              <RotateCcw className="size-5" aria-hidden /> Play again
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <dl className="grid grid-cols-2 gap-2">
            {[
              ['Answered', run.answered],
              ['Correct', `${run.correct} (${accuracy}%)`],
              ['Hints used', run.hintsUsed],
              ['Comebacks', run.comebacks.length],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white p-3 text-center shadow-soft">
                <dt className="text-xs font-bold text-ink-muted uppercase">{k}</dt>
                <dd className="font-display text-2xl font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <div>
            <p className="font-display text-lg font-bold">Skills</p>
            <ul className="mt-1 flex flex-col gap-1.5">
              {mission.conceptMix.map((c) => {
                const band = masteryBand(mastery?.[c.conceptId])
                return (
                  <li key={c.conceptId} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 shadow-soft">
                    <span className="text-sm font-semibold">{conceptName(c.conceptId)}</span>
                    <Pill tone={band === 'secure' ? 'leaf' : band === 'developing' ? 'brand' : 'orange'}>{BAND_LABELS[band]}</Pill>
                  </li>
                )
              })}
            </ul>
            {rewards.map((r) => (
              <p key={r.kind + r.refId} className="mt-2 rounded-xl bg-sun-soft px-3 py-2 text-sm font-bold">
                🏅 {r.title}
              </p>
            ))}
          </div>
        </div>
      </OutcomeCard>
    </div>
  )
}

function Defeat({ mission, run, onRetry, theme }: { mission: Mission; run: RunState; onRetry: () => void; theme: string }) {
  const concepts = conceptsToPractise(run)
  const practiceHref = `/practice/${mission.chapterId}?${concepts.map((c) => `concept=${encodeURIComponent(c)}`).join('&')}&from=${mission.id}`
  const navigate = useNavigate()
  const title = theme === 'numbers' ? 'The bridge wobbled!' : theme === 'words' ? 'The ink ran out!' : 'The power flickered out!'
  return (
    <div className="mt-14">
      <OutcomeCard
        kind="defeat"
        title={title}
        subtitle="Out of hearts — for now"
        pipLine="That’s how learning works! Everything you answered is saved. Let’s train, then try again with new challenges."
        actions={
          <>
            <button type="button" className="btn-game violet" onClick={() => navigate(practiceHref)}>
              <Dumbbell className="size-5" aria-hidden /> Targeted practice
            </button>
            <button type="button" className="btn-game orange" onClick={onRetry}>
              <RotateCcw className="size-5" aria-hidden /> Retry mission
            </button>
          </>
        }
      >
        <p className="text-center">
          You got <strong>{run.correct}</strong> of {run.answered} right.
          {concepts.length > 0 && ' These skills need a little training:'}
        </p>
        {concepts.length > 0 && (
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {concepts.map((c) => (
              <li key={c}>
                <Pill tone="coral">
                  {conceptName(c)} · {run.errorsByConcept[c]} missed
                </Pill>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-center text-sm text-ink-soft">The training ground has no hearts to lose. Retrying the mission uses different questions.</p>
      </OutcomeCard>
    </div>
  )
}
