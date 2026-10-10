import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Dumbbell, Map as MapIcon, RotateCcw, Shield, Swords } from 'lucide-react'
import { useRequiredProfile } from '@/app/context'
import { AvatarFigure, CreatureFigure, type Mood } from '@/components/avatar/AvatarFigure'
import { ChallengePanel } from '@/components/game/challenge/ChallengePanel'
import { HeartsBar } from '@/components/game/challenge/effects'
import { GameHud } from '@/components/game/GameHud'
import { GameScreen, MissionBanner } from '@/components/game/GameScreen'
import { OutcomeCard } from '@/components/game/Outcome'
import { Pip, PipSays } from '@/components/game/Pip'
import { VnDialogue } from '@/components/game/VnDialogue'
import { Pill, Spinner } from '@/components/ui'
import { chapterNodeStates, conceptName, getBoss, getChapter, getRegion, SCENES } from '@/content'
import { getCharacter } from '@/content/characters'
import type { AvatarConfig } from '@/core/avatar'
import type { BossBlueprint, QuestionResponse } from '@/core/content/types'
import type { GeneratedQuestion } from '@/core/engine/generator'
import { applyBossResult, startBossRun, type BossEvaluation, type BossRunState } from '@/core/game/boss'
import { bossStars } from '@/core/game/economy'
import type { RewardRecord } from '@/data/db'
import { useSnapshot } from '@/data/hooks'
import { play } from '@/lib/sfx'
import { bossRoundQuestion, finishBoss, planBossForProfile, submitAnswer, type BossPlan, type SubmitResult } from '@/services/learning'

type Phase = 'intro' | 'fight' | 'outro' | 'won' | 'lost'
type Strike = { kind: 'bolt' | 'attack'; key: number } | null

export function BossPage() {
  const { bossId = '' } = useParams()
  const boss = getBoss(bossId)
  if (!boss) return <p className="p-8">This challenge does not exist.</p>
  return <BossFlow key={boss.id} boss={boss} />
}

