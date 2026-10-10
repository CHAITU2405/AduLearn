/**
 * Painted artwork generated for AduLearn with Figma AI (see docs/ASSETS.md),
 * optimised to WebP by scripts/optimize-images.mjs.
 */
import bossGorm from '@/assets/game/boss-gorm.webp'
import mapDiscovery from '@/assets/game/map-discovery.webp'
import mapNumbers from '@/assets/game/map-numbers.webp'
import mapWords from '@/assets/game/map-words.webp'
import mapWorld from '@/assets/game/map-world.webp'
import stageBoss from '@/assets/game/stage-boss.webp'
import stageDiscovery from '@/assets/game/stage-discovery.webp'
import stageNumbers from '@/assets/game/stage-numbers.webp'
import stageWords from '@/assets/game/stage-words.webp'
import titleArt from '@/assets/game/title-art.webp'

export const ART = {
  mapWorld,
  mapNumbers,
  mapWords,
  mapDiscovery,
  stageNumbers,
  stageWords,
  stageDiscovery,
  stageBoss,
  titleArt,
}

/** Painted creature sprites (transparent). Creatures without one use the vector art. */
export const CREATURE_ART: Partial<Record<'gorm' | 'golem' | 'owl' | 'cloud', string>> = {
  gorm: bossGorm,
}

/** All painted maps share this world size (pixels of the optimised image). */
export const MAP_SIZE = { width: 1800, height: 1208 }

/** Convert a point measured on the 1264×848 source render to map coordinates. */
export const at = (x: number, y: number) => ({ x: Math.round(x * (1800 / 1264)), y: Math.round(y * (1208 / 848)) })
