import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { useRequiredProfile } from '@/app/context'
import { AnswerStones, PlankInput } from '@/components/game/challenge/inputs'
import { Button, Card, cn, ConfirmDialog, LinkButton, Notice, Pill, ProgressBar, Spinner } from '@/components/ui'
import { attemptsLeft, gradeAssignment, isOverdue, SUBJECT_LABELS, type Assignment, type AssignmentAttempt } from '@/core/assignments'
import { assignmentRepo } from '@/data/repositories'
import { play } from '@/lib/sfx'

export function AssignmentAttemptPage() {
  const { assignmentId = '' } = useParams()
  const [params] = useSearchParams()
  const profile = useRequiredProfile()
  const data = useLiveQuery(async () => {
    const [a, attempts] = await Promise.all([assignmentRepo.get(assignmentId), assignmentRepo.attemptsFor(assignmentId, profile.id)])
    return { a, attempts }
  }, [assignmentId, profile.id])
  const [justSubmitted, setJustSubmitted] = useState<AssignmentAttempt | null>(null)
  const [retaking, setRetaking] = useState(false)
  if (!data) return <Spinner />
  const { a, attempts } = data
  if (!a || a.status !== 'published')
    return (
      <Notice tone="info" title="This assignment isn’t available">
        Your teacher may have unpublished it.{' '}
        <LinkButton to="/assignments" variant="ghost" size="sm">
          Back to assignments
        </LinkButton>
      </Notice>
    )
  const left = attemptsLeft(a, attempts.length)
  const canTry = left === null || left > 0
  const latest = justSubmitted ?? attempts[attempts.length - 1]
  const showResult = !retaking && latest && (justSubmitted || params.get('view') === 'result' || !canTry)
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <LinkButton to="/assignments" variant="ghost" size="sm" className="self-start">
        <ArrowLeft className="size-4" aria-hidden /> All assignments
      </LinkButton>
      {showResult ? (
        <ResultView
          a={a}
          attempt={latest}
          used={attempts.length}
          canTry={canTry}
          best={Math.max(...attempts.map((x) => x.percent), latest.percent)}
          onRetry={() => {
            setJustSubmitted(null)
            setRetaking(true)
          }}
        />
      ) : (
        <TestForm
          key={attempts.length}
          a={a}
          attemptNumber={attempts.length + 1}
          onSubmitted={(att) => {
            setRetaking(false)
            setJustSubmitted(att)
            window.scrollTo({ top: 0 })
          }}
          profileId={profile.id}
        />
      )}
    </div>
  )
}

function TestForm({ a, attemptNumber, profileId, onSubmitted }: { a: Assignment; attemptNumber: number; profileId: string; onSubmitted: (a: AssignmentAttempt) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const answered = a.questions.filter((q) => (answers[q.id] ?? '').trim()).length
  const set = (id: string, v: string) => setAnswers((x) => ({ ...x, [id]: v }))
  async function submit() {
    setConfirming(false)
    setSaving(true)
    const graded = gradeAssignment(a, answers)
    const att = await assignmentRepo.submit({ assignmentId: a.id, profileId, answers, ...graded, late: isOverdue(a), submittedAt: Date.now() })
    play(graded.percent >= 50 ? 'win' : 'tap')
    setSaving(false)
    onSubmitted(att)
  }
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (answered < a.questions.length) setConfirming(true)
        else void submit()
      }}
    >
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="violet">{SUBJECT_LABELS[a.subject]}</Pill>
          <Pill tone="muted">
            Attempt {attemptNumber}
            {a.maxAttempts !== null && ` of ${a.maxAttempts}`}
          </Pill>
          {isOverdue(a) && <Pill tone="coral">Past due — it will be marked late</Pill>}
        </div>
        <h1 className="mt-2 text-3xl font-bold">{a.title}</h1>
        {a.instructions && <p className="mt-2 whitespace-pre-line text-ink-soft">{a.instructions}</p>}
        <ProgressBar className="mt-4" value={answered} max={a.questions.length} label={`${answered} of ${a.questions.length} answered`} />
      </Card>
      <ol className="flex flex-col gap-4">
        {a.questions.map((q, i) => {
          const pid = `q-${q.id}`
          return (
            <Card as="li" key={q.id} className="p-5" data-question={i}>
              <p id={pid} className="mb-3 flex items-start gap-3 font-display text-xl font-bold">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-base text-white">{i + 1}</span>
                <span className="whitespace-pre-line">{q.prompt}</span>
              </p>
              {q.kind === 'mcq' ? (
                <AnswerStones choices={q.options} value={answers[q.id] ?? null} onChange={(id) => set(q.id, id)} labelledBy={pid} />
              ) : (
                <div className="flex items-center gap-2">
                  <PlankInput
                    value={answers[q.id] ?? ''}
                    onChange={(v) => set(q.id, v)}
                    wide
                    placeholder={q.kind === 'number' ? 'Type a number' : 'Type your answer'}
                    labelledBy={pid}
                  />
                  {q.kind === 'number' && q.unit && <span className="font-display text-xl font-bold">{q.unit}</span>}
                </div>
              )}
            </Card>
          )
        })}
      </ol>
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur">
        <span className="mr-auto text-sm font-semibold text-ink-muted">
          {answered} of {a.questions.length} answered
        </span>
        <Button type="submit" size="lg" variant="warm" disabled={saving}>
          {saving ? 'Submitting…' : 'Submit answers'}
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        danger={false}
        title="Submit with unanswered questions?"
        confirmLabel="Submit anyway"
        onCancel={() => setConfirming(false)}
        onConfirm={() => void submit()}
      >
        {a.questions.length - answered} question{a.questions.length - answered === 1 ? ' is' : 's are'} still empty. Empty answers count as wrong.
      </ConfirmDialog>
    </form>
  )
}

