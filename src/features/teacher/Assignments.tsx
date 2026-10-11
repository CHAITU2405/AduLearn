import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, BarChart3, CheckCircle2, ClipboardList, Copy, Eye, EyeOff, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button, Card, cn, ConfirmDialog, EmptyState, Notice, Pill, Spinner } from '@/components/ui'
import {
  bestAttempt,
  blankAssignment,
  blankQuestion,
  endOfDay,
  isOverdue,
  newId,
  sampleAssignment,
  SUBJECT_LABELS,
  tidyAssignment,
  validateAssignment,
  type Assignment,
  type AssignmentQuestion,
  type AssignmentSubject,
} from '@/core/assignments'
import { assignmentRepo, profileRepo } from '@/data/repositories'

const fmtDate = (ms?: number) => (ms ? new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'No due date')

export function Assignments() {
  const list = useLiveQuery(() => assignmentRepo.list(), [])
  const attempts = useLiveQuery(() => assignmentRepo.allAttempts(), [])
  const [editing, setEditing] = useState<Assignment | null>(null)
  const [results, setResults] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Assignment | null>(null)
  if (!list || !attempts) return <Spinner />
  if (editing) return <Editor initial={editing} onClose={() => setEditing(null)} />
  if (results) {
    const a = list.find((x) => x.id === results)
    if (a) return <Results assignment={a} onBack={() => setResults(null)} />
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setEditing(blankAssignment())}>
          <Plus className="size-4" aria-hidden /> New assignment
        </Button>
        <Button variant="secondary" onClick={() => setEditing(sampleAssignment())}>
          <Sparkles className="size-4" aria-hidden /> Start from a sample quiz
        </Button>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-10" />} title="No assignments yet">
          Create a test or quiz, then publish it. Students on this device see published assignments on their Assignments page.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((a) => {
            const mine = attempts.filter((x) => x.assignmentId === a.id)
            const students = new Set(mine.map((x) => x.profileId)).size
            return (
              <Card as="li" key={a.id} className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={a.status === 'published' ? 'leaf' : 'muted'}>{a.status === 'published' ? 'Published' : 'Draft'}</Pill>
                  <Pill tone="violet">{SUBJECT_LABELS[a.subject]}</Pill>
                  {isOverdue(a) && <Pill tone="coral">Past due</Pill>}
                </div>
                <h3 className="font-display text-xl font-bold">{a.title || 'Untitled assignment'}</h3>
                <p className="text-sm text-ink-soft">
                  {a.questions.length} question{a.questions.length === 1 ? '' : 's'} ·{' '}
                  {a.maxAttempts === null ? 'unlimited attempts' : `${a.maxAttempts} attempt${a.maxAttempts === 1 ? '' : 's'}`} · due {fmtDate(a.dueAt)}
                </p>
                <p className="text-sm text-ink-muted">
                  {students} student{students === 1 ? '' : 's'} attempted · {mine.length} submission{mine.length === 1 ? '' : 's'}
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(a)}>
                    <Pencil className="size-4" aria-hidden /> Edit
                  </Button>
                  {a.status === 'published' ? (
                    <Button size="sm" variant="secondary" onClick={() => void assignmentRepo.setStatus(a.id, 'draft')}>
                      <EyeOff className="size-4" aria-hidden /> Unpublish
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => void assignmentRepo.setStatus(a.id, 'published')} disabled={validateAssignment(a).length > 0} title={validateAssignment(a)[0]}>
                      <Eye className="size-4" aria-hidden /> Publish
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setResults(a.id)}>
                    <BarChart3 className="size-4" aria-hidden /> Results
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing({ ...a, id: newId('asg'), title: `${a.title} (copy)`, status: 'draft', createdAt: Date.now(), updatedAt: Date.now() })}
                  >
                    <Copy className="size-4" aria-hidden /> Duplicate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(a)}>
                    <Trash2 className="size-4" aria-hidden /> Delete
                  </Button>
                </div>
              </Card>
            )
          })}
        </ul>
      )}
      <ConfirmDialog
        open={!!deleting}
        title="Delete this assignment?"
        danger
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await assignmentRepo.remove(deleting.id)
          setDeleting(null)
        }}
      >
        “{deleting?.title || 'Untitled'}” and every student’s attempts at it will be removed from this device. This cannot be undone.
      </ConfirmDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

const field = 'min-h-11 w-full rounded-xl border-2 border-line bg-white px-3 outline-none focus:border-brand'

