import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LayoutGroup, motion } from 'framer-motion'
import { Delete, Undo2 } from 'lucide-react'
import { cn } from '@/components/ui'
import type { Choice } from '@/core/content/types'
import { play } from '@/lib/sfx'

// ---------------------------------------------------------------------------
// Drag-or-tap chips (pointer drag with a tap fallback for keyboard and touch)
// ---------------------------------------------------------------------------

function useDragChip(id: string, onTap: () => void, onDrop: (target: string) => void, disabled?: boolean) {
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const dragging = useRef(false)
  return {
    ghost,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        if (disabled || e.button !== 0) return
        start.current = { x: e.clientX, y: e.clientY }
        dragging.current = false
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (!start.current) return
        if (!dragging.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8) dragging.current = true
        if (dragging.current) setGhost({ x: e.clientX, y: e.clientY })
      },
      onPointerUp: (e: React.PointerEvent) => {
        if (!start.current) return
        start.current = null
        setGhost(null)
        if (dragging.current) {
          dragging.current = false
          const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-drop]')
          if (el?.dataset.drop) onDrop(el.dataset.drop)
        } else onTap()
      },
      onPointerCancel: () => {
        start.current = null
        dragging.current = false
        setGhost(null)
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (!disabled) onTap()
        }
      },
    },
    id,
  }
}

function Ghost({ pos, children }: { pos: { x: number; y: number } | null; children: ReactNode }) {
  if (!pos) return null
  return (
    <div className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-1/2 rotate-3 opacity-90" style={{ left: pos.x, top: pos.y }}>
      {children}
    </div>
  )
}

const chipClass = (selected: boolean, disabled?: boolean) =>
  cn(
    'inline-flex min-h-12 touch-none items-center justify-center rounded-2xl border-[3px] px-4 py-2 font-display text-lg font-bold shadow-[0_4px_0_rgb(0_0_0/0.18)] transition-transform select-none',
    selected ? 'border-[#4338ca] bg-[#6366f1] text-white -translate-y-1' : 'border-white bg-white text-ink hover:-translate-y-0.5',
    disabled ? 'cursor-default opacity-90' : 'cursor-grab active:cursor-grabbing',
  )

function Gem({ choice, selected, onTap, onDrop, disabled, dataAttr }: { choice: Choice; selected: boolean; onTap: () => void; onDrop: (t: string) => void; disabled?: boolean; dataAttr: Record<string, string> }) {
  const d = useDragChip(choice.id, onTap, onDrop, disabled)
  return (
    <>
      <motion.div layoutId={`gem-${choice.id}`} role="button" tabIndex={disabled ? -1 : 0} aria-pressed={selected} className={chipClass(selected, disabled)} {...d.handlers} {...dataAttr}>
        {choice.text}
      </motion.div>
      <Ghost pos={d.ghost}>
        <span className={chipClass(true)}>{choice.text}</span>
      </Ghost>
    </>
  )
}

// ---------------------------------------------------------------------------
// Multiple choice: answer stones
// ---------------------------------------------------------------------------

