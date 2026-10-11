import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Award, BookCheck, Medal, Target, Trophy, Users } from 'lucide-react'
import { Card, cn, Notice, Pill, Spinner } from '@/components/ui'
import { SUBJECT_LABELS } from '@/core/assignments'
import { loadDashboard, type DashboardData } from '@/services/dashboard'

const BAR = '#0284c7'

export function Dashboard({ onOpenAssignments }: { onOpenAssignments: () => void }) {
  const [sample, setSample] = useState(true)
  const data = useLiveQuery(() => loadDashboard(sample), [sample])
  if (!data) return <Spinner />
  const { rows } = data
  const withAcc = rows.filter((r) => r.accuracy !== null)
  const avgAcc = withAcc.length ? Math.round(withAcc.reduce((n, r) => n + r.accuracy!, 0) / withAcc.length) : null
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000
  const published = data.assignments.filter((a) => a.assignment.status === 'published')
  const asgScores = rows.filter((r) => r.assignmentAvg !== null)
  const asgAvg = asgScores.length ? Math.round(asgScores.reduce((n, r) => n + r.assignmentAvg!, 0) / asgScores.length) : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 font-semibold">
          <input type="checkbox" className="size-5 accent-[#0284c7]" checked={sample} onChange={(e) => setSample(e.target.checked)} />
          Include sample students
        </label>
        {sample && <Pill tone="orange">Sample students are made up for demonstration</Pill>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat icon={<Users className="size-5" />} label="Students" value={String(rows.length)} note={sample ? `${data.realCount} on this device` : 'on this device'} />
        <Stat icon={<Target className="size-5" />} label="Average accuracy" value={avgAcc === null ? '—' : `${avgAcc}%`} note="in game challenges" />
        <Stat icon={<Award className="size-5" />} label="Missions completed" value={String(rows.reduce((n, r) => n + r.missionsDone, 0))} note="across the class" />
        <Stat icon={<Users className="size-5" />} label="Active this week" value={String(rows.filter((r) => r.lastActive >= weekAgo).length)} note={`of ${rows.length}`} />
        <Stat
          icon={<BookCheck className="size-5" />}
          label="Assignment average"
          value={asgAvg === null ? '—' : `${asgAvg}%`}
          note={`${published.length} published`}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Leaderboard data={data} />
        <div className="flex flex-col gap-6">
          <ActivityChart data={data} />
          <SubjectBars data={data} />
        </div>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Assignment results</h2>
          <button type="button" className="font-bold text-brand-deep underline" onClick={onOpenAssignments}>
            Manage assignments
          </button>
        </div>
        {data.assignments.length === 0 ? (
          <p className="mt-2 text-ink-soft">No assignments yet. Create one in the Assignments tab.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-4">
            {data.assignments.map((s) => (
              <li key={s.assignment.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{s.assignment.title || 'Untitled'}</span>
                  <Pill tone={s.assignment.status === 'published' ? 'leaf' : 'muted'}>{s.assignment.status === 'published' ? 'Published' : 'Draft'}</Pill>
                  <span className="text-sm text-ink-muted">
                    {s.attempted} student{s.attempted === 1 ? '' : 's'} attempted · average best {s.avgBest === null ? '—' : `${s.avgBest}%`}
                  </span>
                </div>
                {s.attempted > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 text-sm font-bold text-ink-soft">Correct by question</p>
                    <HBars items={s.perQuestion.map((q, i) => ({ label: `Q${i + 1}. ${q.prompt}`, value: q.percentCorrect }))} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Notice tone="info">Figures come from explorers who played in this browser{sample ? ', plus the sample students' : ''}. Nothing is sent anywhere.</Notice>
    </div>
  )
}

function Stat({ icon, label, value, note, className }: { icon: React.ReactNode; label: string; value: string; note: string; className?: string }) {
  return (
    <Card className={cn('p-4', className)}>
      <p className="flex items-center gap-2 text-sm font-bold text-ink-muted">
        <span className="text-brand-deep" aria-hidden>
          {icon}
        </span>
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      <p className="text-xs text-ink-muted">{note}</p>
    </Card>
  )
}

function Leaderboard({ data }: { data: DashboardData }) {
  const medal = ['#eab308', '#94a3b8', '#b45309']
  return (
    <Card className="overflow-x-auto p-5">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <Trophy className="size-5 text-[#ca8a04]" aria-hidden /> Leaderboard
      </h2>
      <p className="text-sm text-ink-muted">Ranked by stars, then accuracy.</p>
      {data.rows.length === 0 ? (
        <p className="mt-3 text-ink-soft">No students yet.</p>
      ) : (
        <table className="mt-3 w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Student</th>
              <th className="py-2 pr-2 text-right">Stars</th>
              <th className="py-2 pr-2 text-right">Accuracy</th>
              <th className="py-2 pr-2 text-right">Coins</th>
              <th className="py-2 text-right">Assignments</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={r.id} className={cn('border-b border-line/60', i < 3 && 'font-semibold')}>
                <td className="py-2 pr-2">
                  {i < 3 ? <Medal className="size-5" style={{ color: medal[i] }} aria-label={`Rank ${i + 1}`} /> : <span className="pl-1 text-ink-muted">{i + 1}</span>}
                </td>
                <td className="py-2 pr-2">
                  {r.name} {r.sample && <Pill tone="orange">Sample</Pill>}
                </td>
                <td className="py-2 pr-2 text-right">{r.stars}</td>
                <td className="py-2 pr-2 text-right">{r.accuracy === null ? '—' : `${r.accuracy}%`}</td>
                <td className="py-2 pr-2 text-right">{r.coins}</td>
                <td className="py-2 text-right">{r.assignmentAvg === null ? '—' : `${r.assignmentAvg}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

/** Answers per day: single-series columns with value on the cap and a table view. */
function ActivityChart({ data }: { data: DashboardData }) {
  const max = Math.max(1, ...data.activity.map((d) => d.count))
  return (
    <Card className="p-5">
      <h2 className="text-xl font-bold">Answers per day</h2>
      <p className="text-sm text-ink-muted">Last 7 days</p>
      <div className="mt-4 flex h-40 items-end gap-2 border-b border-line" role="img" aria-label={data.activity.map((d) => `${d.day}: ${d.count}`).join(', ')}>
        {data.activity.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 flex-col items-center justify-end" title={`${d.day}: ${d.count} answers`}>
            <span className="mb-1 text-xs font-bold text-ink-soft">{d.count}</span>
            <div
              className="w-full max-w-6 rounded-t-[4px] transition-opacity group-hover:opacity-80"
              style={{ height: `${(d.count / max) * 80}%`, background: BAR, minHeight: d.count ? 2 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2" aria-hidden>
        {data.activity.map((d) => (
          <span key={d.day} className="flex-1 text-center text-xs text-ink-muted">
            {d.day}
          </span>
        ))}
      </div>
      <DataTable rows={data.activity.map((d) => [d.day, String(d.count)])} head={['Day', 'Answers']} />
    </Card>
  )
}

function SubjectBars({ data }: { data: DashboardData }) {
  return (
    <Card className="p-5">
      <h2 className="text-xl font-bold">Accuracy by subject</h2>
      <p className="mb-3 text-sm text-ink-muted">Percent of game answers correct</p>
      <HBars items={data.subjectAccuracy.map((s) => ({ label: SUBJECT_LABELS[s.subject], value: s.percent, note: `${s.answered} answers` }))} />
    </Card>
  )
}

/** Horizontal percent bars: one hue, value at the tip, hover shows the detail. */
function HBars({ items }: { items: { label: string; value: number | null; note?: string }[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it) => (
        <li
          key={it.label}
          className="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-3 sm:grid-cols-[minmax(0,16rem)_1fr]"
          title={`${it.label}: ${it.value === null ? 'no data' : `${it.value}%`}${it.note ? ` (${it.note})` : ''}`}
        >
          <span className="truncate text-sm font-semibold">{it.label}</span>
          <span className="flex items-center gap-2">
            <span className="h-3 flex-1 overflow-hidden rounded-r-[4px] bg-[#e2e8f0]">
              <span className="block h-full rounded-r-[4px]" style={{ width: `${it.value ?? 0}%`, background: BAR }} />
            </span>
            <span className="w-11 text-right text-sm font-bold">{it.value === null ? '—' : `${it.value}%`}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-semibold text-ink-muted">Show as table</summary>
      <table className="mt-2 w-full text-left">
        <thead>
          <tr className="border-b border-line text-ink-muted">
            {head.map((h) => (
              <th key={h} className="py-1 pr-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-line/60">
              {r.map((c, i) => (
                <td key={i} className="py-1 pr-3">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
