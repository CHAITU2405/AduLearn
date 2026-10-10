/**
 * Remove a flat green (#00FF00) background from generated sprites and save
 * trimmed WebP with transparency.
 * Usage: node scripts/chroma-key.mjs <sourceDir> [outDir=src/assets/game]
 */
import { readdirSync } from 'node:fs'
import { join, parse } from 'node:path'
import sharp from 'sharp'

const [src, out = 'src/assets/game'] = process.argv.slice(2)
for (const f of readdirSync(src).filter((n) => n.endsWith('.png'))) {
  const { data, info } = await sharp(join(src, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const greenness = g - Math.max(r, b)
    if (greenness > 90) data[i + 3] = 0
    else if (greenness > 30) {
      // Soft edge: fade out and remove the green spill.
      data[i + 3] = Math.round(255 * (1 - (greenness - 30) / 60))
      data[i + 1] = Math.max(r, b)
    }
  }
  const info2 = await sharp(data, { raw: info })
    .trim()
    .resize({ width: 640, height: 640, fit: 'inside' })
    .webp({ quality: 85, alphaQuality: 90 })
    .toFile(join(out, `${parse(f).name}.webp`))
  console.log(`${parse(f).name}.webp ${info2.width}x${info2.height} ${(info2.size / 1024).toFixed(0)} KB`)
}
