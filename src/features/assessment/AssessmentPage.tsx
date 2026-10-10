import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, CheckCircle2, ClipboardCheck, TrendingUp, XCircle } from 'lucide-react'
import { useRequiredProfile } from '@/app/context'
import { ChallengePanel } from '@/components/game/challenge/ChallengePanel'
import { themeForSubject } from '@/components/game/Stage'
import { Button, Card, LinkButton, Notice, Pill, ProgressBar, Spinner } from '@/components/ui'
import { chapterNodeStates, conceptName, getChapter } from '@/content'
import type { QuestionResponse } from '@/core/content/types'
import type { GeneratedQuestion } from '@/core/engine/generator'
import type { GradeResult } from '@/core/engine/grader'
import { compareAssessments, type AssessmentItemResult, type AssessmentKind, type PlannedItem } from '@/core/learning/assessment'
import type { RewardRecord } from '@/data/db'
import { useSnapshot } from '@/data/hooks'
import { assessmentRepo } from '@/data/repositories'
import { assessmentQuestion, finishAssessment, planAssessmentForProfile, submitAnswer } from '@/services/learning'
import { ComparisonView } from './ComparisonView'

export function AssessmentPage() {
  const { chapterId = '', kind: rawKind = '' } = useParams()
  const kind: AssessmentKind | null = rawKind === 'diagnostic' || rawKind === 'followup' ? rawKind : null
  const chapter = getChapter(chapterId)
  if (!chapter || !kind || chapter.status !== 'playable') return <Notice tone="error">This check does not exist.</Notice>
  return <AssessmentFlow key={`${chapterId}-${kind}`} chapterId={chapterId} kind={kind} />
}

interface Answered {
  item: PlannedItem
  question: GeneratedQuestion
  grade: GradeResult
}

