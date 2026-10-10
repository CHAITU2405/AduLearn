import { useLiveQuery } from 'dexie-react-hooks'
import { Users } from 'lucide-react'
import { Button, Card, EmptyState, Notice, Pill, Spinner } from '@/components/ui'
import { CHAPTERS, conceptName } from '@/content'
import { MISCONCEPTIONS, misconceptionLabel } from '@/content/misconceptions'
import { loadClass } from '@/services/teacher'

export function Overview({ onOpenStudent }: { onOpenStudent: (id: string) => void }) {
  const students = useLiveQuery(loadClass, [])
  if (!students) return <Spinner />
  if (students.length === 0) {
    return (
      <EmptyState icon={<Users className="size-10" />} title="No explorers on this device yet">
        When students create an explorer and play in this browser, their records appear here. No sample students are shown unless demo data is created explicitly.
      </EmptyState>
    )
  }
  const playable = CHAPTERS.filter((c) => c.status === 'playable')
  const reteachByConcept: Record<string, string[]> = {}
  const errorTotals: Record<string, { count: number; students: Set<string> }> = {}
  for (const s of students) {
    for (const r of s.reteach) (reteachByConcept[r.conceptId] ??= []).push(s.profile.nickname)
    for (const [m, n] of Object.entries(s.misconceptionCounts)) {
      const e = (errorTotals[m] ??= { count: 0, students: new Set() })
      e.count += n
      e.students.add(s.profile.id)
    }
  }
  const errors = Object.entries(errorTotals).sort((a, b) => b[1].count - a[1].count)

  return (
    <div className="flex flex-col gap-6">
      {students.some((s) => s.profile.demo) && (
        <Notice tone="warn">Some explorers below are labelled demo data. They were generated for demonstration and are not real students.</Notice>
      )}
      <Card className="overflow-x-auto p-5">
        <h2 className="text-xl font-bold">Explorers on this device</h2>
        <table className="mt-3 w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th className="py-2 pr-3">Explorer</th>
              <th className="py-2 pr-3">Last active</th>
              {playable.map((c) => (
                <th key={c.id} className="py-2 pr-3">
                  {c.title}
                </th>
              ))}
              <th className="py-2 pr-3">Answers</th>
              <th className="py-2 pr-3">May need reteaching</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.profile.id} className="border-b border-line/60 align-top">
                <td className="py-2 pr-3 font-bold">
                  {s.profile.nickname} {s.profile.demo && <Pill tone="orange">Demo</Pill>}
                </td>
                <td className="py-2 pr-3">{new Date(s.profile.lastActiveAt).toLocaleDateString()}</td>
                {playable.map((c) => (
                  <td key={c.id} className="py-2 pr-3">
                    {s.chapterProgress[c.id].done}/{s.chapterProgress[c.id].total} stages
                  </td>
                ))}
                <td className="py-2 pr-3">{s.attempts.length}</td>
                <td className="py-2 pr-3">{s.reteach.length ? s.reteach.map((r) => conceptName(r.conceptId)).join(', ') : '—'}</td>
                <td className="py-2">
                  <Button size="sm" variant="secondary" onClick={() => onOpenStudent(s.profile.id)}>
                    Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-xl font-bold">Concepts that may need reteaching</h2>
          <p className="mt-1 text-sm text-ink-muted">Flagged when an explorer has a repeated, uncorrected misconception or a low estimate after several attempts.</p>
          {Object.keys(reteachByConcept).length === 0 ? (
            <p className="mt-3 text-ink-soft">Nothing flagged yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {Object.entries(reteachByConcept).map(([c, names]) => (
                <li key={c} className="rounded-2xl bg-coral-soft p-3">
                  <p className="font-bold">{conceptName(c)}</p>
                  <p className="text-sm text-ink-soft">
                    {names.length} explorer{names.length > 1 ? 's' : ''}: {names.join(', ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-bold">Repeated error categories</h2>
          <p className="mt-1 text-sm text-ink-muted">Wrong answers that matched a known misconception pattern.</p>
          {errors.length === 0 ? (
            <p className="mt-3 text-ink-soft">No recognised error patterns recorded yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {errors.slice(0, 8).map(([m, e]) => (
                <li key={m} className="rounded-2xl bg-paper p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{misconceptionLabel(m)}</p>
                    <Pill tone="coral">
                      {e.count}× · {e.students.size} explorer{e.students.size > 1 ? 's' : ''}
                    </Pill>
                  </div>
                  {MISCONCEPTIONS[m] && <p className="mt-1 text-sm text-ink-soft">Suggestion: {MISCONCEPTIONS[m].reteach}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
