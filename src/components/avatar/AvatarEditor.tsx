import { Check, Shuffle } from 'lucide-react'
import { AVATAR_LABELS, AVATAR_OPTIONS, type AvatarConfig } from '@/core/avatar'
import { Button, cn } from '@/components/ui'
import { AvatarFigure } from './AvatarFigure'

const COLOR_NAMES: Record<string, string> = {
  '#f6d3b3': 'Light',
  '#e8b48c': 'Light-medium',
  '#c98d5f': 'Medium',
  '#a0673f': 'Medium-deep',
  '#6e4426': 'Deep',
  '#1f1a17': 'Black',
  '#4a2e1f': 'Dark brown',
  '#8a5a2b': 'Brown',
  '#c7792c': 'Auburn',
  '#3b4a8c': 'Indigo',
  '#0ea5e9': 'Sky blue',
  '#14b8a6': 'Teal',
  '#f97316': 'Orange',
  '#f43f5e': 'Coral',
  '#eab308': 'Yellow',
  '#22c55e': 'Green',
  '#6366f1': 'Violet',
  '#1e3a8a': 'Navy',
}

function Swatches<K extends 'skin' | 'hairColor' | 'outfitColor' | 'backpackColor'>({
  label,
  field,
  value,
  onChange,
}: {
  label: string
  field: K
  value: AvatarConfig
  onChange: (v: AvatarConfig) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {(AVATAR_OPTIONS[field] as readonly string[]).map((color) => {
          const selected = value[field] === color
          return (
            <label key={color} className="cursor-pointer">
              <input
                type="radio"
                className="peer sr-only"
                name={field}
                checked={selected}
                onChange={() => onChange({ ...value, [field]: color })}
                aria-label={`${label}: ${COLOR_NAMES[color] ?? color}`}
              />
              <span
                className={cn(
                  'grid size-10 place-items-center rounded-full border-4 shadow-soft transition-transform peer-focus-visible:ring-4 peer-focus-visible:ring-brand/40',
                  selected ? 'scale-110 border-ink' : 'border-white',
                )}
                style={{ background: color }}
              >
                {selected && <Check className="size-4 text-white drop-shadow" aria-hidden strokeWidth={3} />}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function Chips<K extends 'hairStyle' | 'outfit' | 'backpack' | 'accessory'>({
  label,
  field,
  value,
  onChange,
}: {
  label: string
  field: K
  value: AvatarConfig
  onChange: (v: AvatarConfig) => void
}) {
  const labels = AVATAR_LABELS[field] as Record<string, string>
  return (
    <fieldset>
      <legend className="mb-2 font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {(AVATAR_OPTIONS[field] as readonly string[]).map((opt) => {
          const selected = value[field] === opt
          return (
            <label key={opt} className="cursor-pointer">
              <input type="radio" className="peer sr-only" name={field} checked={selected} onChange={() => onChange({ ...value, [field]: opt })} />
              <span
                className={cn(
                  'inline-flex min-h-11 items-center rounded-full border-2 px-4 font-bold transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-brand/40',
                  selected ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink-soft hover:border-brand',
                )}
              >
                {labels[opt]}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function randomAvatar(): AvatarConfig {
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]
  return {
    skin: pick(AVATAR_OPTIONS.skin),
    hairStyle: pick(AVATAR_OPTIONS.hairStyle),
    hairColor: pick(AVATAR_OPTIONS.hairColor),
    outfit: pick(AVATAR_OPTIONS.outfit),
    outfitColor: pick(AVATAR_OPTIONS.outfitColor),
    backpack: pick(AVATAR_OPTIONS.backpack),
    backpackColor: pick(AVATAR_OPTIONS.backpackColor),
    accessory: pick(AVATAR_OPTIONS.accessory),
  }
}

export function AvatarEditor({ value, onChange, name }: { value: AvatarConfig; onChange: (v: AvatarConfig) => void; name?: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div className="flex flex-col items-center gap-3 md:sticky md:top-24 md:self-start">
        <div className="relative w-full max-w-64 rounded-[2rem] bg-gradient-to-b from-[#dff3ff] to-[#fff4e6] p-4 shadow-soft">
          <svg viewBox="0 0 200 40" className="absolute inset-x-0 bottom-0 w-full" aria-hidden>
            <path d="M0 30 Q50 10 100 24 T200 20 V40 H0 Z" fill="#bbf7d0" />
          </svg>
          <AvatarFigure config={value} className="animate-float relative mx-auto h-64 w-auto" title={`Avatar preview${name ? ` for ${name}` : ''}`} />
        </div>
        <Button variant="secondary" size="sm" onClick={() => onChange(randomAvatar())}>
          <Shuffle className="size-4" aria-hidden /> Surprise me
        </Button>
      </div>
      <div className="flex flex-col gap-5">
        <Swatches label="Skin tone" field="skin" value={value} onChange={onChange} />
        <Chips label="Hair style" field="hairStyle" value={value} onChange={onChange} />
        <Swatches label="Hair colour" field="hairColor" value={value} onChange={onChange} />
        <Chips label="Outfit" field="outfit" value={value} onChange={onChange} />
        <Swatches label="Outfit colour" field="outfitColor" value={value} onChange={onChange} />
        <Chips label="Backpack" field="backpack" value={value} onChange={onChange} />
        {value.backpack !== 'none' && <Swatches label="Backpack colour" field="backpackColor" value={value} onChange={onChange} />}
        <Chips label="Accessory" field="accessory" value={value} onChange={onChange} />
      </div>
    </div>
  )
}