export function AnswerStones({ choices, value, onChange, disabled, labelledBy }: { choices: Choice[]; value: string | null; onChange: (id: string) => void; disabled?: boolean; labelledBy?: string }) {
  const two = choices.length === 2
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={cn('grid gap-3', two ? 'grid-cols-2' : 'sm:grid-cols-2')}>
      {choices.map((c, i) => {
        const selected = value === c.id
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            data-choice-id={c.id}
            onClick={() => {
              play('tap')
              onChange(c.id)
            }}
            className={cn(
              'group relative flex min-h-16 items-center gap-3 rounded-2xl border-[3px] px-4 py-3 text-left font-semibold transition-all',
              'shadow-[0_5px_0_rgb(0_0_0/0.15)] active:translate-y-1 active:shadow-none disabled:active:translate-y-0',
              selected ? 'border-[#ea580c] bg-[#ffedd5] -translate-y-1 shadow-[0_8px_0_#ea580c]' : 'border-white bg-white hover:-translate-y-0.5',
              two && 'justify-center text-center font-display text-2xl',
            )}
          >
            <span aria-hidden className={cn('grid size-9 shrink-0 place-items-center rounded-xl font-display text-lg font-bold', selected ? 'bg-[#ea580c] text-white' : 'bg-paper text-ink-muted', two && 'absolute top-2 left-2 size-7 text-sm')}>
              {i + 1}
            </span>
            <span className="text-[17px] leading-snug">{c.text}</span>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Numeric: carved display + on-screen keypad
// ---------------------------------------------------------------------------

export function NumberPad({ value, onChange, unit, disabled, placeholder, onEnter, labelledBy }: { value: string; onChange: (v: string) => void; unit?: string; disabled?: boolean; placeholder?: string; onEnter?: () => void; labelledBy?: string }) {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    if (typeof matchMedia !== 'undefined') setCoarse(matchMedia('(pointer: coarse)').matches)
  }, [])
  const press = (k: string) => {
    if (disabled) return
    play('tap')
    if (k === 'del') onChange(value.slice(0, -1))
    else if (k === '−') onChange(value.startsWith('-') ? value.slice(1) : `-${value}`)
    else if (value.length < 12) onChange(value + k)
  }
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '−', '0', '.']
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-center sm:gap-6">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 rounded-2xl border-4 border-[#78350f] bg-[#1c1917] px-4 py-2 shadow-inner">
          <label className="sr-only" htmlFor={`${labelledBy}-num`}>
            Your answer
          </label>
          <input
            id={`${labelledBy}-num`}
            type="text"
            inputMode={coarse ? 'none' : 'decimal'}
            autoComplete="off"
            aria-describedby={labelledBy}
            value={value}
            disabled={disabled}
            placeholder={placeholder ?? '?'}
            onChange={(e) => onChange(e.target.value.slice(0, 16))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onEnter) {
                e.preventDefault()
                onEnter()
              }
            }}
            className="w-40 bg-transparent text-center font-mono text-4xl font-bold tracking-wider text-[#fde047] outline-none placeholder:text-[#57534e]"
          />
          {unit && <span className="font-display text-xl font-bold text-[#fde68a]">{unit}</span>}
        </div>
        <p className="text-xs text-ink-muted">You can type, or tap the keys. Fractions like 5/2 work too.</p>
      </div>
      <div className="grid grid-cols-3 gap-2" aria-label="Number keypad">
        {keys.map((k) => (
          <button key={k} type="button" disabled={disabled} onClick={() => press(k)} className="btn-game light !min-h-12 !w-14 !px-0 !text-2xl" aria-label={k === '−' ? 'Change sign' : k}>
            {k}
          </button>
        ))}
        <button type="button" disabled={disabled} onClick={() => press('/')} className="btn-game light !min-h-12 !px-0 !text-2xl" aria-label="Fraction slash">
          /
        </button>
        <button type="button" disabled={disabled} onClick={() => press('del')} className="btn-game coral col-span-2 !min-h-12 !px-0" aria-label="Delete">
          <Delete className="size-6" aria-hidden />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Text answers
// ---------------------------------------------------------------------------

export function PlankInput({ value, onChange, disabled, placeholder, wide, onEnter, labelledBy }: { value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string; wide?: boolean; onEnter?: () => void; labelledBy?: string }) {
  return (
    <>
      <label className="sr-only" htmlFor={`${labelledBy}-text`}>
        Your answer
      </label>
      <input
        id={`${labelledBy}-text`}
        type="text"
        autoComplete="off"
        spellCheck={false}
        aria-describedby={labelledBy}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault()
            onEnter()
          }
        }}
        className={cn(
          'min-h-14 rounded-2xl border-4 border-[#a16207] bg-[#fef3c7] px-4 font-display text-2xl font-bold text-[#422006] shadow-[inset_0_3px_0_rgb(0_0_0/0.08)] outline-none placeholder:text-[#d6b26b] focus:border-[#ea580c]',
          wide ? 'w-full' : 'w-56 text-center',
        )}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Matching / labelling: drop gems into sockets
// ---------------------------------------------------------------------------

