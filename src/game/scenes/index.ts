import { discoveryScene } from './DiscoveryScene'
import { numbersScene } from './NumbersScene'
import type { RegionSceneDef } from './types'
import { wordsScene } from './WordsScene'

export const REGION_SCENES: Record<string, RegionSceneDef> = {
  numbers: numbersScene,
  words: wordsScene,
  discovery: discoveryScene,
}

export type { RegionSceneDef }
