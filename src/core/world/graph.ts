/**
 * Walkable scene graphs (Mario-world style). Players move between nodes along
 * edges. Pure logic so it can be reused by a future mobile app and tested.
 */
export interface SceneNodePos {
  id: string
  x: number
  y: number
}

export interface SceneGraph {
  nodes: SceneNodePos[]
  /** Undirected edges, optionally with intermediate bend points for nicer paths. */
  edges: { a: string; b: string; via?: { x: number; y: number }[] }[]
}

export type Direction = 'up' | 'down' | 'left' | 'right'

function adjacency(g: SceneGraph): Map<string, string[]> {
  const adj = new Map<string, string[]>()
  for (const n of g.nodes) adj.set(n.id, [])
  for (const e of g.edges) {
    adj.get(e.a)?.push(e.b)
    adj.get(e.b)?.push(e.a)
  }
  return adj
}

/**
 * Shortest path (fewest steps) from one node to another. Blocked nodes can be
 * the destination but cannot be walked *through* — like a closed gate.
 */
export function findPath(g: SceneGraph, from: string, to: string, blocked: ReadonlySet<string> = new Set()): string[] | null {
  if (from === to) return [from]
  const adj = adjacency(g)
  if (!adj.has(from) || !adj.has(to)) return null
  const prev = new Map<string, string>()
  const queue = [from]
  const seen = new Set([from])
  while (queue.length) {
    const cur = queue.shift()!
    if (cur !== from && blocked.has(cur)) continue
    for (const next of adj.get(cur) ?? []) {
      if (seen.has(next)) continue
      seen.add(next)
      prev.set(next, cur)
      if (next === to) {
        const path = [to]
        let p = to
        while (prev.has(p)) {
          p = prev.get(p)!
          path.unshift(p)
        }
        return path
      }
      queue.push(next)
    }
  }
  return null
}

/** Neighbour of `from` that best matches a direction (within ~70°), for keyboard movement. */
export function neighbourInDirection(g: SceneGraph, from: string, dir: Direction): string | null {
  const pos = new Map(g.nodes.map((n) => [n.id, n]))
  const a = pos.get(from)
  if (!a) return null
  const want = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir]
  let best: { id: string; score: number } | null = null
  for (const id of adjacency(g).get(from) ?? []) {
    const b = pos.get(id)!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const cos = (dx * want[0] + dy * want[1]) / len
    if (cos < 0.34) continue
    if (!best || cos > best.score) best = { id, score: cos }
  }
  return best?.id ?? null
}

/** Points to walk through between two adjacent nodes, including bend points. */
export function edgePoints(g: SceneGraph, a: string, b: string): { x: number; y: number }[] {
  const pos = new Map(g.nodes.map((n) => [n.id, n]))
  const e = g.edges.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
  const via = e?.via ?? []
  const ordered = e && e.a === a ? via : [...via].reverse()
  const pa = pos.get(a)!
  const pb = pos.get(b)!
  return [{ x: pa.x, y: pa.y }, ...ordered, { x: pb.x, y: pb.y }]
}

/** Full polyline for a node path. */
export function pathPoints(g: SceneGraph, path: string[]): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < path.length - 1; i++) {
    const seg = edgePoints(g, path[i], path[i + 1])
    pts.push(...(i === 0 ? seg : seg.slice(1)))
  }
  if (path.length === 1) {
    const n = g.nodes.find((x) => x.id === path[0])
    if (n) pts.push({ x: n.x, y: n.y })
  }
  return pts
}

export function polylineLength(pts: { x: number; y: number }[]): number {
  let d = 0
  for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  return d
}

/** SVG path data for drawing an edge as a smooth trail. */
export function edgePathData(g: SceneGraph, a: string, b: string): string {
  const pts = edgePoints(g, a, b)
  if (pts.length === 2) return `M${pts[0].x} ${pts[0].y} L${pts[1].x} ${pts[1].y}`
  let d = `M${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2
    const my = (pts[i].y + pts[i + 1].y) / 2
    d += ` Q${pts[i].x} ${pts[i].y} ${i === pts.length - 2 ? `${pts[i + 1].x} ${pts[i + 1].y}` : `${mx} ${my}`}`
  }
  return d
}
