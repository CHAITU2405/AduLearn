import { Award, CheckCircle2, XCircle } from 'lucide-react'
import { useRequiredProfile } from '@/app/context'
import { Card, EmptyState, PageHeader, Pill, ProgressBar, Spinner } from '@/components/ui'
import { CHAPTERS, conceptName, getConcept, REGIONS } from '@/content'
import { chapterProgress } from '@/core/game/progression'
import { BAND_LABELS, explainMastery, masteryBand } from '@/core/learning/mastery'
import { compareAssessments } from '@/core/learning/assessment'
import { useAssessments, useAttempts, useMastery, useRewards, useSnapshot } from '@/data/hooks'
import { ComparisonView } from '@/features/assessment/ComparisonView'

export function ProgressPage() {
  const profile = useRequiredProfile()
  const snapshot = useSnapshot(profile.id)
  const mastery = useMastery(profile.id)
  const attempts = useAttempts(profile.id)
  const rewards = useRewards(profile.id)
  const assessments = useAssessments(profile.id)
  if (!snapshot || !mastery || !attempts || !rewards || !assessments) return <Spinner />

  return (
    <div>
      <PageHeader eyebrow="My progress" title={`${profile.nickname}'s learning journey`}>
        Progress estimates are based on your answers. They are a guide, not a grade, and they change as you keep learning.
      </PageHeader>
      {attempts.length === 0 ? (
        <EmptyState title="No answers yet">Play a mission and your progress for each idea will appear here.</EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {REGIONS.map((r) => {
            const chapters = CHAPTERS.filter((c) => c.regionId === r.id && c.status === 'playable')
            return chapters.map((c) => {
              const p = chapterProgress(c, snapshot)
              const diag = assessments.find((a) => a.chapterId === c.id && a.kind === 'diagnostic') ?? null
              const follow = [...assessments].reverse().find((a) => a.chapterId === c.id && a.kind === 'followup') ?? null
              return (
                <Card as="section" key={c.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold" style={{ color: r.theme.ink }}>
                        {r.subjectLabel}
                      </p>
                      <h2 className="text-2xl font-bold">{c.title}</h2>
                    </div>
                    <div className="w-full max-w-xs">
                      <ProgressBar value={p.done} max={p.total} label={`${c.title} progress`} />
                      <p className="mt-1 text-right text-sm text-ink-muted">
                        {p.done}/{p.total} stages
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 grid gap-3 md:grid-cols-2">
                    {c.conceptIds.map((id) => {
                      const m = mastery[id]
                      const band = masteryBand(m)
                      return (
                        <li key={id} className="rounded-2xl bg-paper p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold">{getConcept(id)?.name}</p>
                            <Pill tone={band === 'secure' ? 'leaf' : band === 'developing' ? 'brand' : band === 'exploring' ? 'orange' : 'muted'}>{BAND_LABELS[band]}</Pill>
                          </div>
                          <ProgressBar value={Math.round((m?.estimate ?? 0) * 100)} max={100} label={`${getConcept(id)?.name} estimate`} tone="teal" className="mt-2" />
                          <p className="mt-1 text-xs text-ink-muted">{explainMastery(m)}</p>
                        </li>
                      )
                    })}
                  </ul>
                  {(diag || follow) && (
                    <div className="mt-4">
                      <ComparisonView comparison={compareAssessments(diag, follow, c.conceptIds)} compact />
                    </div>
                  )}
                </Card>
              )
            })
          })}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-xl font-bold">Recent answers</h2>
              <ul className="mt-3 flex flex-col divide-y divide-line">
                {attempts.slice(0, 12).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2">
                    {a.correct ? (
                      <CheckCircle2 className="size-5 shrink-0 text-leaf-deep" aria-label="Correct" />
                    ) : (
                      <XCircle className="size-5 shrink-0 text-coral-deep" aria-label="Incorrect" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{conceptName(a.conceptId)}</span>
                      <span className="text-xs text-ink-muted">
                        {a.context} · level {a.difficulty}
                        {a.hintsUsed > 0 && ` · ${a.hintsUsed} hint${a.hintsUsed > 1 ? 's' : ''}`} · {new Date(a.at).toLocaleString()}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5">
              <h2 className="text-xl font-bold">All milestones</h2>
              {rewards.length === 0 ? (
                <p className="mt-2 text-ink-soft">None yet.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {rewards.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-sun-soft/70 p-3">
                      <Award className="size-5 shrink-0 text-[#ca8a04]" aria-hidden />
                      <span>
                        <span className="block font-bold">{r.title}</span>
                        <span className="text-sm text-ink-soft">{r.description}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
