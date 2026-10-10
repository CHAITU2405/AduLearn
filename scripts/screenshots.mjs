/**
 * Dev helper: capture screenshots of the main game screens for visual review.
 * Usage: build with `npx vite build --mode e2e --outDir dist-e2e`, serve it with
 * `npx vite preview --outDir dist-e2e --port 4175`, then:
 *   node scripts/screenshots.mjs <outDir> [baseUrl] [width] [height]
 * Uses the installed Edge (PW_CHANNEL) because some systems block bundled Chromium.
 */
import { chromium } from '@playwright/test'

const out = process.argv[2] ?? 'screenshots'
const base = process.argv[3] ?? 'http://localhost:4175'
const width = Number(process.argv[4] ?? 1366)
const height = Number(process.argv[5] ?? 800)
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'msedge' })
const page = await browser.newPage({ viewport: { width, height } })
const shot = async (n) => {
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/${n}.png` })
}

async function answer(correct) {
  const card = page.locator('[data-instance-id]:not([data-graded])').last()
  await card.waitFor()
  const id = await card.getAttribute('data-instance-id')
  const r = await page.evaluate((i) => window.__adulearnTest.correctResponse(i), id)
  const part = async (scope, p) => {
    if (p.kind === 'mcq')
      await scope
        .locator(correct ? `[data-choice-id="${p.choiceId}"]` : `[data-choice-id]:not([data-choice-id="${p.choiceId}"])`)
        .first()
        .click()
    else
      await scope
        .getByRole('textbox')
        .first()
        .fill(correct ? p.value : '987654')
  }
  if (r.kind === 'multi') for (const [i, p] of r.parts.entries()) await part(card.locator(`[data-part-index="${i}"]`), p)
  else if (r.kind === 'match' || r.kind === 'label') {
    for (const [row, opt] of Object.entries(r.pairs)) {
      await card.locator(`[data-match-right="${opt}"], [data-label-option="${opt}"]`).first().click()
      await card.locator(`[data-match-left="${row}"], [data-label-marker="${row}"]`).first().click()
    }
  } else if (r.kind === 'order') for (const t of r.tokenIds) await card.locator(`[data-token-id="${t}"]`).click()
  else await part(card, r)
  return { id, kind: r.kind }
}

await page.goto(`${base}/`)
await shot('01-welcome')
await page.getByRole('link', { name: /new adventure/i }).click()
await page.getByRole('button', { name: /create my explorer/i }).click()
await shot('02-avatar')
await page.getByRole('button', { name: /^next/i }).click()
await page.getByLabel('Nickname').fill('Meera')
await page.getByRole('button', { name: /save my explorer/i }).click()
await page.getByRole('button', { name: /go straight to the map/i }).click()
await shot('03-world')
await page.goto(`${base}/region/numbers`)
await shot('04-region-numbers')
await page.locator('[data-node="math-m1"]').click()
await shot('05-region-card')
await page.goto(`${base}/mission/math-m1`)
await shot('06-mission-intro')
await page.getByRole('button', { name: /skip story/i }).click()
await shot('07-mission-question')
const first = await answer(false)
await shot('08-mission-answered')
await page
  .locator(`[data-instance-id="${first.id}"]`)
  .getByRole('button', { name: /check|cast/i })
  .click()
await shot('09-mission-wrong')
await page
  .locator(`[data-instance-id="${first.id}"]`)
  .getByRole('button', { name: /next|continue/i })
  .last()
  .click()
const second = await answer(true)
await page
  .locator(`[data-instance-id="${second.id}"]`)
  .getByRole('button', { name: /check|cast/i })
  .click()
await page.waitForTimeout(300)
await shot('10-mission-correct')
await page.goto(`${base}/region/words`)
await shot('11-region-words')
await page.goto(`${base}/mission/eng-m1`)
await page.getByRole('button', { name: /skip story/i }).click()
await shot('12-english-question')
await page.goto(`${base}/world`)
await shot('13-world-after')

// Play through two missions to reach the mini-boss.
async function finishMission(id) {
  await page.goto(`${base}/mission/${id}`)
  await page.getByRole('button', { name: /skip story/i }).click()
  for (let i = 0; i < 25; i++) {
    const done = page.getByRole('button', { name: /skip story/i })
    const card = page.locator('[data-instance-id]:not([data-graded])')
    await done.or(card).first().waitFor()
    if (await done.isVisible()) break
    const a = await answer(true)
    const c = page.locator(`[data-instance-id="${a.id}"]`)
    await c.getByRole('button', { name: /check|cast/i }).click()
    await c
      .getByRole('button', { name: /next|finish|continue/i })
      .last()
      .click()
  }
  await page.getByRole('button', { name: /skip story/i }).click()
}
await finishMission('math-m1')
await shot('14-victory')
await finishMission('math-m2')
await page.goto(`${base}/boss/math-mini`)
await shot('15-boss-intro')
await page.getByRole('button', { name: /skip story/i }).click()
await shot('16-boss-arena')
const b = await answer(true)
await page
  .locator(`[data-instance-id="${b.id}"]`)
  .getByRole('button', { name: /check|cast/i })
  .click()
await page.waitForTimeout(150)
await page.screenshot({ path: `${out}/17-boss-hit.png` })
await page.goto(`${base}/region/numbers`)
await shot('18-region-progress')
await browser.close()
