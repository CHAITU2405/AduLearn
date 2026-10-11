/**
 * Hands-on science labs. The student experiments (drag tools onto samples,
 * burn and dissolve, push objects, load weights…) and gives the answer through
 * the experiment itself: dropping a sample on a shelf, choosing a base plate,
 * or filling in the lab notebook once the experiment is done. Every drag has a
 * tap/keyboard alternative (buttons marked data-lab-action).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Cable, Check, Droplets, Flame, Hammer, Lightbulb, Minus, NotebookPen, Plus, Ruler, Sparkles, Weight } from 'lucide-react'
import { cn } from '@/components/ui'
import type { Choice, LabEffect, LabTestView, LabTool, LabView, McqPartView } from '@/core/content/types'
import { play } from '@/lib/sfx'
import { Ghost, useDragChip } from './inputs'

export type LabAnswerMode = 'bins' | 'notebook' | 'instrument'

/** How the student gives their answer for each kind of lab. */
export function labAnswerMode(lab: LabView): LabAnswerMode {
  if (lab.kind === 'sample-test' || lab.kind === 'force-push') return 'bins'
  if (lab.kind === 'pressure-sand') return 'instrument'
  return 'notebook'
}

/** Submit button wording that fits the experiment. */
export function labSubmitLabel(lab: LabView): string {
  return {
    'sample-test': 'Shelve the sample',
    'force-push': 'Sort the force',
    oxide: 'Dip the litmus',
    'pressure-measure': 'Set the gauge',
    'pressure-sand': 'Lock it in',
    'pressure-demo': 'Note it down',
  }[lab.kind]
}

const LAB_TITLE: Record<LabView['kind'], string> = {
  'sample-test': 'Testing bench',
  oxide: 'Burn & test',
  'force-push': 'Force tester',
  'pressure-measure': 'Measure it',
  'pressure-sand': 'Sand pit',
  'pressure-demo': 'Sand pit',
}

export interface LabProps {
  lab: LabView
  /** The question's mcq view when the answer is given by sorting (bins mode). */
  mcq?: McqPartView
  choiceId?: string | null
  onChoose?: (id: string) => void
  /** Numeric answer (instrument mode). */
  value?: string
  onValue?: (v: string) => void
  unit?: string
  disabled?: boolean
  verdict?: 'correct' | 'incorrect'
  /** Set once the experiment has gathered enough evidence to fill in the notebook. */
  onReady: (ready: boolean) => void
  labelledBy?: string
}

export function LabBench(props: LabProps) {
  const { lab } = props
  return (
    <div className="lab-bench flex flex-col gap-3 rounded-3xl border-[3px] border-[#0f766e]/40 bg-[#f0fdfa] p-3 sm:p-4" data-lab={lab.kind}>
      <p className="flex items-center gap-2 text-sm font-bold tracking-wide text-[#0f766e] uppercase">
        <FlaskIcon /> {LAB_TITLE[lab.kind]}
      </p>
      {lab.kind === 'sample-test' && <SampleTestLab {...props} lab={lab} />}
      {lab.kind === 'oxide' && <OxideLab {...props} lab={lab} />}
      {lab.kind === 'force-push' && <ForcePushLab {...props} lab={lab} />}
      {lab.kind === 'pressure-measure' && <PressureMeasureLab {...props} lab={lab} />}
      {lab.kind === 'pressure-sand' && <PressureSandLab {...props} lab={lab} />}
      {lab.kind === 'pressure-demo' && <PressureDemoLab {...props} lab={lab} />}
    </div>
  )
}

function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3" />
      <path d="M7 15h10" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