export function SocketBoard({
  rows,
  options,
  pairs,
  onChange,
  disabled,
  kind,
}: {
  rows: { id: string; label: ReactNode; ariaLabel: string }[]
  options: Choice[]
  pairs: Record<string, string>
  onChange: (p: Record<string, string>) => void
  disabled?: boolean
  kind: 'match' | 'label'
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const used = new Set(Object.values(pairs))
  const place = (gem: string, row: string) => {
    const next: Record<string, string> = {}
    for (const [r, g] of Object.entries(pairs)) if (g !== gem && r !== row) next[r] = g
    next[row] = gem
    play('tap')
    onChange(next)
    setPicked(null)
  }
  const unplace = (row: string) => {
    const next = { ...pairs }
    delete next[row]
    onChange(next)
  }
  const byId = new Map(options.map((o) => [o.id, o]))
  const leftAttr = kind === 'match' ? 'data-match-left' : 'data-label-marker'
  const rightAttr = kind === 'match' ? 'data-match-right' : 'data-label-option'
  return (
    <LayoutGroup>
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2">
          {rows.map((r) => {
            const gem = pairs[r.id] ? byId.get(pairs[r.id]) : null
            return (
              <li key={r.id} className="flex flex-col gap-2 rounded-2xl border-[3px] border-dashed border-[#c7d2fe] bg-white/70 p-2 sm:flex-row sm:items-center">
                <span className="px-2 font-bold sm:w-2/5">{r.label}</span>
                <div
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  aria-label={`${r.ariaLabel}: ${gem ? gem.text : picked ? 'place selected answer here' : 'empty'}`}
                  data-drop={r.id}
                  {...{ [leftAttr]: r.id }}
                  onClick={() => {
                    if (disabled) return
                    if (picked) place(picked, r.id)
                    else if (gem) unplace(r.id)
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                      e.preventDefault()
                      if (picked) place(picked, r.id)
                      else if (gem) unplace(r.id)
                    }
                  }}
                  className={cn(
                    'flex min-h-14 flex-1 items-center justify-center rounded-xl border-[3px] p-1 transition-colors',
                    gem ? 'border-transparent' : picked ? 'border-[#6366f1] bg-[#eef2ff]' : 'border-[#e2e8f0] bg-paper',
                  )}
                >
                  {gem ? (
                    <motion.span layoutId={`gem-${gem.id}`} className={chipClass(false, disabled)}>
                      {gem.text}
                    </motion.span>
                  ) : (
                    <span className="text-sm font-semibold text-ink-muted">{picked ? 'Tap to place here' : 'Drop here'}</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        <div className="flex min-h-14 flex-wrap justify-center gap-2 rounded-2xl bg-[#e0e7ff]/60 p-3" aria-label="Answers to place">
          {options
            .filter((o) => !used.has(o.id))
            .map((o) => (
              <Gem key={o.id} choice={o} selected={picked === o.id} disabled={disabled} onTap={() => setPicked(picked === o.id ? null : o.id)} onDrop={(row) => place(o.id, row)} dataAttr={{ [rightAttr]: o.id }} />
            ))}
          {options.every((o) => used.has(o.id)) && <span className="py-2 text-sm font-semibold text-ink-muted">All placed! Tap a placed answer to take it back.</span>}
        </div>
      </div>
    </LayoutGroup>
  )
}

// ---------------------------------------------------------------------------
// Word order: build the sentence on a scroll
// ---------------------------------------------------------------------------

export function WordBuilder({ tokens, value, onChange, disabled }: { tokens: Choice[]; value: string[]; onChange: (ids: string[]) => void; disabled?: boolean }) {
  const byId = new Map(tokens.map((t) => [t.id, t]))
  const remaining = tokens.filter((t) => !value.includes(t.id))
  return (
    <LayoutGroup>
      <div className="flex flex-col gap-4">
        <div className="relative rounded-2xl border-4 border-[#a16207] bg-[#fef3c7] px-4 py-5" data-drop="scroll" aria-label="Your sentence">
          <span className="absolute top-1/2 -left-3 h-[110%] w-5 -translate-y-1/2 rounded-full bg-[#d97706]" aria-hidden />
          <span className="absolute top-1/2 -right-3 h-[110%] w-5 -translate-y-1/2 rounded-full bg-[#d97706]" aria-hidden />
          {value.length === 0 ? (
            <p className="py-2 text-center font-semibold text-[#a16207]">Tap (or drag) the words below in order…</p>
          ) : (
            <ol className="flex flex-wrap gap-2">
              {value.map((id, i) => (
                <li key={id}>
                  <motion.button
                    layoutId={`gem-${id}`}
                    type="button"
                    disabled={disabled}
                    data-placed-token-id={id}
                    onClick={() => onChange(value.filter((v) => v !== id))}
                    className="min-h-12 rounded-xl border-[3px] border-[#92400e] bg-[#fbbf24] px-3 font-display text-lg font-bold text-[#422006] shadow-[0_3px_0_#92400e]"
                    aria-label={`Word ${i + 1}: ${byId.get(id)?.text}. Tap to remove`}
                  >
                    {byId.get(id)?.text}
                  </motion.button>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Word tiles">
          {remaining.map((t) => (
            <Gem
              key={t.id}
              choice={t}
              selected={false}
              disabled={disabled}
              onTap={() => {
                play('tap')
                onChange([...value, t.id])
              }}
              onDrop={(target) => target === 'scroll' && onChange([...value, t.id])}
              dataAttr={{ 'data-token-id': t.id }}
            />
          ))}
          {value.length > 0 && !disabled && (
            <button type="button" onClick={() => onChange([])} className="inline-flex min-h-12 items-center gap-1 rounded-xl px-3 font-bold text-ink-soft hover:bg-white">
              <Undo2 className="size-4" aria-hidden /> Clear
            </button>
          )}
        </div>
      </div>
    </LayoutGroup>
  )
}
