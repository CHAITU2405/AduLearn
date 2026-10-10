import { ArrowDown, ArrowRight, ArrowUp, Minus } from 'lucide-react'
import { Card, Pill } from '@/components/ui'
import { conceptName } from '@/content'
import type { AssessmentComparison } from '@/core/learning/assessment'

const fmt = (t: { correct: number; total: number } | null) => (t ? `${t.correct}/${t.total}` : '—')

export function ComparisonView({ comparison: c, compact = false }: { comparison: AssessmentComparison; compact?: boolean }) {
  return (
    <Card className="p-5">
      <h2 className="text-xl font-bold">Starting check → follow-up check</h2>
      <p className="mt-1 text-ink-soft">{c.summary}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th className="py-2 pr-3 font-bold">Idea</th>
              <th className="py-2 pr-3 font-bold">Starting</th>
              <th className="py-2 pr-3 font-bold">Follow-up</th>
              <th className="py-2 font-bold">Observed change</th>
            </tr>
          </thead>
          <tbody>
            {c.concepts.map((row) => (
              <tr key={row.conceptId} className="border-b border-line/60">
                <td className="py-2 pr-3 font-semibold">{conceptName(row.conceptId)}</td>
                <td className="py-2 pr-3">{fmt(row.before)}</td>
                <td className="py-2 pr-3">{fmt(row.after)}</td>
                <td className="py-2">
                  {row.change === 'improved' && (
                    <Pill tone="leaf">
                      <ArrowUp className="size-3.5" aria-hidden /> Higher
                    </Pill>
                  )}
                  {row.change === 'same' && (
                    <Pill tone="muted">
                      <Minus className="size-3.5" aria-hidden /> Same
                    </Pill>
                  )}
                  {row.change === 'declined' && (
                    <Pill tone="coral">
                      <ArrowDown className="size-3.5" aria-hidden /> Lower
                    </Pill>
                  )}
                  {row.change === 'incomplete' && (
                    <Pill tone="muted">
                      <ArrowRight className="size-3.5" aria-hidden /> Not compared yet
                    </Pill>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(c.transfer.before !== null || c.transfer.after !== null) && (
        <p className="mt-3 text-sm text-ink-soft">
          New-situation question: starting {c.transfer.before === null ? '—' : c.transfer.before ? 'correct' : 'incorrect'}, follow-up{' '}
          {c.transfer.after === null ? '—' : c.transfer.after ? 'correct' : 'incorrect'}.
        </p>
      )}
      {!compact && (
        <details className="mt-4 rounded-2xl bg-paper p-4 text-sm">
          <summary className="cursor-pointer font-bold">Limitations of this comparison</summary>
          <ul className="mt-2 space-y-1 text-ink-soft">
            {c.limitations.map((l) => (
              <li key={l}>• {l}</li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  )
}