/** Lab notebook: the observations recorded so far. */
function Observations({ notes, empty }: { notes: string[]; empty: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#99f6e4] bg-white/80 px-3 py-2" aria-live="polite">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wide text-[#0f766e] uppercase">
        <NotebookPen className="size-3.5" aria-hidden /> Observations
      </p>
      {notes.length === 0 ? (
        <p className="text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="space-y-1 text-[15px] font-semibold">
          {notes.map((n, i) => (
            <motion.li key={n + i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-leaf-deep" aria-hidden /> {n}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** A tool that can be dragged onto a drop target, or tapped to use it on the default target. */
function DragTool({
  id,
  icon,
  label,
  onUse,
  used,
  disabled,
  target,
}: {
  id: string
  icon: ReactNode
  label: string
  onUse: () => void
  used?: boolean
  disabled?: boolean
  target: string
}) {
  const d = useDragChip(id, onUse, (t) => t === target && onUse(), disabled)
  const body = (
    <>
      <span className={cn('grid size-9 place-items-center rounded-xl', used ? 'bg-leaf-soft text-leaf-deep' : 'bg-[#ccfbf1] text-[#0f766e]')}>{icon}</span>
      <span className="text-left leading-tight">{label}</span>
      {used && <Check className="size-4 text-leaf-deep" aria-hidden />}
    </>
  )
  return (
    <>
      <button
        type="button"
        data-lab-action={id}
        disabled={disabled}
        aria-label={`${label}${used ? ' (done)' : ''}`}
        className={cn(
          'inline-flex min-h-12 touch-none items-center gap-2 rounded-2xl border-[3px] bg-white px-2.5 py-1.5 font-display font-bold shadow-[0_3px_0_rgb(0_0_0/0.12)] transition-transform select-none',
          used ? 'border-[#86efac]' : 'border-white hover:-translate-y-0.5',
          disabled ? 'cursor-default opacity-60' : 'cursor-grab active:cursor-grabbing',
        )}
        {...d.handlers}
      >
        {body}
      </button>
      <Ghost pos={d.ghost}>
        <span className="inline-flex items-center gap-2 rounded-2xl border-[3px] border-[#0f766e] bg-white px-2.5 py-1.5 font-display font-bold shadow-lift">{body}</span>
      </Ghost>
    </>
  )
}

/** Shelves for sorting: each mcq choice is a shelf; drag the item onto one, or tap a shelf. */
function ShelfBins({
  mcq,
  value,
  onChange,
  disabled,
  verdict,
  item,
  labelledBy,
}: {
  mcq: McqPartView
  value: string | null | undefined
  onChange: (id: string) => void
  disabled?: boolean
  verdict?: 'correct' | 'incorrect'
  item: ReactNode
  labelledBy?: string
}) {
  const choose = (id: string) => {
    if (disabled) return
    play('tap')
    onChange(id)
  }
  const d = useDragChip(
    'lab-item',
    () => undefined,
    (t) => t.startsWith('bin:') && choose(t.slice(4)),
    disabled,
  )
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold text-ink-soft">Now sort it: drag the card onto the right shelf (or tap a shelf).</p>
      <div className="flex items-start gap-3">
        {!value && (
          <div
            role="presentation"
            className={cn('shrink-0 touch-none rounded-2xl border-[3px] border-[#0f766e] bg-white px-3 py-2 font-display font-bold shadow-lift', disabled ? '' : 'cursor-grab')}
            {...d.handlers}
          >
            {item}
          </div>
        )}
        <Ghost pos={d.ghost}>
          <span className="inline-block rounded-2xl border-[3px] border-[#0f766e] bg-white px-3 py-2 font-display font-bold shadow-lift">{item}</span>
        </Ghost>
        <div role="radiogroup" aria-labelledby={labelledBy} className="grid flex-1 gap-2 sm:grid-cols-2">
          {mcq.choices.map((c: Choice) => {
            const on = value === c.id
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={on}
                data-choice-id={c.id}
                data-drop={`bin:${c.id}`}
                disabled={disabled}
                onClick={() => choose(c.id)}
                className={cn(
                  'relative flex min-h-20 flex-col items-center justify-end rounded-2xl border-[3px] bg-white/80 px-3 pt-2 pb-2 font-display text-lg font-bold transition-colors',
                  on
                    ? verdict === 'correct'
                      ? 'border-leaf-deep bg-[#dcfce7]'
                      : verdict === 'incorrect'
                        ? 'border-coral-deep bg-[#ffe4e6]'
                        : 'border-[#ea580c] bg-[#ffedd5]'
                    : 'border-dashed border-[#5eead4] hover:bg-white',
                )}
              >
                {on && (
                  <motion.span layoutId="lab-shelved" className="mb-1 rounded-xl border-2 border-[#0f766e] bg-white px-2 py-0.5 text-sm">
                    {item}
                  </motion.span>
                )}
                <span className="w-full border-t-4 border-[#a16207] pt-1 text-center">{c.text}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const fmt = (n: number) => (Math.round(n * 1000) / 1000).toLocaleString('en-IN', { maximumFractionDigits: 3 })

// ---------------------------------------------------------------------------
// Chemistry: test a sample with tools
// ---------------------------------------------------------------------------

const TOOL: Record<LabTool, { label: string; icon: ReactNode }> = {
  hammer: { label: 'Hammer', icon: <Hammer className="size-5" aria-hidden /> },
  tester: { label: 'Circuit tester', icon: <Lightbulb className="size-5" aria-hidden /> },
  polish: { label: 'Sandpaper', icon: <Sparkles className="size-5" aria-hidden /> },
  wire: { label: 'Wire puller', icon: <Cable className="size-5" aria-hidden /> },
  strike: { label: 'Striker', icon: <Bell className="size-5" aria-hidden /> },
}

const SAMPLE_COLOUR: Record<string, string> = {
  Fe: '#8b939e',
  Cu: '#c2703d',
  Al: '#cbd5e1',
  Zn: '#a8b3bd',
  Mg: '#e2e8f0',
  Na: '#dbe4ee',
  S: '#facc15',
  C: '#27272a',
  P: '#b91c1c',
  O: '#bae6fd',
}

function SampleTestLab({ lab, mcq, choiceId, onChoose, disabled, verdict, onReady, labelledBy }: LabProps & { lab: Extract<LabView, { kind: 'sample-test' }> }) {
  const [done, setDone] = useState<LabTestView[]>([])
  const [last, setLast] = useState<LabTestView | null>(null)
  useEffect(() => onReady(true), [onReady])
  const effects = new Set<LabEffect>(done.map((t) => t.effect))
  const use = (t: LabTestView) => {
    if (done.some((x) => x.tool === t.tool)) return
    play(t.effect === 'glow' || t.effect === 'ring' || t.effect === 'shine' ? 'correct' : 'tap')
    setDone((d) => [...d, t])
    setLast(t)
  }
  const name = lab.sample.symbol ? `${lab.sample.name} (${lab.sample.symbol})` : lab.sample.name
  const colour = SAMPLE_COLOUR[lab.sample.symbol ?? ''] ?? (lab.sample.form === 'powder' ? '#a3a3a3' : '#94a3b8')
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="self-start rounded-2xl bg-white p-2 shadow-soft" data-drop="sample" aria-label={`The ${name} sample. Drop a tool here to test it.`}>
          <SampleScene form={lab.sample.form} colour={colour} effects={effects} last={last} label={name} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-ink-soft">Drag a tool onto the sample (or tap it) to run a test:</p>
          <div className="flex flex-wrap gap-2">
            {lab.tests.map((t) => (
              <DragTool
                key={t.tool}
                id={t.tool}
                icon={TOOL[t.tool].icon}
                label={TOOL[t.tool].label}
                used={done.some((x) => x.tool === t.tool)}
                disabled={disabled || done.some((x) => x.tool === t.tool)}
                onUse={() => use(t)}
                target="sample"
              />
            ))}
          </div>
          <Observations notes={done.map((t) => `${TOOL[t.tool].label}: ${t.note}`)} empty="No tests yet — try a tool on the sample." />
        </div>
      </div>
      {mcq && onChoose && (
        <ShelfBins
          mcq={mcq}
          value={choiceId}
          onChange={onChoose}
          disabled={disabled}
          verdict={verdict}
          labelledBy={labelledBy}
          item={<span className="inline-flex items-center gap-1.5">🧪 {name}</span>}
        />
      )}
    </div>
  )
}

function SampleScene({ form, colour, effects, last, label }: { form: string; colour: string; effects: Set<LabEffect>; last: LabTestView | null; label: string }) {
  const flat = effects.has('flatten') || effects.has('squash')
  const broken = effects.has('shatter')
  const shiny = effects.has('shine')
  const dull = effects.has('dull')
  const testerOn = last?.tool === 'tester' || effects.has('glow') || effects.has('dark')
  const lit = effects.has('glow')
  return (
    <svg viewBox="0 0 320 170" className="w-full" role="img" aria-label={`${label} on the testing bench`}>
      <defs>
        <linearGradient id="lab-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={shiny ? 0.85 : 0.35} />
          <stop offset="0.45" stopColor={colour} />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect x="0" y="132" width="320" height="38" fill="#c08457" />
      <rect x="0" y="132" width="320" height="6" fill="#a16207" />
      <rect x="95" y="122" width="130" height="12" rx="4" fill="#e7e5e4" stroke="#a8a29e" />
      {/* the sample */}
      <motion.g key={`${flat}-${broken}`} initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ originX: '160px', originY: '120px' }}>
        {form === 'gas' ? (
          <g>
            <rect x="130" y="52" width="60" height="70" rx="10" fill="#e0f2fe" fillOpacity="0.55" stroke="#64748b" strokeWidth="2" />
            <rect x="140" y="44" width="40" height="12" rx="3" fill="#a16207" />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={145 + i * 15} cy={75 + (i % 2) * 18} r="4" fill={colour} opacity="0.7" className="twinkle" />
            ))}
          </g>
        ) : broken ? (
          <g fill={colour} stroke="#00000040">
            {[
              [120, 116, 10],
              [140, 112, 8],
              [158, 117, 11],
              [178, 113, 7],
              [196, 117, 9],
              [150, 104, 6],
              [170, 103, 5],
            ].map(([x, y, r]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
            ))}
          </g>
        ) : flat ? (
          <rect x="95" y="112" width="130" height="10" rx={effects.has('squash') ? 5 : 2} fill="url(#lab-metal)" stroke="#00000040" />
        ) : form === 'powder' ? (
          <path d="M115 122 Q160 62 205 122 Z" fill={colour} stroke="#00000040" />
        ) : (
          <rect x="125" y="78" width="70" height="44" rx={form === 'soft' ? 12 : 5} fill="url(#lab-metal)" stroke="#00000040" />
        )}
        {shiny && !broken && (
          <g stroke="#fff" strokeWidth="3" strokeLinecap="round" className="twinkle">
            <path d={flat ? 'M110 116 L130 116' : 'M135 88 L150 84'} />
            <path d="M205 70 l4 -10 M210 74 l10 -4" />
          </g>
        )}
        {dull && <rect x="110" y="70" width="100" height="54" fill="#78716c" opacity="0.08" />}
        {effects.has('wire') && (
          <motion.path d="M195 100 L300 100" stroke={colour} strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
        )}
        {effects.has('ring') && (
          <g fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" className="twinkle">
            <path d="M212 80 Q222 100 212 120" />
            <path d="M224 72 Q238 100 224 128" />
            <text x="240" y="70" fontSize="16" fontWeight="800" fill="#0ea5e9" stroke="none">
              Clang!
            </text>
          </g>
        )}
      </motion.g>
      {/* circuit tester */}
      {testerOn && (
        <g>
          <rect x="18" y="96" width="40" height="26" rx="4" fill="#334155" />
          <text x="38" y="113" fontSize="10" fill="#fff" textAnchor="middle" fontWeight="700">
            + −
          </text>
          <path d="M58 104 Q80 60 100 60" stroke="#ef4444" strokeWidth="2.5" fill="none" />
          <path d="M120 60 Q135 70 132 100" stroke="#ef4444" strokeWidth="2.5" fill="none" />
          <path d="M58 116 Q120 150 188 110" stroke="#1f2937" strokeWidth="2.5" fill="none" />
          <circle cx="110" cy="56" r="11" fill={lit ? '#fde047' : '#e5e7eb'} stroke="#64748b" strokeWidth="2" />
          {lit && (
            <g stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" className="twinkle">
              <path d="M110 36 L110 28 M94 42 L88 36 M126 42 L132 36 M90 56 L82 56 M130 56 L138 56" />
            </g>
          )}
        </g>
      )}
      {/* last action caption */}
      <AnimatePresence mode="wait">
        {last && (
          <motion.text
            key={last.tool}
            x="160"
            y="24"
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            fill="#0f766e"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {TOOL[last.tool].label} test
          </motion.text>
        )}
      </AnimatePresence>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Chemistry: burn an element, dissolve the oxide, dip litmus
// ---------------------------------------------------------------------------

const LITMUS = { red: '#ef4444', blue: '#3b82f6' }

function OxideLab({ lab, disabled, verdict, onReady }: LabProps & { lab: Extract<LabView, { kind: 'oxide' }> }) {
  const [stage, setStage] = useState<'start' | 'burning' | 'burned' | 'dissolved'>('start')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])
  useEffect(() => onReady(stage === 'dissolved'), [stage, onReady])
  const dipped = !!verdict
  const burn = () => {
    if (stage !== 'start') return
    play('open')
    setStage('burning')
    timer.current = setTimeout(() => setStage('burned'), 1100)
  }
  const dissolve = () => {
    if (stage !== 'burned') return
    play('tap')
    setStage('dissolved')
  }
  const notes = [
    ...(stage === 'burned' || stage === 'dissolved' ? [lab.burnNote] : []),
    ...(stage === 'dissolved' ? [`The ${lab.oxide} dissolves in the water.`] : []),
    ...(dipped ? [`The ${lab.litmus} litmus paper turned ${lab.litmusAfter}${lab.litmus === lab.litmusAfter ? ' (no change)' : ''}.`] : []),
  ]
  const productLabel = lab.product === 'ash' ? `${lab.oxide} (ash)` : `${lab.oxide} (gas)`
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="self-start rounded-2xl bg-white p-2 shadow-soft">
        <svg viewBox="0 0 320 190" className="w-full" role="img" aria-label="Burner, spoon and a beaker of water">
          <rect x="0" y="160" width="320" height="30" fill="#c08457" />
          {/* burner */}
          <g data-drop="burner">
            <rect x="48" y="128" width="44" height="32" rx="6" fill="#475569" />
            <rect x="62" y="96" width="16" height="34" fill="#64748b" />
            <AnimatePresence>
              {stage === 'burning' && (
                <motion.path
                  key="flame"
                  d="M70 96 Q56 76 70 52 Q84 76 70 96 Z"
                  fill={lab.flame}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  initial={{ scaleY: 0.3, opacity: 0 }}
                  animate={{ scaleY: [1, 1.15, 0.95, 1.1], opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ originX: '70px', originY: '96px' }}
                />
              )}
            </AnimatePresence>
          </g>
          {/* spoon */}
          <path d="M70 48 L140 30" stroke="#94a3b8" strokeWidth="3" />
          <ellipse cx="70" cy="50" rx="11" ry="5" fill="#cbd5e1" stroke="#64748b" />
          {stage === 'start' && <circle cx="70" cy="46" r="5" fill="#a8a29e" />}
          {(stage === 'burned' || stage === 'burning') && lab.product === 'ash' && <ellipse cx="70" cy="47" rx="7" ry="3" fill="#f8fafc" stroke="#cbd5e1" />}
          {/* gas jar */}
          {lab.product === 'gas' && (stage === 'burned' || stage === 'burning') && (
            <g>
              <rect x="112" y="60" width="44" height="64" rx="6" fill="#e2e8f0" fillOpacity="0.5" stroke="#64748b" strokeWidth="2" />
              <motion.rect x="114" y="62" width="40" height="60" rx="5" fill="#cbd5e1" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: 1 }} />
            </g>
          )}
          {/* beaker */}
          <g data-drop="beaker">
            <path d="M210 70 L210 152 Q210 160 218 160 L282 160 Q290 160 290 152 L290 70" fill="#f8fafc" fillOpacity="0.6" stroke="#64748b" strokeWidth="2.5" />
            <motion.rect x="212" y="104" width="76" height="54" rx="4" animate={{ fill: stage === 'dissolved' ? '#e0e7ff' : '#bae6fd' }} fillOpacity="0.85" />
            {stage === 'dissolved' && [0, 1, 2, 3].map((i) => <circle key={i} cx={225 + i * 16} cy={118 + (i % 2) * 14} r="2.5" fill="#fff" className="twinkle" />)}
          </g>
          {/* litmus strip */}
          <motion.g animate={{ y: dipped ? 52 : 0 }} transition={{ duration: 0.6 }}>
            <rect x="244" y="30" width="12" height="62" rx="2" fill="#e5e7eb" stroke="#94a3b8" />
            <motion.rect
              x="245"
              y="62"
              width="10"
              height="29"
              animate={{ fill: dipped ? LITMUS[lab.litmusAfter] : LITMUS[lab.litmus] }}
              transition={{ delay: 0.6, duration: 0.8 }}
            />
          </motion.g>
          <text x="250" y="22" textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">
            {lab.litmus} litmus
          </text>
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <ol className="flex flex-col gap-2">
          <li className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">1</span>
            <DragTool
              id="burn"
              icon={<Flame className="size-5" aria-hidden />}
              label={`Burn the ${lab.element}`}
              used={stage !== 'start'}
              disabled={disabled || stage !== 'start'}
              onUse={burn}
              target="burner"
            />
          </li>
          <li className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">2</span>
            <DragTool
              id="dissolve"
              icon={<Droplets className="size-5" aria-hidden />}
              label={`Add the ${productLabel} to water`}
              used={stage === 'dissolved'}
              disabled={disabled || stage !== 'burned'}
              onUse={dissolve}
              target="beaker"
            />
          </li>
          <li className="flex items-center gap-2 text-sm font-bold text-ink-soft">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">3</span>
            {stage === 'dissolved' ? 'Predict in your notebook, then dip the litmus.' : 'Predict, then dip the litmus.'}
          </li>
        </ol>
        <Observations notes={notes} empty="Drag the element onto the burner to start." />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Physics: bring two objects together and see when the force starts
// ---------------------------------------------------------------------------

function ForcePushLab({ lab, mcq, choiceId, onChoose, disabled, verdict, onReady, labelledBy }: LabProps & { lab: Extract<LabView, { kind: 'force-push' }> }) {
  const [x, setX] = useState(0) // 0 = far apart, 1 = touching
  const [fired, setFired] = useState<number | null>(null) // gap (0–1) when the force started
  const firedRef = useRef<number | null>(null)
  const track = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const raf = useRef<number | null>(null)
  const trigger = lab.contact ? 1 : 0.55
  useEffect(() => onReady(true), [onReady])
  useEffect(() => () => void (raf.current && cancelAnimationFrame(raf.current)), [])
  const moveTo = (v: number) => {
    const nx = Math.max(0, Math.min(1, v))
    setX(nx)
    if (firedRef.current === null && nx >= trigger - 1e-6) {
      firedRef.current = 1 - nx
      setFired(1 - nx)
      play('correct')
    }
  }
  const bringTogether = () => {
    if (disabled || fired !== null) return
    const start = performance.now()
    const from = x
    const stop = lab.contact ? 1 : trigger
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 900)
      moveTo(from + (stop - from) * k)
      if (k < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }
  const fromPointer = (clientX: number) => {
    const r = track.current?.getBoundingClientRect()
    if (!r) return
    moveTo((clientX - r.left - 30) / Math.max(1, r.width - 120))
  }
  const gapCm = Math.round((1 - x) * 30)
  return (
    <div className="flex flex-col gap-3">
      <div ref={track} className="relative h-36 touch-none overflow-hidden rounded-2xl bg-white shadow-soft select-none">
        <div className="absolute inset-x-0 bottom-0 h-8 bg-[#c08457]" />
        {/* ruler showing the gap */}
        <div className="absolute inset-x-6 bottom-10 flex items-center justify-center text-xs font-bold text-ink-muted">{x >= 1 ? 'Touching' : `Gap: ${gapCm} cm`}</div>
        <motion.button
          type="button"
          aria-label={`Drag the ${lab.actor.name} towards the ${lab.target.name}`}
          disabled={disabled}
          className="absolute bottom-10 grid size-16 cursor-grab place-items-center rounded-2xl text-5xl active:cursor-grabbing"
          style={{ left: `calc(${x} * (100% - 7.5rem) + 0.5rem)` }}
          onPointerDown={(e) => {
            if (disabled) return
            dragging.current = true
            ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
          }}
          onPointerMove={(e) => dragging.current && fromPointer(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') moveTo(x + 0.1)
            if (e.key === 'ArrowLeft' && fired === null) moveTo(x - 0.1)
          }}
        >
          <span aria-hidden>{lab.actor.icon}</span>
        </motion.button>
        <motion.div
          className="absolute right-2 bottom-10 grid size-16 place-items-center text-5xl"
          animate={fired === null ? { x: 0, rotate: 0 } : lab.contact ? { x: [0, 26, 18], rotate: [0, 8, 0] } : { x: [0, -22, -16], rotate: [0, -6, 0] }}
          transition={{ duration: 0.6 }}
          aria-hidden
        >
          {lab.target.icon}
        </motion.div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" data-lab-action="bring" disabled={disabled || fired !== null} onClick={bringTogether} className="btn-game light !min-h-11 !text-base">
          Bring the {lab.actor.name} towards the {lab.target.name}
        </button>
        {fired !== null && (
          <button
            type="button"
            className="text-sm font-bold text-ink-soft underline"
            onClick={() => {
              firedRef.current = null
              setFired(null)
              setX(0)
            }}
            disabled={disabled}
          >
            Try again
          </button>
        )}
      </div>
      <Observations
        notes={fired === null ? [] : [`${lab.reaction} (${fired > 0.01 ? `it started with a ${Math.round(fired * 30)} cm gap` : 'they were touching'})`]}
        empty={`Drag the ${lab.actor.name} slowly towards the ${lab.target.name} and watch when something happens.`}
      />
      {mcq && onChoose && (
        <ShelfBins
          mcq={mcq}
          value={choiceId}
          onChange={onChoose}
          disabled={disabled}
          verdict={verdict}
          labelledBy={labelledBy}
          item={
            <span className="inline-flex items-center gap-1">
              {lab.actor.icon}→{lab.target.icon} force
            </span>
          }
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Physics: measure force and area, then set the gauge
// ---------------------------------------------------------------------------

function PressureMeasureLab({ lab, disabled, verdict, onReady }: LabProps & { lab: Extract<LabView, { kind: 'pressure-measure' }> }) {
  const [force, setForce] = useState(false)
  const [area, setArea] = useState(false)
  useEffect(() => onReady(force && area), [force, area, onReady])
  const p = lab.force / lab.area
  const tiles = Math.max(1, Math.min(8, Math.round(lab.area * 2)))
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="self-start rounded-2xl bg-white p-2 shadow-soft" data-drop="object">
        <svg viewBox="0 0 320 170" className="w-full" role="img" aria-label={`The ${lab.object} on the floor`}>
          <rect x="0" y="140" width="320" height="30" fill="#cbd5e1" />
          <rect x="105" y="70" width="110" height="70" rx="6" fill="#b45309" stroke="#78350f" strokeWidth="2.5" />
          <path d="M105 92 L215 92 M105 118 L215 118" stroke="#78350f" strokeWidth="2" opacity="0.5" />
          <text x="20" y="160" fontSize="11" fontWeight="700" fill="#475569">
            {lab.object}
          </text>
          {area && (
            <g>
              {Array.from({ length: tiles }, (_, i) => (
                <rect key={i} x={105 + (i * 110) / tiles} y="140" width={110 / tiles - 2} height="10" fill="#22c55e" opacity="0.6" />
              ))}
              <text x="160" y="164" textAnchor="middle" fontSize="12" fontWeight="800" fill="#166534">
                Base area = {fmt(lab.area)} m²
              </text>
            </g>
          )}
          {force && (
            <g>
              <path d="M160 18 L160 66" stroke="#0ea5e9" strokeWidth="4" markerEnd="url(#arrow)" />
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" fill="#0ea5e9" />
                </marker>
              </defs>
              <text x="170" y="38" fontSize="13" fontWeight="800" fill="#0369a1">
                Force = {fmt(lab.force)} N
              </text>
            </g>
          )}
          {verdict && (
            <g>
              <circle cx="275" cy="48" r="30" fill="#fff" stroke="#334155" strokeWidth="3" />
              <motion.line
                x1="275"
                y1="48"
                x2="275"
                y2="24"
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ rotate: -120 }}
                animate={{ rotate: 40 }}
                style={{ originX: '275px', originY: '48px' }}
              />
              <text x="275" y="96" textAnchor="middle" fontSize="12" fontWeight="800" fill="#334155">
                {fmt(p)} Pa
              </text>
            </g>
          )}
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-ink-soft">Drag each tool onto the {lab.object} (or tap it):</p>
        <div className="flex flex-wrap gap-2">
          <DragTool
            id="force-meter"
            icon={<Weight className="size-5" aria-hidden />}
            label="Force meter"
            used={force}
            disabled={disabled || force}
            onUse={() => (play('tap'), setForce(true))}
            target="object"
          />
          <DragTool
            id="tape"
            icon={<Ruler className="size-5" aria-hidden />}
            label="Measuring tape"
            used={area}
            disabled={disabled || area}
            onUse={() => (play('tap'), setArea(true))}
            target="object"
          />
        </div>
        <Observations
          notes={[...(force ? [`It pushes down with ${fmt(lab.force)} N.`] : []), ...(area ? [`Its base covers ${fmt(lab.area)} m².`] : [])]}
          empty="Measure the force and the base area."
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Physics: sand pit — choose a base plate or load weights
// ---------------------------------------------------------------------------

function sinkDepth(p: number, limit: number) {
  const r = p / limit
  return r <= 1 ? r * 5 : Math.min(42, 8 + (r - 1) * 26)
}

function PressureSandLab({ lab, value = '', onValue, unit, disabled, verdict, onReady, labelledBy }: LabProps & { lab: Extract<LabView, { kind: 'pressure-sand' }> }) {
  useEffect(() => onReady(true), [onReady])
  const num = Number(value)
  const area = lab.mode === 'area' ? (Number.isFinite(num) && num > 0 ? num : null) : lab.area
  const force = lab.mode === 'force' ? (Number.isFinite(num) && num >= 0 && value !== '' ? num : 0) : lab.force
  const p = area ? force / area : null
  const sinking = p !== null && p > lab.maxPressure + 1e-9
  const depth = p === null ? 0 : sinkDepth(p, lab.maxPressure)
  const set = (v: number) => {
    if (disabled) return
    play('tap')
    onValue?.(String(Math.round(v * 100) / 100))
  }
  const plateW = area ? Math.max(40, Math.min(200, Math.sqrt(area) * 100)) : 120
  const stack = Math.min(10, Math.ceil(force / Math.max(1, lab.maxPressure * (area ?? 1) * 0.2)))
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-white p-2 shadow-soft">
        <svg viewBox="0 0 320 180" className="mx-auto w-full max-w-md" role="img" aria-label={sinking ? 'It is sinking into the sand' : 'It is holding on the sand'}>
          <rect x="0" y="0" width="320" height="120" fill="#e0f2fe" />
          <rect x="0" y="120" width="320" height="60" fill="#e9c46a" />
          <path d="M0 122 Q40 116 80 122 T160 122 T240 122 T320 122" stroke="#d4a373" strokeWidth="3" fill="none" />
          <motion.g animate={{ y: depth }} transition={{ type: 'spring', stiffness: 80, damping: 14 }}>
            {/* base plate */}
            <rect x={160 - plateW / 2} y="112" width={plateW} height="9" rx="2" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
            {lab.mode === 'area' ? (
              <g>
                <rect x="120" y="70" width="80" height="40" rx="8" fill="#f97316" stroke="#9a3412" strokeWidth="2" />
                <rect x="132" y="76" width="26" height="16" rx="3" fill="#bae6fd" />
                <circle cx="135" cy="110" r="7" fill="#1f2937" />
                <circle cx="185" cy="110" r="7" fill="#1f2937" />
                <text x="160" y="64" textAnchor="middle" fontSize="11" fontWeight="800" fill="#9a3412">
                  {fmt(lab.force)} N
                </text>
              </g>
            ) : (
              <g>
                {Array.from({ length: stack }, (_, i) => (
                  <rect key={i} x="135" y={102 - i * 10} width="50" height="9" rx="2" fill="#475569" stroke="#1e293b" />
                ))}
                <text x="160" y={92 - stack * 10} textAnchor="middle" fontSize="11" fontWeight="800" fill="#1e293b">
                  {fmt(force)} N
                </text>
              </g>
            )}
          </motion.g>
          <text x="10" y="18" fontSize="11" fontWeight="800" fill="#334155">
            {lab.mode === 'area' ? 'Soft sand' : 'Mud'} can take {fmt(lab.maxPressure)} Pa
          </text>
          {p !== null && (
            <text x="310" y="18" textAnchor="end" fontSize="12" fontWeight="800" fill={sinking ? '#e11d48' : '#15803d'}>
              {sinking ? 'Sinking!' : 'Holding'}
            </text>
          )}
        </svg>
        <p className="px-2 pb-1 text-center text-sm font-bold text-ink-soft">
          {p === null ? 'Choose a base plate to try.' : `Pressure = ${fmt(force)} N ÷ ${fmt(area!)} m² = ${fmt(p)} Pa`}
        </p>
      </div>
      {lab.mode === 'area' ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-ink-soft">Try a base plate (area in m²):</p>
          <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
            {lab.plates.map((a) => {
              const on = area !== null && Math.abs(area - a) < 1e-9
              return (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={disabled}
                  onClick={() => set(a)}
                  className={cn(
                    'min-h-12 rounded-2xl border-[3px] px-4 font-display text-lg font-bold shadow-[0_3px_0_rgb(0_0_0/0.12)]',
                    on
                      ? verdict === 'correct'
                        ? 'border-leaf-deep bg-[#dcfce7]'
                        : verdict === 'incorrect'
                          ? 'border-coral-deep bg-[#ffe4e6]'
                          : 'border-[#ea580c] bg-[#ffedd5]'
                      : 'border-white bg-white',
                  )}
                >
                  {fmt(a)} m²
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-ink-soft">Load the platform:</p>
          <div className="flex flex-wrap gap-2">
            {[-1000, -100, -10, 10, 100, 1000].map((d) => (
              <button
                key={d}
                type="button"
                disabled={disabled || force + d < 0}
                onClick={() => set(force + d)}
                className="btn-game light !min-h-11 !px-3 !text-base"
                aria-label={`${d > 0 ? 'Add' : 'Remove'} ${Math.abs(d)} newtons`}
              >
                {d > 0 ? <Plus className="size-4" aria-hidden /> : <Minus className="size-4" aria-hidden />}
                {Math.abs(d)} N
              </button>
            ))}
          </div>
        </div>
      )}
      <label className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink-soft">
        Your answer{unit ? ` (${unit})` : ''}:
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          disabled={disabled}
          onChange={(e) => onValue?.(e.target.value.slice(0, 12))}
          className="min-h-11 w-32 rounded-xl border-[3px] border-[#a16207] bg-[#fef3c7] px-3 font-display text-lg font-bold text-[#422006] outline-none focus:border-[#ea580c]"
        />
      </label>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Physics: brick sandbox (explore, then explain in the notebook)
// ---------------------------------------------------------------------------

function PressureDemoLab({ lab, disabled, onReady }: LabProps & { lab: Extract<LabView, { kind: 'pressure-demo' }> }) {
  const [tried, setTried] = useState<string[]>([])
  const [current, setCurrent] = useState<string | null>(null)
  useEffect(() => onReady(tried.length >= 2), [tried, onReady])
  const maxP = Math.max(...lab.faces.map((f) => lab.weight / f.area))
  const face = lab.faces.find((f) => f.name === current)
  const p = face ? lab.weight / face.area : 0
  const depth = face ? (p / maxP) * 38 : 0
  // Brick drawn with its contact face on the sand.
  const dims: Record<string, [number, number]> = { 'Lying flat': [120, 30], 'On its side': [120, 60], 'Standing on end': [36, 120] }
  const [w, h] = face ? (dims[face.name] ?? [80, 40]) : [0, 0]
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="self-start rounded-2xl bg-white p-2 shadow-soft">
        <svg viewBox="0 0 320 190" className="w-full" role="img" aria-label="A brick in the sand pit">
          <rect x="0" y="0" width="320" height="140" fill="#f0f9ff" />
          <rect x="0" y="140" width="320" height="50" fill="#e9c46a" />
          {face && (
            <motion.g key={face.name} initial={{ y: -60 }} animate={{ y: depth }} transition={{ type: 'spring', stiffness: 90, damping: 13 }}>
              <rect x={160 - w / 2} y={140 - h} width={w} height={h} rx="3" fill="#c2410c" stroke="#7c2d12" strokeWidth="2" />
              <path d={`M${160 - w / 2} ${140 - h / 2} H${160 + w / 2}`} stroke="#7c2d12" strokeWidth="1.5" opacity="0.4" />
            </motion.g>
          )}
          <text x="10" y="18" fontSize="11" fontWeight="800" fill="#334155">
            Same brick, same weight: {lab.weight} N
          </text>
          {face && (
            <text x="310" y="18" textAnchor="end" fontSize="11" fontWeight="800" fill="#7c2d12">
              {fmt(face.area)} m² → {fmt(p)} Pa
            </text>
          )}
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-ink-soft">Stand the brick on different faces:</p>
        <div className="flex flex-wrap gap-2">
          {lab.faces.map((f) => (
            <button
              key={f.name}
              type="button"
              data-lab-action={tried.includes(f.name) ? undefined : `face-${f.name}`}
              disabled={disabled}
              onClick={() => {
                play('tap')
                setCurrent(f.name)
                setTried((t) => (t.includes(f.name) ? t : [...t, f.name]))
              }}
              className={cn('btn-game light !min-h-11 !text-base', current === f.name && '!border-[#ea580c]')}
            >
              {f.name}
            </button>
          ))}
        </div>
        <Observations
          notes={tried.map((n) => {
            const f = lab.faces.find((x) => x.name === n)!
            return `${n}: area ${fmt(f.area)} m², pressure ${fmt(lab.weight / f.area)} Pa — ${lab.weight / f.area >= maxP ? 'sinks deepest' : lab.weight / f.area <= lab.weight / Math.max(...lab.faces.map((x) => x.area)) ? 'sinks least' : 'sinks a little'}.`
          })}
          empty="Try at least two faces and compare how deep the brick sinks."
        />
      </div>
    </div>
  )
}