function BossFlow({ boss }: { boss: BossBlueprint }) {
  const profile = useRequiredProfile()
  const snapshot = useSnapshot(profile.id)
  const chapter = getChapter(boss.chapterId)!
  const region = getRegion(chapter.regionId)!
  const [phase, setPhase] = useState<Phase>('intro')
  const [plan, setPlan] = useState<BossPlan | null>(null)
  const [planError, setPlanError] = useState<string[] | null>(null)
  const [state, setState] = useState<BossRunState>(() => startBossRun(boss))
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null)
  const [outcome, setOutcome] = useState<{ evaluation: BossEvaluation; rewards: RewardRecord[] } | null>(null)
  const [strike, setStrike] = useState<Strike>(null)
  const [coins, setCoins] = useState(0)
  const stateRef = useRef(state)
  stateRef.current = state

  const newPlan = useCallback(async () => {
    const res = await planBossForProfile(profile.id, boss.id)
    if (res.ok) {
      setPlan(res.plan)
      setPlanError(null)
    } else setPlanError(res.errors)
    const fresh = startBossRun(boss)
    setState(fresh)
    stateRef.current = fresh
    setOutcome(null)
    setQuestion(null)
    setCoins(0)
    return res.ok ? res.plan : null
  }, [profile.id, boss])

  useEffect(() => {
    void newPlan()
  }, [newPlan])

  useEffect(() => {
    if (phase !== 'fight' || !plan || question || state.status !== 'active') return
    let cancelled = false
    void bossRoundQuestion(profile.id, plan.rounds[state.roundIndex]).then((q) => {
      if (!cancelled) setQuestion(q)
    })
    return () => {
      cancelled = true
    }
  }, [phase, plan, question, state.status, state.roundIndex, profile.id])

  const onSubmit = useCallback(
    async (response: QuestionResponse, hintsUsed: number) => {
      const q = question!
      const res = await submitAnswer({ profileId: profile.id, question: q, response, hintsUsed, context: 'boss', refId: boss.id })
      if (res.status === 'graded') {
        const applied = applyBossResult(boss, stateRef.current, q.instanceId, { conceptId: q.conceptId, correct: res.grade.correct, score: res.grade.score, hintsUsed, misconceptionId: res.grade.misconceptionId })
        if (applied.accepted) {
          stateRef.current = applied.state
          setState(applied.state)
          if (applied.state.status !== 'active' && plan) setOutcome(await finishBoss(profile.id, plan, applied.state))
        }
      }
      return res
    },
    [question, profile.id, boss, plan],
  )

  const onResult = useCallback((r: Extract<SubmitResult, { status: 'graded' }>) => {
    setCoins((c) => c + r.coins)
    setStrike({ kind: r.grade.correct ? 'bolt' : 'attack', key: Date.now() })
    setTimeout(() => play(r.grade.correct ? 'hit' : 'hurt'), 350)
  }, [])

  const onNext = useCallback(() => {
    const s = stateRef.current
    if (s.status === 'won') {
      play('win')
      setPhase('outro')
    } else if (s.status === 'lost') {
      play('lose')
      setPhase('lost')
    } else setQuestion(null)
  }, [])

  if (!snapshot) return <Spinner />
  const total = boss.rounds.length
  const hp = total - state.results.filter((r) => r.correct).length
  const round = plan?.rounds[Math.min(state.roundIndex, total - 1)]
  const hud = (
    <GameHud
      profile={profile}
      title={boss.title}
      back={{ to: `/region/${region.id}`, label: region.name }}
      compact
      center={phase === 'fight' ? <HeartsBar lives={state.lives} max={boss.lives} /> : undefined}
    />
  )

  if (chapterNodeStates(chapter, snapshot)[boss.id] === 'locked') {
    return (
      <GameScreen theme="boss" hud={hud}>
        <PipSays
          mood="thinking"
          actions={
            <Link to={`/region/${region.id}`} className="btn-game light !min-h-10 !text-base">
              Back to the map
            </Link>
          }
        >
          This boss is still locked. Finish the missions before it in {region.name}!
        </PipSays>
      </GameScreen>
    )
  }

  return (
    <GameScreen
      theme="boss"
      hud={hud}
      bottom={
        phase === 'intro' && plan ? (
          <VnDialogue scene={SCENES[boss.introSceneId]} avatar={profile.avatar} playerName={profile.nickname} onDone={() => setPhase('fight')} doneLabel="Battle!" />
        ) : phase === 'outro' ? (
          <VnDialogue scene={SCENES[boss.outroSceneId]} avatar={profile.avatar} playerName={profile.nickname} onDone={() => setPhase('won')} doneLabel="See rewards" />
        ) : undefined
      }
    >
      {planError && (
        <PipSays mood="sad">
          This challenge can’t be built right now: {planError.join(' ')} A teacher may need to approve more content.
        </PipSays>
      )}

      {phase === 'intro' && (
        <>
          <MissionBanner eyebrow={boss.tier === 'chapter' ? 'Chapter boss' : 'Mini-boss'} title={boss.bossName} subtitle={boss.title} />
          <div className="mx-auto mt-4 max-w-xl rounded-3xl border-4 border-white/80 bg-white/90 p-5 shadow-lift">
            <p className="font-display text-xl font-bold">Battle rules</p>
            <ul className="mt-2 space-y-1 text-ink-soft">
              <li>⚔️ {total} rounds mixing skills from earlier missions — some have more than one step.</li>
              <li>
                🏆 Win with at least {Math.ceil(boss.passing.minCorrectRatio * total)} of {total} correct, and at least one correct for every skill.
              </li>
              <li>
                ❤️ {boss.lives} hearts · 💡 {boss.hintsAllowed} hint{boss.hintsAllowed === 1 ? '' : 's'} from Pip for the whole battle.
              </li>
              <li>🔁 Lose? You’ll get training and a different battle next time.</li>
            </ul>
          </div>
        </>
      )}

      {phase === 'fight' && plan && (
        <>
          <Arena boss={boss} hp={hp} total={total} avatar={profile.avatar} strike={strike} lives={state.lives} />
          {round && (
            <motion.p key={round.index} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mb-4 flex w-fit max-w-full items-center gap-2 rounded-2xl border-[3px] border-white bg-ink/85 px-4 py-2 font-display font-bold text-white shadow-lift">
              <Swords className="size-5 shrink-0 text-orange" aria-hidden /> Round {round.index + 1}/{total}: {round.narrative}
            </motion.p>
          )}
          {question ? (
            <ChallengePanel
              key={question.instanceId}
              question={question}
              conceptName={conceptName(question.conceptId)}
              theme="boss"
              hintAllowance={state.hintsLeft}
              feedback="full"
              onSubmit={onSubmit}
              onNext={onNext}
              onResult={onResult}
              submitLabel="Cast answer!"
              nextLabel={state.status === 'active' ? 'Next round' : 'See result'}
              header={
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-bold text-[#3730a3]">
                  <Shield className="size-3.5" aria-hidden /> {state.hintsLeft} hint{state.hintsLeft === 1 ? '' : 's'} left
                </span>
              }
            />
          ) : (
            <Spinner label={`${boss.bossName} prepares its next move`} />
          )}
        </>
      )}

      {phase === 'outro' && <Arena boss={boss} hp={0} total={total} avatar={profile.avatar} strike={null} lives={state.lives} defeated />}

      {(phase === 'won' || phase === 'lost') && outcome && (
        <BossResult
          boss={boss}
          evaluation={outcome.evaluation}
          rewards={outcome.rewards}
          won={phase === 'won'}
          stars={bossStars(state.lives, boss.lives, phase === 'won')}
          coins={coins}
          onRetry={async () => {
            const p = await newPlan()
            if (p) setPhase('fight')
          }}
        />
      )}
    </GameScreen>
  )
}

