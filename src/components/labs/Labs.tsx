import { useId, useState } from 'react'
import { FlaskConical, Gauge } from 'lucide-react'
import { Button, Card, cn } from '@/components/ui'

/** Ungraded exploration: change force and area, watch the pressure. */
export function PressureLab({ onDone }: { onDone: () => void }) {
  const [force, setForce] = useState(200)
  const [area, setArea] = useState(1)
  const fId = useId()
  const aId = useId()
  const pressure = force / area
  const sink = Math.min(46, Math.max(2, Math.log10(pressure) * 12 - 10))
  const blockW = 40 + area * 60
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <Gauge className="size-6 text-teal-deep" aria-hidden /> Pressure simulator
      </h2>
      <p className="mt-1 text-ink-soft">This is a safe, ungraded experiment. Change the force and the area and watch how deep the block sinks into soft sand.</p>
      <div className="mt-5 grid gap-6 md:grid-cols-2 md:items-center">
        <svg viewBox="0 0 240 150" className="w-full rounded-2xl bg-[#e0f2fe]" role="img" aria-label={`Block sinking ${Math.round(sink)} units into sand`}>
          <rect x="0" y="90" width="240" height="60" fill="#fde68a" />
          <rect x={120 - blockW / 2} y={90 - 40 + sink} width={blockW} height="40" rx="4" fill="#14b8a6" stroke="#0f766e" strokeWidth="2" />
          <path d={`M120 ${30 + sink - 26} L120 ${30 + sink - 6}`} stroke="#0b1f3a" strokeWidth="3" markerEnd="url(#arrow)" />
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#0b1f3a" />
            </marker>
          </defs>
        </svg>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor={fId} className="flex justify-between font-bold">
              <span>Force</span>
              <span>{force} N</span>
            </label>
            <input id={fId} type="range" min={20} max={600} step={10} value={force} onChange={(e) => setForce(Number(e.target.value))} className="w-full accent-teal" />
          </div>
          <div>
            <label htmlFor={aId} className="flex justify-between font-bold">
              <span>Area</span>
              <span>{area} m²</span>
            </label>
            <input id={aId} type="range" min={0.1} max={2} step={0.1} value={area} onChange={(e) => setArea(Number(e.target.value))} className="w-full accent-teal" />
          </div>
          <p className="rounded-2xl bg-white p-4 text-lg" aria-live="polite">
            Pressure = {force} N ÷ {area} m² = <strong>{Math.round(pressure * 10) / 10} Pa</strong>
          </p>
          <p className="text-sm text-ink-muted">Try this: keep the force the same and make the area smaller. What happens to the pressure?</p>
        </div>
      </div>
      <Button size="lg" className="mt-6" onClick={onDone}>
        Start the mission
      </Button>
    </Card>
  )
}

const SUBSTANCES = [
  { name: 'Lemon juice', kind: 'acid' },
  { name: 'Soap solution', kind: 'base' },
  { name: 'Magnesium oxide in water', kind: 'base' },
  { name: 'Sulphur dioxide in water', kind: 'acid' },
  { name: 'Sugar water', kind: 'neutral' },
  { name: 'Salt water', kind: 'neutral' },
] as const

/** Ungraded, safe litmus simulator. */
export function LitmusLab({ onDone }: { onDone: () => void }) {
  const [picked, setPicked] = useState<(typeof SUBSTANCES)[number] | null>(null)
  const red = picked?.kind === 'base' ? '#3b82f6' : '#ef4444'
  const blue = picked?.kind === 'acid' ? '#ef4444' : '#3b82f6'
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FlaskConical className="size-6 text-teal-deep" aria-hidden /> Litmus simulator
      </h2>
      <p className="mt-1 text-ink-soft">A safe, ungraded simulation. Choose a solution and see what happens to red and blue litmus paper.</p>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Solutions">
          {SUBSTANCES.map((s) => (
            <button
              key={s.name}
              type="button"
              aria-pressed={picked?.name === s.name}
              onClick={() => setPicked(s)}
              className={cn('min-h-11 rounded-full border-2 px-4 font-bold', picked?.name === s.name ? 'border-teal bg-teal text-white' : 'border-line bg-white hover:border-teal')}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="flex items-end justify-center gap-8">
          {[
            { label: 'Red litmus', from: '#ef4444', to: red },
            { label: 'Blue litmus', from: '#3b82f6', to: blue },
          ].map((s) => (
            <figure key={s.label} className="flex flex-col items-center gap-2">
              <div className="h-28 w-8 overflow-hidden rounded-md border border-line" style={{ background: s.from }}>
                <div className="h-1/2 transition-colors duration-700" style={{ background: picked ? s.to : s.from, marginTop: '50%' }} />
              </div>
              <figcaption className="text-sm font-bold">{s.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
      <p className="mt-4 min-h-12 rounded-2xl bg-white p-4" aria-live="polite">
        {!picked
          ? 'Choose a solution to dip the strips.'
          : picked.kind === 'acid'
            ? `${picked.name} is acidic: blue litmus turns red; red litmus stays red.`
            : picked.kind === 'base'
              ? `${picked.name} is basic: red litmus turns blue; blue litmus stays blue.`
              : `${picked.name} is neutral: neither strip changes colour.`}
      </p>
      <Button size="lg" className="mt-6" onClick={onDone}>
        Start the mission
      </Button>
    </Card>
  )
}