function AssessmentFlow({ chapterId, kind }: { chapterId: string; kind: AssessmentKind }) {
  const profile = useRequiredProfile()
  const snapshot = useSnapshot(profile.id)
  const chapter = getChapter(chapterId)!
  const [phase, setPhase] = useState<'intro' | 'running' | 'done'>('intro')
  const [plan, setPlan] = useState<{ items: PlannedItem[]; avoid: Set<string> } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null)
  const [answered, setAnswered] = useState<Answered[]>([])
  const [rewards, setRewards] = useState<RewardRecord[]>([])
  const [comparison, setComparison] = useState<ReturnType<typeof compareAssessments> | null>(null)
  const answeredRef = useRef<Answered[]>([])

  const start = useCallback(async () => {
    const res = await planAssessmentForProfile(profile.id, chapterId, kind)
    if (!res.ok) {
      setError(res.errors.join(' '))
      return
    }
    setPlan({ items: res.items, avoid: res.avoidFingerprints })
    answeredRef.current = []
    setAnswered([])
    setIndex(0)
    setPhase('running')
  }, [profile.id, chapterId, kind])

  useEffect(() => {
    if (phase !== 'running' || !plan || question) return
    void assessmentQuestion(profile.id, plan.items[index], plan.avoid).then((q) => {
      if (q) setQuestion(q)
      else setError('A question could not be prepared for this check.')
    })
  }, [phase, plan, index, question, profile.id])

  const onSubmit = useCallback(
    async (response: QuestionResponse) => {
      const q = question!
      const res = await submitAnswer({ profileId: profile.id, question: q, response, hintsUsed: 0, context: kind, refId: `${chapterId}:${kind}` })
      if (res.status === 'graded') answeredRef.current = [...answeredRef.current, { item: plan!.items[index], question: q, grade: res.grade }]
      return res
    },
    [question, profile.id, kind, chapterId, plan, index],
  )

  const onNext = useCallback(async () => {
    setAnswered(answeredRef.current)
    if (!plan) return
    if (answeredRef.current.length >= plan.items.length) {
      const items: AssessmentItemResult[] = answeredRef.current.map((a) => ({
        conceptId: a.item.conceptId,
        templateId: a.question.templateId,
        fingerprint: a.question.fingerprint,
        correct: a.grade.correct,
        transfer: a.item.transfer,
      }))
      setRewards(await finishAssessment(profile.id, chapterId, kind, items))
      const [diag, follow] = await Promise.all([assessmentRepo.first(profile.id, chapterId, 'diagnostic'), assessmentRepo.latest(profile.id, chapterId, 'followup')])
      setComparison(compareAssessments(diag ?? null, follow ?? null, chapter.conceptIds))
      setPhase('done')
    } else {
      setIndex((i) => i + 1)
      setQuestion(null)
    }
  }, [plan, profile.id, chapterId, kind, chapter.conceptIds])

  if (!snapshot) return <Spinner />
  const nodeId = chapter.nodes.find((n) => n.kind === 'assessment' && n.assessment === kind)?.id
  if (nodeId && chapterNodeStates(chapter, snapshot)[nodeId] === 'locked') {
    return (
      <Notice tone="warn" title="This check is not open yet">
        The follow-up check opens after you pass the chapter boss in{' '}
        <Link className="font-bold underline" to={`/chapter/${chapter.id}`}>
          {chapter.title}
        </Link>
        .
      </Notice>
    )
  }
  const Icon = kind === 'diagnostic' ? ClipboardCheck : TrendingUp
  const title = kind === 'diagnostic' ? 'Starting check' : 'Follow-up check'

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <Link to={`/chapter/${chapter.id}`} className="inline-flex items-center gap-1 self-start font-bold text-ink-soft hover:text-brand-deep">
        <ArrowLeft className="size-4" aria-hidden /> {chapter.title}
      </Link>
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <Icon className="size-8 text-brand-deep" aria-hidden /> {title}: {chapter.title}
      </h1>
      {error && <Notice tone="warn">{error}</Notice>}

      {phase === 'intro' && (
        <Card className="p-6">
          <p className="text-lg">
            {kind === 'diagnostic'
              ? 'This short check shows what you already know before the chapter. It is optional and has no hearts.'
              : 'This check uses different questions on the same ideas, so you and your teacher can compare with the starting check.'}
          </p>
          <ul className="mt-3 space-y-1 text-ink-soft">
            <li>• {chapter.assessmentId ? 'About 5–6 questions' : 'A few questions'}, one for each idea plus one in a new situation.</li>
            <li>• No hints and no right/wrong feedback until the end — just do your best.</li>
            <li>• It is not a test score. It helps choose what to practise.</li>
          </ul>
          <Button size="lg" className="mt-6" onClick={() => void start()}>
            Begin
          </Button>
        </Card>
      )}

      {phase === 'running' && plan && (
        <>
          <Card className="p-4">
            <ProgressBar value={answered.length} max={plan.items.length} label="Check progress" tone="violet" />
            <p className="mt-1 text-sm text-ink-muted">
              Question {Math.min(index + 1, plan.items.length)} of {plan.items.length}
              {plan.items[index]?.transfer && ' · applying an idea in a new situation'}
            </p>
          </Card>
          {question ? (
            <ChallengePanel
              key={question.instanceId}
              question={question}
              conceptName={conceptName(question.conceptId)}
              theme={themeForSubject(chapter.subject)}
              hintAllowance="none"
              feedback="none"
              submitLabel="Submit answer"
              onSubmit={onSubmit}
              onNext={() => void onNext()}
            />
          ) : (
            <Spinner label="Preparing the next question" />
          )}
        </>
      )}

      {phase === 'done' && (
        <>
          <Card className="p-6">
            <p className="font-display text-3xl font-bold">Check complete</p>
            <p className="mt-1 text-ink-soft">
              {answered.filter((a) => a.grade.correct).length} of {answered.length} correct. Your answers are saved for you and your teacher.
            </p>
            {rewards.map((r) => (
              <p key={r.refId} className="mt-3 inline-flex rounded-full bg-sun px-3 py-1 font-bold">
                {r.title}
              </p>
            ))}
            <ul className="mt-5 flex flex-col gap-3">
              {answered.map((a, i) => (
                <li key={a.question.instanceId} className="rounded-2xl border border-line p-4">
                  <div className="flex items-start gap-3">
                    {a.grade.correct ? (
                      <CheckCircle2 className="size-6 shrink-0 text-leaf-deep" aria-label="Correct" />
                    ) : (
                      <XCircle className="size-6 shrink-0 text-coral-deep" aria-label="Incorrect" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink-muted">
                        {i + 1}. {conceptName(a.item.conceptId)} {a.item.transfer && <Pill tone="violet">New situation</Pill>}
                      </p>
                      <p className="font-semibold">{a.question.view.prompt}</p>
                      <p className="mt-1 text-sm">
                        <span className="font-bold">Answer: </span>
                        {a.grade.answerDisplay}
                      </p>
                      <p className="text-sm text-ink-soft">{a.grade.explanation}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          {comparison && <ComparisonView comparison={comparison} />}
          <LinkButton to={`/chapter/${chapter.id}`} size="lg" className="self-start">
            Back to chapter
          </LinkButton>
        </>
      )}
    </div>
  )
}
