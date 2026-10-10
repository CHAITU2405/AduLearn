/** Marker anchor points for each structure on the plant cell diagram. */
export const PLANT_CELL_ANCHORS: Record<string, { x: number; y: number; lx: number; ly: number }> = {
  'cell-wall': { x: 32, y: 60, lx: 10, ly: 40 },
  'cell-membrane': { x: 44, y: 150, lx: 10, ly: 180 },
  nucleus: { x: 196, y: 82, lx: 290, ly: 40 },
  chloroplast: { x: 92, y: 186, lx: 150, ly: 226 },
  vacuole: { x: 150, y: 128, lx: 290, ly: 128 },
  cytoplasm: { x: 236, y: 186, lx: 290, ly: 214 },
}

/**
 * A simplified, labelled-by-number plant cell. Numbers come from the question,
 * so the same picture yields different labelling tasks.
 */
export function PlantCell({ markers, className }: { markers: { number: number; position: string }[]; className?: string }) {
  return (
    <svg viewBox="0 0 310 240" className={className} role="img" aria-label={`Diagram of a plant cell with ${markers.length} numbered parts`}>
      <rect x="20" y="22" width="250" height="186" rx="26" fill="#bbf7d0" stroke="#15803d" strokeWidth="7" />
      <rect x="30" y="32" width="230" height="166" rx="20" fill="#ecfccb" stroke="#65a30d" strokeWidth="2.5" strokeDasharray="5 3" />
      <rect x="84" y="78" width="132" height="92" rx="40" fill="#dbeafe" stroke="#60a5fa" strokeWidth="2" opacity="0.95" />
      <circle cx="196" cy="82" r="22" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="2.5" />
      <circle cx="200" cy="80" r="7" fill="#7c3aed" opacity="0.6" />
      {[
        [62, 62],
        [78, 186],
        [104, 186],
        [240, 60],
        [60, 120],
        [130, 186],
        [176, 186],
        [56, 168],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="11" ry="6" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" transform={`rotate(${((i * 37) % 60) - 30} ${x} ${y})`} />
      ))}
      {[
        [240, 120],
        [250, 160],
        [44, 92],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#65a30d" opacity="0.6" />
      ))}
      {markers.map((m) => {
        const a = PLANT_CELL_ANCHORS[m.position]
        if (!a) return null
        return (
          <g key={m.number}>
            <line x1={a.x} y1={a.y} x2={a.lx} y2={a.ly} stroke="#0b1f3a" strokeWidth="1.8" />
            <circle cx={a.x} cy={a.y} r="3.5" fill="#0b1f3a" />
            <circle cx={a.lx} cy={a.ly} r="12" fill="#0b1f3a" />
            <text x={a.lx} y={a.ly + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily="Nunito Variable, sans-serif">
              {m.number}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
