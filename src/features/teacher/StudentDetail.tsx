import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Printer } from 'lucide-react'
import { Button, Card, EmptyState, Notice, Pill, Spinner } from '@/components/ui'
import { CHAPTERS, conceptName, getBoss, getMission } from '@/content'
import { misconceptionLabel } from '@/content/misconceptions'
import { compareAssessments } from '@/core/learning/assessment'
import { BAND_LABELS, explainMastery, masteryBand, MASTERY_RULES } from '@/core/learning/mastery'
import { buildExport, downloadJson } from '@/data/exportImport'
import { profileRepo } from '@/data/repositories'
import { ComparisonView } from '@/features/assessment/ComparisonView'
import { loadStudent } from '@/services/teacher'

export function StudentDetail({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  const profiles = useLiveQuery(() => profileRepo.list(), [])
  const id = selectedId ?? profiles?.[0]?.id ?? null
  const student = useLiveQuery(async () => {
    if (!id) return null
    const p = await profileRepo.get(id)
    return p ? loadStudent(p) : null
  }, [id])
  if (!profiles) return <Spinner />
  if (profiles.length === 0) return <EmptyState title="No explorers on this device yet" />

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="student" className="block font-bold">
            Explorer
          </label>
          <select id="student" value={id ?? ''} onChange={(e) => onSelect(e.target.value)} className="mt-1 min-h-11 rounded-xl border-2 border-line bg-white px-3 font-semibold">
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nickname}
                {p.demo ? ' (demo data)' : ''}
              </option>
            ))}
          </select>
        </div>
        {student && (
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="size-4" aria-hidden /> Print report
            </Button>
            <Button
              variant="secondary"
              onClick={async () => downloadJson(`adulearn-${student.profile.nickname}-${new Date().toISOString().slice(0, 10)}.json`, await buildExport(student.profile.id))}
            >
              <Download className="size-4" aria-hidden /> Export this explorer’s data
            </Button>
          </>
        )}
      </div>
      {!student ? (
        <Spinner />
      ) : (
        <>
          <header>
            <p className="print-only text-sm">AduLearn — local progress report · printed {new Date().toLocaleString()}</p>
            <h2 className="text-3xl font-bold">
              {student.profile.nickname} {student.profile.demo && <Pill tone="orange">Demo data</Pill>}
            </h2>
            <p className="text-ink-soft">
              {student.attempts.length} answer{student.attempts.length === 1 ? '' : 's'} recorded · first seen {new Date(student.profile.createdAt).toLocaleDateString()} · last
              active {new Date(student.profile.lastActiveAt).toLocaleDateString()}
            </p>
          </header>
          <Notice tone="info" title="What a progress estimate means">
            Each idea has an estimate between 0 and 100% built from this explorer’s answers: correct answers raise it (less when hints were used or a question was repeated),
            incorrect answers lower it. “Secure” requires an estimate of at least {MASTERY_RULES.secure.estimate * 100}%, at least {MASTERY_RULES.secure.minEvidence} answers and{' '}
            {MASTERY_RULES.secure.minIndependentVariants} different questions solved without hints. It is an estimate from a prototype, not a validated measure of ability. Content
            is illustrative and not yet verified against the official textbook.
          </Notice>

          {CHAPTERS.filter((c) => c.status === 'playable').map((c) => {
            const cp = student.chapterProgress[c.id]
            const diag = student.assessments.find((a) => a.chapterId === c.id && a.kind === 'diagnostic') ?? null
            const follow = [...student.assessments].reverse().find((a) => a.chapterId === c.id && a.kind === 'followup') ?? null
            const touched = c.conceptIds.some((id) => student.mastery[id]?.evidence) || cp.done > 0 || diag
            return (
              <Card as="section" key={c.id} className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-xl font-bold">{c.title}</h3>
                  <p className="text-sm text-ink-muted">
                    {cp.done}/{cp.total} stages complete
                  </p>
                </div>
                {!touched ? (
                  <p className="mt-2 text-ink-soft">Not started.</p>
                ) : (
                  <>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[36rem] text-left text-sm">
                        <thead>
                          <tr className="border-b border-line text-ink-muted">
                            <th className="py-2 pr-3">Idea</th>
                            <th className="py-2 pr-3">Estimate</th>
                            <th className="py-2 pr-3">Band</th>
                            <th className="py-2 pr-3">Evidence</th>
                            <th className="py-2">Recognised errors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.conceptIds.map((cid) => {
                            const m = student.mastery[cid]
                            return (
                              <tr key={cid} className="border-b border-line/60 align-top">
                                <td className="py-2 pr-3 font-semibold">{conceptName(cid)}</td>
                                <td className="py-2 pr-3">{m ? `${Math.round(m.estimate * 100)}%` : '—'}</td>
                                <td className="py-2 pr-3">{BAND_LABELS[masteryBand(m)]}</td>
                                <td className="py-2 pr-3 text-ink-soft">{explainMastery(m)}</td>
                                <td className="py-2 text-ink-soft">
                                  {m && Object.keys(m.misconceptions).length
                                    ? Object.entries(m.misconceptions)
                                        .map(([k, n]) => `${misconceptionLabel(k)} (${n}×${m.correctedMisconceptions.includes(k) ? ', since corrected' : ''})`)
                                        .join('; ')
                                    : '—'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    {(diag || follow) && (
                      <div className="mt-4">
                        <ComparisonView comparison={compareAssessments(diag, follow, c.conceptIds)} />
                      </div>
                    )}
                  </>
                )}
              </Card>
            )
          })}

          <Card as="section" className="p-5">
            <h3 className="text-xl font-bold">Missions and challenges</h3>
            {student.missions.length + student.bosses.length === 0 ? (
              <p className="mt-2 text-ink-soft">None yet.</p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {student.missions.map((m) => (
                  <li key={m.missionId} className="rounded-2xl bg-paper p-3 text-sm">
                    <p className="font-bold">{getMission(m.missionId)?.title ?? m.missionId}</p>
                    <p className="text-ink-soft">
                      {m.status === 'completed' ? `Completed${m.completedAt ? ` ${new Date(m.completedAt).toLocaleDateString()}` : ''}` : 'In progress'} · {m.attempts} attempt
                      {m.attempts === 1 ? '' : 's'}
                    </p>
                  </li>
                ))}
                {student.bosses.map((b) => (
                  <li key={b.id} className="rounded-2xl bg-paper p-3 text-sm">
                    <p className="font-bold">{getBoss(b.bossId)?.title ?? b.bossId}</p>
                    <p className="text-ink-soft">
                      {b.passed ? 'Passed' : 'Not passed'} · {b.results.filter((r) => r.correct).length}/{b.results.length} correct · {new Date(b.at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card as="section" className="print-break p-5">
            <h3 className="text-xl font-bold">Recent answers</h3>
            {student.attempts.length === 0 ? (
              <p className="mt-2 text-ink-soft">No answers yet.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-ink-muted">
                      <th className="py-2 pr-3">When</th>
                      <th className="py-2 pr-3">Idea</th>
                      <th className="py-2 pr-3">Activity</th>
                      <th className="py-2 pr-3">Level</th>
                      <th className="py-2 pr-3">Result</th>
                      <th className="py-2 pr-3">Hints</th>
                      <th className="py-2">Error pattern / why chosen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.attempts.slice(0, 40).map((a) => (
                      <tr key={a.id} className="border-b border-line/60 align-top">
                        <td className="py-1.5 pr-3 whitespace-nowrap">{new Date(a.at).toLocaleString()}</td>
                        <td className="py-1.5 pr-3">{conceptName(a.conceptId)}</td>
                        <td className="py-1.5 pr-3">{a.context}</td>
                        <td className="py-1.5 pr-3">{a.difficulty}</td>
                        <td className="py-1.5 pr-3">{a.correct ? 'Correct' : a.score > 0 ? `Partly (${Math.round(a.score * 100)}%)` : 'Incorrect'}</td>
                        <td className="py-1.5 pr-3">{a.hintsUsed}</td>
                        <td className="py-1.5 text-ink-soft">{a.misconceptionId ? misconceptionLabel(a.misconceptionId) : (a.selectionReason ?? '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
