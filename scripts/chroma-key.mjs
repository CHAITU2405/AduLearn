/**
 * Remove a flat green (#00FF00) background from generated sprites and save
 * trimmed WebP with transparency.
 * Usage: node scripts/chroma-key.mjs <sourceDir> [outDir=src/assets/game] [maxSize=640]
 *
 * Accepts PNG and JPEG. Small sources (e.g. preview-sized exports) are upscaled
 * before keying so the soft edge stays smooth; replace them with full-size
 * exports when available.
 */
import { readdirSync } from 'node:fs'
import { join, parse } from 'node:path'
import sharp from 'sharp'

const [src, out = 'src/assets/game', max = '640'] = process.argv.slice(2)
const size = Number(max)
for (const f of readdirSync(src).filter((n) => /\.(png|jpe?g)$/i.test(n))) {
  const meta = await sharp(join(src, f)).metadata()
  const base = sharp(join(src, f))
  const scaled = (meta.width ?? size) < size ? base.resize({ width: size, height: size, fit: 'inside', kernel: 'lanczos3' }) : base
  const { data, info } = await scaled.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const greenness = g - Math.max(r, b)
    if (greenness > 80) data[i + 3] = 0
    else if (greenness > 20) {
      // Soft edge: fade out and remove the green spill.
      data[i + 3] = Math.round(255 * (1 - (greenness - 20) / 60))
      data[i + 1] = Math.max(r, b)
    } else if (greenness > 0) data[i + 1] = Math.max(r, b) // spill on edge pixels
  }
  const info2 = await sharp(data, { raw: info })
    .trim()
    .resize({ width: size, height: size, fit: 'inside' })
    .webp({ quality: 85, alphaQuality: 90 })
    .toFile(join(out, `${parse(f).name}.webp`))
  console.log(`${parse(f).name}.webp ${info2.width}x${info2.height} ${(info2.size / 1024).toFixed(0)} KB`)
}
