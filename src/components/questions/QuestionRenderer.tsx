import { useId } from 'react'
import { BookOpen, Undo2 } from 'lucide-react'
import { PlantCell } from '@/components/diagrams/PlantCell'
import { cn } from '@/components/ui'
import type { PartResponse, PartView, QuestionResponse, QuestionView } from '@/core/content/types'

export function emptyResponse(view: QuestionView): QuestionResponse {
  const b = view.body
  switch (b.kind) {
    case 'mcq':
      return { kind: 'mcq', choiceId: null }
    case 'numeric':
      return { kind: 'numeric', value: '' }
    case 'text':
      return { kind: 'text', value: '' }
    case 'match':
      return { kind: 'match', pairs: {} }
    case 'label':
      return { kind: 'label', pairs: {} }
    case 'order':
      return { kind: 'order', tokenIds: [] }
    case 'multi':
      return { kind: 'multi', parts: b.parts.map((p) => emptyPart(p)) }
  }
}

function emptyPart(p: PartView): PartResponse {
  return p.kind === 'mcq' ? { kind: 'mcq', choiceId: null } : { kind: p.kind, value: '' }
}

export function expectedCounts(view: QuestionView) {
  const b = view.body
  return {
    parts: b.kind === 'multi' ? b.parts.length : undefined,
    pairs: b.kind === 'match' ? b.left.length : b.kind === 'label' ? b.markers.length : undefined,
    tokens: b.kind === 'order' ? b.tokens.length : undefined,
  }
}

interface Props {
  view: QuestionView
  response: QuestionResponse
  onChange: (r: QuestionResponse) => void
  disabled?: boolean
  onSubmitShortcut?: () => void
}

export function QuestionRenderer({ view, response, onChange, disabled, onSubmitShortcut }: Props) {
  const promptId = useId()
  const b = view.body
  return (
    <div className="flex flex-col gap-4">
      {view.passage && (
        <section className="rounded-2xl border border-[#c7d2fe] bg-[#f5f7ff] p-4 sm:p-5" aria-label={`Passage: ${view.passage.title}`}>
          <p className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-[#3730a3]">
            <BookOpen className="size-5" aria-hidden /> {view.passage.title}
          </p>
          {view.passage.text.split('\n\n').map((para, i) => (
            <p key={i} className="mb-2 leading-relaxed last:mb-0">
              {para}
            </p>
          ))}
        </section>
      )}
      {view.context && <p className="text-ink-soft italic">{view.context}</p>}
      <p id={promptId} className="font-display text-xl font-bold leading-snug sm:text-2xl">
        {view.prompt}
      </p>
      {b.kind === 'mcq' || b.kind === 'numeric' || b.kind === 'text' ? (
        <PartInput part={b} value={response as PartResponse} onChange={onChange} disabled={disabled} labelledBy={promptId} onEnter={onSubmitShortcut} />
      ) : b.kind === 'multi' && response.kind === 'multi' ? (
        <ol className="flex flex-col gap-4">
          {b.parts.map((p, i) => (
            <li key={i} data-part-index={i} className="rounded-2xl border border-line bg-paper/60 p-4">
              <MultiPart
                index={i}
                part={p}
                value={response.parts[i]}
                disabled={disabled}
                onChange={(v) => onChange({ kind: 'multi', parts: response.parts.map((x, j) => (j === i ? v : x)) })}
              />
            </li>
          ))}
        </ol>
      ) : b.kind === 'match' && response.kind === 'match' ? (
        <PairSelect
          rows={b.left.map((l) => ({ id: l.id, label: l.text }))}
          options={b.right}
          pairs={response.pairs}
          disabled={disabled}
          onChange={(pairs) => onChange({ kind: 'match', pairs })}
        />
      ) : b.kind === 'label' && response.kind === 'label' ? (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div className="rounded-2xl border border-line bg-white p-2">{b.diagram === 'plant-cell' && <PlantCell markers={b.markers} className="w-full" />}</div>
          <PairSelect
            rows={b.markers.map((m) => ({ id: m.id, label: `Part ${m.number}` }))}
            options={b.options}
            pairs={response.pairs}
            disabled={disabled}
            onChange={(pairs) => onChange({ kind: 'label', pairs })}
          />
        </div>
      ) : b.kind === 'order' && response.kind === 'order' ? (
        <OrderBuilder tokens={b.tokens} value={response.tokenIds} disabled={disabled} onChange={(tokenIds) => onChange({ kind: 'order', tokenIds })} />
      ) : null}
    </div>
  )
}

function MultiPart({ index, part, value, onChange, disabled }: { index: number; part: PartView; value: PartResponse; onChange: (v: PartResponse) => void; disabled?: boolean }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-3">
      <p id={id} className="font-bold">
        {part.prompt ?? `Step ${index + 1}`}
      </p>
      <PartInput part={part} value={value} onChange={(v) => onChange(v as PartResponse)} disabled={disabled} labelledBy={id} />
    </div>
  )
}

