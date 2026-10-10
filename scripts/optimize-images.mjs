/**
 * Convert source artwork (PNG) into optimised WebP for the app.
 * Usage: node scripts/optimize-images.mjs <sourceDir> [outDir=src/assets/game]
 * Source art was generated for AduLearn with Figma AI (see docs/ASSETS.md).
 */
import { readdirSync } from 'node:fs'
import { join, parse } from 'node:path'
import sharp from 'sharp'

const [src, out = 'src/assets/game'] = process.argv.slice(2)
if (!src) throw new Error('Usage: node scripts/optimize-images.mjs <sourceDir> [outDir]')
for (const f of readdirSync(src).filter((n) => n.endsWith('.png'))) {
  const { name } = parse(f)
  const width = name.startsWith('map-') ? 1800 : 1920
  const info = await sharp(join(src, f))
    .resize({ width, withoutEnlargement: false })
    .webp({ quality: 80, effort: 6 })
    .toFile(join(out, `${name}.webp`))
  console.log(`${name}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`)
}
