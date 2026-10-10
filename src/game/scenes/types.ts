import type { ComponentType } from 'react'

export interface ScenePlace {
  x: number
  y: number
  label: string
  character?: string
}

/**
 * Region map definition: where each chapter node (and extra places) sits on
 * the map, how they connect, and the art that reacts to progress.
 * Keys of `places` match chapter node ids, plus 'entry', 'fact' and 'soon'.
 */
export interface RegionSceneDef {
  regionId: string
  width: number
  height: number
  entryId: string
  factId: string
  places: Record<string, ScenePlace>
  edges: { a: string; b: string; via?: { x: number; y: number }[] }[]
  Background: ComponentType<{ done: ReadonlySet<string>; factFound: boolean }>
}