function PartInput({
  part,
  value,
  onChange,
  disabled,
  labelledBy,
  onEnter,
}: {
  part: PartView
  value: PartResponse
  onChange: (r: QuestionResponse) => void
  disabled?: boolean
  labelledBy: string
  onEnter?: () => void
}) {
  const inputId = useId()
  if (part.kind === 'mcq' && value.kind === 'mcq') {
    return (
      <div role="radiogroup" aria-labelledby={labelledBy} className="grid gap-2 sm:grid-cols-2">
        {part.choices.map((c, i) => {
          const selected = value.choiceId === c.id
          return (
            <label
              key={c.id}
              data-choice-id={c.id}
              className={cn(
                'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 bg-white px-4 py-3 text-left transition-colors',
                selected ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/60',
                disabled && 'cursor-default opacity-80',
              )}
            >
              <input
                type="radio"
                className="peer sr-only"
                name={`${labelledBy}-choice`}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange({ kind: 'mcq', choiceId: c.id })}
              />
              <span
                aria-hidden
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold peer-focus-visible:ring-4 peer-focus-visible:ring-brand/40',
                  selected ? 'border-brand bg-brand text-white' : 'border-line text-ink-muted',
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="font-semibold">{c.text}</span>
            </label>
          )
        })}
      </div>
    )
  }
  if ((part.kind === 'numeric' || part.kind === 'text') && (value.kind === 'numeric' || value.kind === 'text')) {
    const isNumeric = part.kind === 'numeric'
    const wide = part.kind === 'text' && part.mode !== 'fill'
    return (
      <div className="flex items-center gap-3">
        <label htmlFor={inputId} className="sr-only">
          Your answer
        </label>
        <input
          id={inputId}
          type="text"
          inputMode={isNumeric ? 'decimal' : 'text'}
          autoComplete="off"
          autoCapitalize={isNumeric ? 'off' : 'sentences'}
          spellCheck={false}
          aria-describedby={labelledBy}
          disabled={disabled}
          value={value.value}
          placeholder={part.placeholder}
          onChange={(e) => onChange({ kind: part.kind, value: e.target.value } as PartResponse)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onEnter) {
              e.preventDefault()
              onEnter()
            }
          }}
          className={cn(
            'min-h-14 rounded-2xl border-2 border-line bg-white px-4 text-xl font-bold outline-none transition-colors focus:border-brand disabled:bg-paper',
            wide ? 'w-full' : 'w-full max-w-xs',
          )}
        />
        {isNumeric && part.unit && <span className="text-lg font-bold text-ink-soft">{part.unit}</span>}
      </div>
    )
  }
  return null
}

function PairSelect({
  rows,
  options,
  pairs,
  onChange,
  disabled,
}: {
  rows: { id: string; label: string }[]
  options: { id: string; text: string }[]
  pairs: Record<string, string>
  onChange: (p: Record<string, string>) => void
  disabled?: boolean
}) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => {
        const id = `pair-${r.id}`
        return (
          <li key={r.id} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-3 sm:flex-row sm:items-center sm:gap-3">
            <label htmlFor={id} className="font-bold sm:w-2/5">
              {r.label}
            </label>
            <select
              id={id}
              disabled={disabled}
              value={pairs[r.id] ?? ''}
              onChange={(e) => onChange({ ...pairs, [r.id]: e.target.value })}
              className="min-h-11 w-full rounded-xl border-2 border-line bg-white px-3 font-semibold outline-none focus:border-brand sm:flex-1"
            >
              <option value="">Choose…</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.text}
                </option>
              ))}
            </select>
          </li>
        )
      })}
    </ul>
  )
}

function OrderBuilder({ tokens, value, onChange, disabled }: { tokens: { id: string; text: string }[]; value: string[]; onChange: (ids: string[]) => void; disabled?: boolean }) {
  const byId = new Map(tokens.map((t) => [t.id, t]))
  const remaining = tokens.filter((t) => !value.includes(t.id))
  return (
    <div className="flex flex-col gap-3">
      <div className="min-h-16 rounded-2xl border-2 border-dashed border-brand/50 bg-brand-soft/40 p-3" aria-label="Your sentence">
        {value.length === 0 ? (
          <p className="py-2 text-ink-muted">Tap the words below in order.</p>
        ) : (
          <ol className="flex flex-wrap gap-2">
            {value.map((id, i) => (
              <li key={id}>
                <button
                  type="button"
                  data-placed-token-id={id}
                  disabled={disabled}
                  onClick={() => onChange(value.filter((v) => v !== id))}
                  className="min-h-11 rounded-xl bg-brand px-3 font-bold text-white shadow-soft hover:bg-brand-deep"
                  aria-label={`Word ${i + 1}: ${byId.get(id)?.text}. Remove`}
                >
                  {byId.get(id)?.text}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2" aria-label="Available words">
        {remaining.map((t) => (
          <button
            key={t.id}
            type="button"
            data-token-id={t.id}
            disabled={disabled}
            onClick={() => onChange([...value, t.id])}
            className="min-h-11 rounded-xl border-2 border-line bg-white px-3 font-bold hover:border-brand"
          >
            {t.text}
          </button>
        ))}
        {value.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-xl px-3 font-bold text-ink-soft hover:bg-brand-soft"
          >
            <Undo2 className="size-4" aria-hidden /> Clear
          </button>
        )}
      </div>
    </div>
  )
}
