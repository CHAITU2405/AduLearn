import { useCallback, useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useRequiredProfile } from '@/app/context'
import { ChallengePanel } from '@/components/game/challenge/ChallengePanel'
import { themeForSubject } from '@/components/game/Stage'
import { Button, Card, EmptyState, LinkButton, PageHeader, Pill, Spinner } from '@/components/ui'
import { conceptName } from '@/content'
import type { QuestionResponse } from '@/core/content/types'
import type { GeneratedQuestion } from '@/core/engine/generator'
import { regenerateForReview, reviewCandidates, submitAnswer, type ReviewItem } from '@/services/learning'

/**
 * Review mode: intentionally revisit questions seen before (the exact same
 * variant, regenerated from its stored seed). Missed ones come first.
 * Repeated variants count for less in the progress estimate.
 */
export function ReviewPage() {
  const profile = useRequiredProfile()
  const [items, setItems] = useState<ReviewItem[] | null>(null)
  const [active, setActive] = useState<{ item: ReviewItem; question: GeneratedQuestion } | null>(null)

  const refresh = useCallback(() => {
    void reviewCandidates(profile.id).then(setItems)
  }, [profile.id])
  useEffect(refresh, [refresh])

  const open = async (item: ReviewItem) => {
    const q = await regenerateForReview(profile.id, item)
    if (q) setActive({ item, question: q })
  }

  const onSubmit = useCallback(
    (response: QuestionResponse, hintsUsed: number) => submitAnswer({ profileId: profile.id, question: active!.question, response, hintsUsed, context: 'review', refId: 'review' }),
    [profile.id, active],
  )

  if (!items) return <Spinner />
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Review" title="Revisit earlier questions">
        Try questions you have seen before. Ones you missed come first. Review answers still count, but less than solving a brand-new question.
      </PageHeader>
      {active ? (
        <div className="flex flex-col gap-4">
          <ChallengePanel
            key={active.question.instanceId}
            question={active.question}
            conceptName={conceptName(active.question.conceptId)}
            theme={themeForSubject(active.question.subject)}
            hintAllowance="unlimited"
            feedback="full"
            onSubmit={onSubmit}
            onNext={() => {
              setActive(null)
              refresh()
            }}
            nextLabel="Back to review list"
          />
          <Button variant="ghost" className="self-start" onClick={() => setActive(null)}>
            Back to the list
          </Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<RotateCcw className="size-10" />} title="Nothing to review yet" action={<LinkButton to="/world">Go to the map</LinkButton>}>
          Questions you answer in missions and challenges will appear here.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((it) => (
            <Card as="li" key={it.attemptId} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-bold">{conceptName(it.conceptId)}</p>
                <p className="text-sm text-ink-muted">
                  {it.correct ? <Pill tone="leaf">Answered correctly</Pill> : <Pill tone="coral">Missed last time</Pill>}{' '}
                  <span className="ml-1">{new Date(it.at).toLocaleDateString()}</span>
                </p>
              </div>
              <Button size="sm" variant={it.correct ? 'secondary' : 'primary'} onClick={() => void open(it)}>
                Try again
              </Button>
            </Card>
          ))}
        </ul>
      )}
    </div>
  )
}