function Editor({ initial, onClose }: { initial: Assignment; onClose: () => void }) {
  const [a, setA] = useState<Assignment>(initial)
  const [showProblems, setShowProblems] = useState(false)
  const [saving, setSaving] = useState(false)
  const problems = validateAssignment(tidyAssignment(a))
  const setQ = (i: number, q: AssignmentQuestion) => setA({ ...a, questions: a.questions.map((x, j) => (j === i ? q : x)) })
  const move = (i: number, d: -1 | 1) => {
    const qs = [...a.questions]
    ;[qs[i], qs[i + d]] = [qs[i + d], qs[i]]
    setA({ ...a, questions: qs })
  }
  async function save(status: Assignment['status']) {
    if (status === 'published' && problems.length) return setShowProblems(true)
    setSaving(true)
    await assignmentRepo.save({ ...tidyAssignment(a), status })
    setSaving(false)
    onClose()
  }
  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-2xl font-bold">{initial.title ? 'Edit assignment' : 'New assignment'}</h2>
        <label className="flex flex-col gap-1 font-bold">
          Title
          <input className={field} value={a.title} maxLength={120} onChange={(e) => setA({ ...a, title: e.target.value })} placeholder="e.g. Chapter 2 quiz" />
        </label>
        <label className="flex flex-col gap-1 font-bold">
          Instructions for students
          <textarea
            className={cn(field, 'min-h-20 py-2 font-normal')}
            value={a.instructions}
            maxLength={600}
            onChange={(e) => setA({ ...a, instructions: e.target.value })}
            placeholder="What should students know before they start?"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 font-bold">
            Subject
            <select className={field} value={a.subject} onChange={(e) => setA({ ...a, subject: e.target.value as AssignmentSubject })}>
              {Object.entries(SUBJECT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-bold">
            Attempts allowed
            <select
              className={field}
              value={a.maxAttempts ?? 'unlimited'}
              onChange={(e) => setA({ ...a, maxAttempts: e.target.value === 'unlimited' ? null : Number(e.target.value) })}
            >
              {[1, 2, 3, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="unlimited">Unlimited</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 font-bold">
            Due date (optional)
            <input
              type="date"
              className={field}
              value={a.dueAt ? new Date(a.dueAt).toLocaleDateString('en-CA') : ''}
              onChange={(e) => setA({ ...a, dueAt: e.target.value ? endOfDay(new Date(`${e.target.value}T12:00:00`).getTime()) : undefined })}
            />
          </label>
        </div>
        <label className="inline-flex items-center gap-2 font-semibold">
          <input type="checkbox" className="size-5" checked={a.showAnswers} onChange={(e) => setA({ ...a, showAnswers: e.target.checked })} />
          Show students the correct answers and explanations after they submit
        </label>
      </Card>

      <ol className="flex flex-col gap-4">
        {a.questions.map((q, i) => (
          <Card as="li" key={q.id} className="p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-ink font-bold text-white">{i + 1}</span>
              <select
                aria-label={`Question ${i + 1} type`}
                className="min-h-10 rounded-xl border-2 border-line bg-white px-2 font-bold"
                value={q.kind}
                onChange={(e) => setQ(i, { ...blankQuestion(e.target.value as AssignmentQuestion['kind']), id: q.id, prompt: q.prompt, explanation: q.explanation })}
              >
                <option value="mcq">Multiple choice</option>
                <option value="short">Short answer</option>
                <option value="number">Number</option>
              </select>
              <span className="ml-auto flex gap-1">
                <Button size="sm" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp className="size-4" aria-hidden />
                </Button>
                <Button size="sm" variant="ghost" aria-label="Move down" disabled={i === a.questions.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown className="size-4" aria-hidden />
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Delete question ${i + 1}`} onClick={() => setA({ ...a, questions: a.questions.filter((_, j) => j !== i) })}>
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </span>
            </div>
            <QuestionEditor q={q} n={i + 1} onChange={(nq) => setQ(i, nq)} />
          </Card>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        {(['mcq', 'short', 'number'] as const).map((k) => (
          <Button key={k} variant="secondary" onClick={() => setA({ ...a, questions: [...a.questions, blankQuestion(k)] })}>
            <Plus className="size-4" aria-hidden /> {k === 'mcq' ? 'Multiple choice' : k === 'short' ? 'Short answer' : 'Number'} question
          </Button>
        ))}
      </div>

      {showProblems && problems.length > 0 && (
        <Notice tone="error" title="Fix these before publishing">
          <ul className="list-disc pl-5">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Notice>
      )}
      {initial.status === 'published' && <Notice tone="info">Students’ earlier attempts keep the score they got. New attempts use the edited questions.</Notice>}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap justify-end gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="secondary" disabled={saving} onClick={() => void save('draft')}>
          Save as draft
        </Button>
        <Button disabled={saving} onClick={() => void save('published')}>
          <CheckCircle2 className="size-4" aria-hidden /> Save and publish
        </Button>
      </div>
    </div>
  )
}

function QuestionEditor({ q, n, onChange }: { q: AssignmentQuestion; n: number; onChange: (q: AssignmentQuestion) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 font-bold">
        Question
        <textarea
          className={cn(field, 'min-h-16 py-2 font-normal')}
          value={q.prompt}
          onChange={(e) => onChange({ ...q, prompt: e.target.value })}
          placeholder="Write the question"
        />
      </label>
      {q.kind === 'mcq' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-bold">Options (tick the correct one)</legend>
          {q.options.map((o, oi) => (
            <div key={o.id} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${q.id}`}
                aria-label={`Option ${oi + 1} is correct`}
                className="size-5"
                checked={q.correctId === o.id}
                onChange={() => onChange({ ...q, correctId: o.id })}
              />
              <input
                className={field}
                value={o.text}
                aria-label={`Question ${n} option ${oi + 1}`}
                onChange={(e) => onChange({ ...q, options: q.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)) })}
                placeholder={`Option ${oi + 1}`}
              />
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Remove option ${oi + 1}`}
                disabled={q.options.length <= 2}
                onClick={() => {
                  const options = q.options.filter((x) => x.id !== o.id)
                  onChange({ ...q, options, correctId: q.correctId === o.id ? options[0].id : q.correctId })
                }}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          ))}
          {q.options.length < 6 && (
            <Button size="sm" variant="ghost" className="self-start" onClick={() => onChange({ ...q, options: [...q.options, { id: newId('o'), text: '' }] })}>
              <Plus className="size-4" aria-hidden /> Add option
            </Button>
          )}
        </fieldset>
      )}
      {q.kind === 'short' && (
        <label className="flex flex-col gap-1 font-bold">
          Accepted answers (separate with commas)
          <input
            className={field}
            value={q.accepted.join(', ')}
            onChange={(e) => onChange({ ...q, accepted: e.target.value.split(',') })}
            placeholder="e.g. chloroplast, chloroplasts"
          />
          <span className="text-xs font-normal text-ink-muted">Capital letters and extra spaces are ignored when checking.</span>
        </label>
      )}
      {q.kind === 'number' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 font-bold">
            Correct answer
            <input
              type="number"
              step="any"
              className={field}
              value={Number.isFinite(q.value) ? q.value : ''}
              onChange={(e) => onChange({ ...q, value: e.target.value === '' ? NaN : Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1 font-bold">
            Allowed error (±)
            <input
              type="number"
              step="any"
              min="0"
              className={field}
              value={q.tolerance ?? ''}
              onChange={(e) => onChange({ ...q, tolerance: e.target.value === '' ? undefined : Math.abs(Number(e.target.value)) })}
              placeholder="0"
            />
          </label>
          <label className="flex flex-col gap-1 font-bold">
            Unit (optional)
            <input className={field} value={q.unit ?? ''} onChange={(e) => onChange({ ...q, unit: e.target.value })} placeholder="e.g. Pa" />
          </label>
        </div>
      )}
      <label className="flex flex-col gap-1 font-bold">
        Explanation shown after submitting (optional)
        <input className={field} value={q.explanation ?? ''} onChange={(e) => onChange({ ...q, explanation: e.target.value })} placeholder="Why is this the answer?" />
      </label>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Results per student
// ---------------------------------------------------------------------------

function Results({ assignment, onBack }: { assignment: Assignment; onBack: () => void }) {
  const data = useLiveQuery(async () => {
    const [attempts, profiles] = await Promise.all([assignmentRepo.allAttempts(), profileRepo.list()])
    return { attempts: attempts.filter((a) => a.assignmentId === assignment.id), profiles }
  }, [assignment.id])
  if (!data) return <Spinner />
  const rows = data.profiles
    .map((p) => {
      const mine = data.attempts.filter((a) => a.profileId === p.id).sort((x, y) => x.submittedAt - y.submittedAt)
      return { p, mine, best: bestAttempt(mine) }
    })
    .sort((a, b) => (b.best?.percent ?? -1) - (a.best?.percent ?? -1))
  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" className="self-start" onClick={onBack}>
        ← Back to assignments
      </Button>
      <Card className="overflow-x-auto p-5">
        <h2 className="text-2xl font-bold">{assignment.title}</h2>
        <p className="text-sm text-ink-muted">Each student’s best score counts. Students who haven’t started are listed too.</p>
        <table className="mt-4 w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th className="py-2 pr-3">Student</th>
              <th className="py-2 pr-3">Best score</th>
              <th className="py-2 pr-3">Attempts</th>
              <th className="py-2 pr-3">All scores</th>
              <th className="py-2">Last submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, mine, best }) => (
              <tr key={p.id} className="border-b border-line/60">
                <td className="py-2 pr-3 font-bold">{p.nickname}</td>
                <td className="py-2 pr-3">{best ? `${best.percent}% (${best.correct}/${best.total})` : <Pill tone="muted">Not started</Pill>}</td>
                <td className="py-2 pr-3">
                  {mine.length}
                  {assignment.maxAttempts !== null && ` of ${assignment.maxAttempts}`}
                </td>
                <td className="py-2 pr-3">{mine.map((m) => `${m.percent}%${m.late ? ' (late)' : ''}`).join(', ') || '—'}</td>
                <td className="py-2">{mine.length ? new Date(mine[mine.length - 1].submittedAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
