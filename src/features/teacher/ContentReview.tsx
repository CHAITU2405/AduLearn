import { useState } from 'react'
import { Eye } from 'lucide-react'
import { Button, Card, Modal, Notice, Pill, Spinner } from '@/components/ui'
import { CHAPTERS, conceptName, effectiveStatus, TEMPLATES } from '@/content'
import { REVIEW_STATUSES, type QuestionTemplate, type ReviewStatus } from '@/core/content/types'
import { buildFromSeed, probeTemplate } from '@/core/engine/generator'
import { randomSeed } from '@/core/engine/rng'
import { useReviewOverrides, useReviewRecords } from '@/data/hooks'
import { reviewRepo } from '@/data/repositories'

const STATUS_LABEL: Record<ReviewStatus, string> = { draft: 'Draft', 'pending-review': 'Pending review', approved: 'Approved', rejected: 'Rejected' }
const STATUS_TONE: Record<ReviewStatus, 'muted' | 'sun' | 'leaf' | 'coral'> = { draft: 'muted', 'pending-review': 'sun', approved: 'leaf', rejected: 'coral' }

export function ContentReview() {
  const overrides = useReviewOverrides()
  const records = useReviewRecords()
  const [preview, setPreview] = useState<QuestionTemplate | null>(null)
  if (!overrides || !records) return <Spinner />
  const counts = REVIEW_STATUSES.map((s) => [s, TEMPLATES.filter((t) => effectiveStatus(t, overrides) === s).length] as const)

  return (
    <div className="flex flex-col gap-6">
      <Notice tone="info" title="How review works">
        Only <strong>approved</strong> question templates are used with students. Changes here are stored on this device. The bundled content is an illustrative sample written for
        the prototype: its curriculum alignment is marked <em>unverified</em> until checked against the official AP SSC Class 8 textbook.
      </Notice>
      <div className="flex flex-wrap gap-2">
        {counts.map(([s, n]) => (
          <Pill key={s} tone={STATUS_TONE[s]}>
            {STATUS_LABEL[s]}: {n}
          </Pill>
        ))}
      </div>
      {CHAPTERS.filter((c) => c.status === 'playable').map((c) => (
        <Card as="section" key={c.id} className="overflow-x-auto p-5">
          <h2 className="text-xl font-bold">{c.title}</h2>
          <table className="mt-3 w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-muted">
                <th className="py-2 pr-3">Template</th>
                <th className="py-2 pr-3">Idea · type · level</th>
                <th className="py-2 pr-3">Curriculum</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {TEMPLATES.filter((t) => t.chapterId === c.id).map((t) => {
                const status = effectiveStatus(t, overrides)
                const overridden = t.id in overrides
                const note = records.find((r) => r.templateId === t.id)
                return (
                  <tr key={t.id} className="border-b border-line/60 align-top">
                    <td className="py-2 pr-3">
                      <p className="font-bold">{t.title}</p>
                      <p className="font-mono text-xs text-ink-muted">{t.id}</p>
                    </td>
                    <td className="py-2 pr-3">
                      {conceptName(t.conceptId)} · {t.type} · {t.difficulty}
                      {t.assessment?.eligible && <span className="block text-xs text-ink-muted">Used in checks{t.assessment.transfer ? ' (transfer)' : ''}</span>}
                    </td>
                    <td className="py-2 pr-3 text-xs">{t.curriculum.alignment === 'verified' ? `Verified: ${t.curriculum.source}` : 'Unverified (illustrative)'}</td>
                    <td className="py-2 pr-3">
                      <Pill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Pill>
                      <span className="mt-1 block text-xs text-ink-muted">
                        {overridden
                          ? `Changed on this device ${note ? new Date(note.updatedAt).toLocaleDateString() : ''}`
                          : `Bundled: ${t.review.reviewedBy ?? STATUS_LABEL[t.review.status]}`}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setPreview(t)} aria-label={`Preview ${t.title}`}>
                          <Eye className="size-4" aria-hidden /> Preview
                        </Button>
                        <label className="sr-only" htmlFor={`st-${t.id}`}>
                          Set status for {t.title}
                        </label>
                        <select
                          id={`st-${t.id}`}
                          value={status}
                          onChange={(e) => void reviewRepo.set(t.id, e.target.value as ReviewStatus)}
                          className="min-h-9 rounded-lg border-2 border-line bg-white px-2 text-sm font-semibold"
                        >
                          {REVIEW_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                        {overridden && (
                          <Button size="sm" variant="ghost" onClick={() => void reviewRepo.clear(t.id)}>
                            Reset
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      ))}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title ?? ''}>
        {preview && <TemplatePreview template={preview} />}
      </Modal>
    </div>
  )
}

function TemplatePreview({ template }: { template: QuestionTemplate }) {
  const [seed, setSeed] = useState(() => randomSeed())
  const check = buildFromSeed(template, seed)
  const probe = probeTemplate(template, 100)
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p>
        <span className="font-bold text-ink">Objective: </span>
        {template.objective}
      </p>
      {check.ok ? (
        <div className="rounded-2xl bg-paper p-3">
          {check.view.context && <p className="italic">{check.view.context}</p>}
          <p className="font-bold text-ink">{check.view.prompt}</p>
          <p className="mt-2">
            <span className="font-bold text-ink">Answer: </span>
            {check.key.answerDisplay}
          </p>
          <p className="mt-1">
            <span className="font-bold text-ink">Explanation: </span>
            {check.key.explanation}
          </p>
          <p className="mt-1">
            <span className="font-bold text-ink">Hints: </span>
            {check.hints.join(' / ')}
          </p>
        </div>
      ) : (
        <p>This seed was rejected by validation ({check.reason}). Try another sample.</p>
      )}
      <p className="text-ink-muted">
        Generator check: {probe.valid}/{probe.samples} samples valid, {probe.distinct} distinct variants
        {probe.failures.length ? `, ${probe.failures.length} validation failures` : ''}.
      </p>
      <Button size="sm" variant="secondary" className="self-start" onClick={() => setSeed(randomSeed())}>
        Another sample
      </Button>
    </div>
  )
}