function Arena({ boss, hp, total, avatar, strike, lives, defeated = false }: { boss: BossBlueprint; hp: number; total: number; avatar: AvatarConfig; strike: Strike; lives: number; defeated?: boolean }) {
  const creature = getCharacter(boss.characterId).creature ?? 'golem'
  const [myMood, setMyMood] = useState<Mood>('happy')
  useEffect(() => {
    if (!strike) return
    setMyMood(strike.kind === 'bolt' ? 'excited' : 'sad')
    const t = setTimeout(() => setMyMood(lives <= 1 ? 'surprised' : 'happy'), 1200)
    return () => clearTimeout(t)
  }, [strike, lives])
  return (
    <div className="relative mx-auto mb-4 flex h-48 max-w-3xl items-end justify-between px-2 sm:h-64">
      {/* Explorer and Pip */}
      <motion.div key={strike?.kind === 'attack' ? strike.key : 'me'} animate={strike?.kind === 'attack' ? { x: [0, -14, 10, -6, 0] } : {}} transition={{ delay: 0.35, duration: 0.4 }} className="relative h-40 w-28 sm:h-56 sm:w-40">
        <div className="pip-float absolute -top-6 -right-6 size-14 sm:size-16">
          <Pip mood={strike?.kind === 'attack' ? 'sad' : 'cheer'} className="size-full" />
        </div>
        <AvatarFigure config={avatar} mood={myMood} className="size-full drop-shadow-xl" />
      </motion.div>
      {/* Projectiles */}
      <AnimatePresence>
        {strike && (
          <motion.div
            key={strike.key}
            className="pointer-events-none absolute top-1/3 z-10"
            initial={{ left: strike.kind === 'bolt' ? '18%' : '72%', opacity: 1, scale: 0.6 }}
            animate={{ left: strike.kind === 'bolt' ? '72%' : '18%', scale: [0.6, 1.3, 1] }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.4, ease: 'easeIn' }}
            onAnimationComplete={() => undefined}
            aria-hidden
          >
            {strike.kind === 'bolt' ? (
              <svg viewBox="0 0 60 60" className="size-14">
                <circle cx="30" cy="30" r="22" fill="#fde047" opacity="0.5" />
                <path d="M34 6 L18 34 L30 34 L24 54 L44 24 L32 24 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 60 60" className="size-14">
                <circle cx="30" cy="30" r="18" fill="#7c3aed" />
                <circle cx="30" cy="30" r="10" fill="#c4b5fd" />
              </svg>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Boss */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-36 rounded-full border-[3px] border-white bg-ink/80 p-1 sm:w-52" role="img" aria-label={`${boss.bossName} strength: ${hp} of ${total}`}>
          <div className="flex gap-0.5">
            {Array.from({ length: total }, (_, i) => (
              <motion.span key={i} className="h-3 flex-1 rounded-full" animate={{ backgroundColor: i < hp ? '#f43f5e' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
        <p className="rounded-full bg-ink/80 px-3 py-0.5 font-display text-sm font-bold text-white">{boss.bossName}</p>
        <motion.div
          key={strike?.kind === 'bolt' ? strike.key : 'boss'}
          animate={defeated ? { opacity: 0.5, rotate: -8, y: 12 } : strike?.kind === 'bolt' ? { x: [0, 16, -12, 6, 0], filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'] } : { y: [0, -6, 0] }}
          transition={strike?.kind === 'bolt' ? { delay: 0.35, duration: 0.45 } : defeated ? { duration: 0.8 } : { duration: 2.4, repeat: Infinity }}
          className="relative size-32 sm:size-48"
        >
          <CreatureFigure art={creature} hurt={defeated || hp <= total / 2} className="size-full drop-shadow-2xl" />
          <AnimatePresence>
            {strike?.kind === 'bolt' && (
              <motion.span key={strike.key} className="absolute -top-2 left-1/2 font-display text-3xl font-black text-sun text-outline" initial={{ y: 0, opacity: 0 }} animate={{ y: -40, opacity: [0, 1, 0] }} transition={{ delay: 0.4, duration: 1 }}>
                −1
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

function BossResult({ boss, evaluation, rewards, won, stars, coins, onRetry }: { boss: BossBlueprint; evaluation: BossEvaluation; rewards: RewardRecord[]; won: boolean; stars: number; coins: number; onRetry: () => void }) {
  const chapter = getChapter(boss.chapterId)!
  const navigate = useNavigate()
  const practice = evaluation.failedConcepts
  const practiceHref = `/practice/${boss.chapterId}?${practice.map((c) => `concept=${encodeURIComponent(c)}`).join('&')}`
  return (
    <div className="mt-14">
      <OutcomeCard
        kind={won ? 'victory' : 'defeat'}
        title={won ? 'Challenge passed!' : 'Not this time'}
        subtitle={`${evaluation.correct} of ${evaluation.total} correct.`}
        stars={won ? stars : undefined}
        coins={coins}
        pipLine={won ? `${boss.bossName} is beaten! The ${getRegion(chapter.regionId)?.name} is safer thanks to you.` : 'Everything you answered is saved. A little training, then a new battle!'}
        actions={
          won ? (
            <>
              <button type="button" className="btn-game orange" onClick={() => navigate(`/region/${chapter.regionId}`)}>
                <MapIcon className="size-5" aria-hidden /> Back to the map
              </button>
              {boss.tier === 'chapter' && (
                <button type="button" className="btn-game violet" onClick={() => navigate(`/assessment/${chapter.id}/followup`)}>
                  Take the follow-up check
                </button>
              )}
            </>
          ) : (
            <>
              {practice.length > 0 && (
                <button type="button" className="btn-game violet" onClick={() => navigate(practiceHref)}>
                  <Dumbbell className="size-5" aria-hidden /> Train: {practice.map(conceptName).join(', ')}
                </button>
              )}
              <button type="button" className="btn-game orange" onClick={onRetry}>
                <RotateCcw className="size-5" aria-hidden /> Try a new battle
              </button>
            </>
          )
        }
      >
        <ul className="flex flex-wrap justify-center gap-2">
          {Object.entries(evaluation.perConcept).map(([c, v]) => (
            <li key={c}>
              <Pill tone={v.correct === v.total ? 'leaf' : v.correct > 0 ? 'brand' : 'coral'}>
                {conceptName(c)} {v.correct}/{v.total}
              </Pill>
            </li>
          ))}
        </ul>
        {!won && evaluation.reasons.length > 0 && (
          <ul className="mt-3 space-y-1 text-center text-sm text-ink-soft">
            {evaluation.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        {rewards.map((r) => (
          <p key={r.kind + r.refId} className="mx-auto mt-2 w-fit rounded-xl bg-sun-soft px-3 py-2 text-sm font-bold">
            🏅 {r.title}
          </p>
        ))}
      </OutcomeCard>
    </div>
  )
}
