import { expect, test, type Page } from '@playwright/test'
import { answerAndContinue, answerCurrent, completeMission, createExplorer, skipStory, trackErrors } from './helpers'

/** Walk to a place on the current map and use its action button. */
async function visit(page: Page, node: string, action: RegExp) {
  await page.locator(`[data-node="${node}"]`).click()
  await page.getByRole('region').getByRole('button', { name: action }).click()
}

test('main student journey: avatar → world map → diagnostic → missions → bosses → follow-up → teacher view', async ({ page }) => {
  const errors = trackErrors(page)
  await createExplorer(page)

  // Explorable world map: the Frontier of Discovery starts locked.
  await expect(page.locator('[data-node="discovery"]')).toHaveAttribute('aria-label', /locked/)
  await visit(page, 'numbers', /enter region/i)
  await expect(page).toHaveURL(/\/region\/numbers$/)
  await expect(page.getByRole('heading', { name: 'The Realm of Numbers' })).toBeAttached()

  // Diagnostic check (from the Survey Stone): no feedback until the end.
  await visit(page, 'math-diag', /take the check/i)
  await page.getByRole('button', { name: /^begin$/i }).click()
  for (let i = 0; i < 5; i++) {
    await answerCurrent(page, i === 0)
    if (i < 4) await expect(page.getByText(`Question ${i + 2} of 5`)).toBeVisible()
  }
  await expect(page.getByText('Check complete')).toBeVisible()
  await expect(page.getByText(/^1 of 5 correct\. Your answers are saved/)).toBeVisible()

  // Mission 1: wrong answer → feedback, a heart breaks, a fresh variant and a hint offer follow.
  await page.goto('/mission/math-m1')
  await skipStory(page)
  await expect(page.getByRole('img', { name: '3 of 3 hearts left' })).toBeVisible()
  const firstId = await answerCurrent(page, false)
  await expect(page.getByText(/Not quite!|So close!/)).toBeVisible()
  await expect(page.getByText(/Correct answer:/)).toBeVisible()
  await expect(page.getByText(/Pip explains:/)).toBeVisible()
  await expect(page.getByRole('img', { name: '2 of 3 hearts left' })).toBeVisible()
  await page.getByRole('button', { name: /next challenge/i }).click()
  const fresh = page.locator('[data-instance-id]:not([data-graded])')
  await expect(fresh).toBeVisible()
  expect(await fresh.getAttribute('data-instance-id')).not.toBe(firstId)
  await expect(page.getByText(/Want a hint\?/)).toBeVisible()
  await completeMission(page)
  await skipStory(page) // outro
  await expect(page.getByText('Mission complete!')).toBeVisible()
  await expect(page.getByText(/Weigh the Planks complete/)).toBeVisible()

  // Progress survives a full reload and shows on the region map.
  await page.reload()
  await page.goto('/region/numbers')
  await expect(page.locator('[data-node="math-m1"]')).toHaveAttribute('aria-label', /completed/)
  await expect(page.locator('[data-node="math-m2"]')).toHaveAttribute('aria-label', /available/)

  // Mission 2, then the mini-boss.
  await page.goto('/mission/math-m2')
  await skipStory(page)
  await completeMission(page)
  await skipStory(page)
  await expect(page.getByText('Mission complete!')).toBeVisible()

  await page.goto('/boss/math-mini')
  await expect(page.getByText('Battle rules')).toBeVisible()
  await skipStory(page)
  for (let i = 0; i < 5; i++) await answerAndContinue(page, true)
  await skipStory(page) // outro
  await expect(page.getByText('Challenge passed!')).toBeVisible()

  for (const m of ['math-m3', 'math-m4']) {
    await page.goto(`/mission/${m}`)
    await skipStory(page)
    await completeMission(page)
    await skipStory(page)
    await expect(page.getByText('Mission complete!')).toBeVisible()
  }

  // Chapter boss: one mistake allowed (round 4 — "both sides" appears twice, so the skill is still covered).
  await page.goto('/boss/math-boss')
  await skipStory(page)
  await expect(page.getByRole('img', { name: /Storm Golem strength: 6 of 6/ })).toBeVisible()
  for (let i = 0; i < 6; i++) await answerAndContinue(page, i !== 3)
  await skipStory(page)
  await expect(page.getByText('Challenge passed!')).toBeVisible()
  await expect(page.getByText('5 of 6 correct.')).toBeVisible()

  // Follow-up check and transparent comparison.
  await page.getByRole('button', { name: /take the follow-up check/i }).click()
  await page.getByRole('button', { name: /^begin$/i }).click()
  for (let i = 0; i < 5; i++) {
    await answerCurrent(page, true)
    if (i < 4) await expect(page.getByText(`Question ${i + 2} of 5`)).toBeVisible()
  }
  await expect(page.getByText('Starting check → follow-up check')).toBeVisible()
  await expect(page.getByText(/Observed 4 more correct answers/)).toBeVisible()
  await expect(page.getByText('Limitations of this comparison')).toBeVisible()

  // The Frontier of Discovery is now open on the world map, and coins were earned.
  await page.goto('/world')
  await expect(page.locator('[data-node="discovery"]')).toHaveAttribute('aria-label', /available/)
  await expect(page.locator('#hud-coins')).not.toHaveAttribute('aria-label', '0 coins')

  // Teacher view reflects the real stored records.
  await page.goto('/teacher')
  await page.getByLabel('PIN', { exact: true }).fill('2468')
  await page.getByLabel('Confirm PIN').fill('2468')
  await page.getByRole('button', { name: /set pin and open/i }).click()
  await expect(page.locator('tr', { hasText: 'E2E Explorer' }).first()).toBeVisible()
  await page.getByRole('tab', { name: 'Explorers' }).click()
  const row = page.locator('tr', { has: page.getByText('E2E Explorer') })
  await expect(row).toBeVisible()
  await expect(row.getByText('6/6 stages')).toBeVisible()
  await row.getByRole('button', { name: 'Details' }).click()
  await expect(page.getByRole('heading', { name: /E2E Explorer/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent answers' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'boss', exact: true }).first()).toBeVisible()
  // The list shows only the newest answers, so filter by activity to reach the starting check's records.
  await page.getByLabel('Activity', { exact: true }).selectOption('diagnostic')
  await expect(page.getByRole('cell', { name: 'diagnostic', exact: true })).toHaveCount(5)
  await expect(page.getByRole('cell', { name: 'diagnostic', exact: true }).first()).toBeVisible()
  await expect(page.getByRole('cell', { name: 'boss', exact: true })).toHaveCount(0)
  await expect(page.getByText(/Observed 4 more correct answers/)).toBeVisible()

  expect(errors).toEqual([])
})