function ResultView({ a, attempt, used, canTry, best, onRetry }: { a: Assignment; attempt: AssignmentAttempt; used: number; canTry: boolean; best: number; onRetry: () => void }) {
  const left = attemptsLeft(a, used)
  return (
    <div className="flex flex-col gap-5" data-result={attempt.percent}>
      <Card className="p-6 text-center">
        <p className="text-sm font-bold tracking-wide text-ink-muted uppercase">{a.title}</p>
        <p className={cn('mt-2 font-display text-6xl font-bold', attempt.percent >= 80 ? 'text-leaf-deep' : attempt.percent >= 50 ? 'text-[#a16207]' : 'text-coral-deep')}>
          {attempt.percent}%
        </p>
        <p className="mt-1 text-lg font-semibold">
          {attempt.correct} of {attempt.total} correct{attempt.late ? ' · submitted late' : ''}
        </p>
        <p className="mt-1 text-ink-soft">
          {attempt.percent === 100
            ? 'Perfect score — brilliant!'
            : attempt.percent >= 80
              ? 'Great work!'
              : attempt.percent >= 50
                ? 'Good effort — check the ones you missed.'
                : 'Keep going — look at the answers and try again.'}{' '}
          Best so far: {best}%.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {canTry ? (
            <Button onClick={onRetry}>
              <RotateCcw className="size-4" aria-hidden /> Re-attempt{left !== null && ` (${left} left)`}
            </Button>
          ) : (
            <Pill tone="muted">No attempts left</Pill>
          )}
          <LinkButton to="/assignments" variant="secondary">
            All assignments
          </LinkButton>
        </div>
      </Card>
      <ol className="flex flex-col gap-3">
        {a.questions.map((q, i) => {
          const r = attempt.results.find((x) => x.questionId === q.id)
          return (
            <Card as="li" key={q.id} className={cn('border-l-8 p-4', r?.correct ? 'border-l-leaf' : 'border-l-coral')}>
              <p className="flex items-start gap-2 font-bold">
                {r?.correct ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-leaf-deep" aria-label="Correct" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-coral-deep" aria-label="Incorrect" />
                )}
                <span>
                  {i + 1}. {q.prompt}
                </span>
              </p>
              <p className="mt-1 pl-7 text-sm">
                <span className="font-semibold">Your answer:</span> {r?.given ?? '(the question changed after you submitted)'}
              </p>
              {a.showAnswers && r && !r.correct && (
                <p className="pl-7 text-sm">
                  <span className="font-semibold">Correct answer:</span> {r.expected}
                </p>
              )}
              {a.showAnswers && q.explanation && <p className="mt-1 pl-7 text-sm text-ink-soft">{q.explanation}</p>}
            </Card>
          )
        })}
      </ol>
    </div>
  )
}
