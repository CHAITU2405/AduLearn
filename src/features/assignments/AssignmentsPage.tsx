import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarClock, ClipboardList, RotateCcw, Trophy } from 'lucide-react'
import { useRequiredProfile } from '@/app/context'
import { Card, EmptyState, LinkButton, PageHeader, Pill, Spinner } from '@/components/ui'
import { attemptsLeft, bestAttempt, isOverdue, SUBJECT_LABELS } from '@/core/assignments'
import { assignmentRepo } from '@/data/repositories'

/** Assignments the teacher has published, with the explorer's own progress on each. */
export function AssignmentsPage() {
  const profile = useRequiredProfile()
  const data = useLiveQuery(async () => {
    const [list, attempts] = await Promise.all([assignmentRepo.published(), assignmentRepo.attemptsByProfile(profile.id)])
    return list.map((a) => {
      const mine = attempts.filter((x) => x.assignmentId === a.id)
      return { a, used: mine.length, best: bestAttempt(mine) }
    })
  }, [profile.id])
  if (!data) return <Spinner />
  const todo = data.filter((d) => d.used === 0).length
  return (
    <div>
      <PageHeader eyebrow="Assignments" title="Tests and quizzes from your teacher">
        {data.length === 0
          ? 'Nothing has been set yet.'
          : todo > 0
            ? `You have ${todo} assignment${todo === 1 ? '' : 's'} to start. Your best score counts.`
            : 'You have started everything. You can re-attempt where attempts are left — your best score counts.'}
      </PageHeader>
      {data.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-10" />} title="No assignments yet">
          When your teacher publishes a test or quiz, it appears here.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.map(({ a, used, best }) => {
            const left = attemptsLeft(a, used)
            const canTry = left === null || left > 0
            const overdue = isOverdue(a)
            return (
              <Card as="li" key={a.id} className="flex flex-col gap-3 p-5" data-assignment={a.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="violet">{SUBJECT_LABELS[a.subject]}</Pill>
                  {used === 0 ? <Pill tone="orange">New</Pill> : <Pill tone="leaf">Attempted</Pill>}
                  {overdue && <Pill tone="coral">Past due</Pill>}
                </div>
                <h2 className="font-display text-2xl font-bold">{a.title}</h2>
                {a.instructions && <p className="line-clamp-2 text-ink-soft">{a.instructions}</p>}
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
                  <li>
                    {a.questions.length} question{a.questions.length === 1 ? '' : 's'}
                  </li>
                  <li>{a.maxAttempts === null ? 'Unlimited attempts' : `${used} of ${a.maxAttempts} attempt${a.maxAttempts === 1 ? '' : 's'} used`}</li>
                  {a.dueAt && (
                    <li className="inline-flex items-center gap-1">
                      <CalendarClock className="size-4" aria-hidden /> Due {new Date(a.dueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </li>
                  )}
                </ul>
                {best && (
                  <p className="inline-flex items-center gap-2 font-bold">
                    <Trophy className="size-5 text-[#ca8a04]" aria-hidden /> Best score: {best.percent}% ({best.correct}/{best.total})
                  </p>
                )}
                <div className="mt-auto flex flex-wrap gap-2">
                  {canTry ? (
                    <LinkButton to={`/assignments/${a.id}`}>
                      {used === 0 ? (
                        'Start'
                      ) : (
                        <>
                          <RotateCcw className="size-4" aria-hidden /> Re-attempt
                        </>
                      )}
                    </LinkButton>
                  ) : (
                    <Pill tone="muted">No attempts left</Pill>
                  )}
                  {used > 0 && (
                    <LinkButton to={`/assignments/${a.id}?view=result`} variant="secondary">
                      See my result
                    </LinkButton>
                  )}
                </div>
              </Card>
            )
          })}
        </ul>
      )}
    </div>
  )
}
