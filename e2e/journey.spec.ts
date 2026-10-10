import { expect, test } from '@playwright/test'
import { answerAndContinue, answerCurrent, completeMission, createExplorer, skipStory, trackErrors } from './helpers'

test('main student journey: avatar → world → diagnostic → missions → bosses → follow-up → teacher view', async ({ page }) => {
  const errors = trackErrors(page)
  await createExplorer(page)

  // World map: Science is locked until a mission is completed.
  await expect(page.getByLabel(/Frontier of Discovery.*locked/)).toBeVisible()
  await page.getByRole('link', { name: /Realm of Numbers.*open/i }).click()
  await expect(page.getByRole('heading', { name: 'The Realm of Numbers' })).toBeVisible()
  await page.getByRole('link', { name: /begin chapter/i }).click()
  await expect(page.getByRole('heading', { name: 'Bridge of Balance' })).toBeVisible()

  // Diagnostic check: no feedback until the end; answer some wrong to leave room for growth.
  await page.getByRole('link', { name: /take check/i }).click()
  await page.getByRole('button', { name: /^begin$/i }).click()
  for (let i = 0; i < 5; i++) {
    await answerCurrent(page, i === 0)
    if (i < 4) await expect(page.getByText(`Question ${i + 2} of 5`)).toBeVisible()
  }
  await expect(page.getByText('Check complete')).toBeVisible()
  await expect(page.getByText(/^1 of 5 correct\. Your answers are saved/)).toBeVisible()
  await page.getByRole('link', { name: /back to chapter/i }).click()

  // Mission 1: wrong answer → meaningful feedback, hearts drop, fresh variant follows.
  await page.goto('/mission/math-m1')
  await skipStory(page)
  await expect(page.getByRole('img', { name: '3 of 3 hearts left' })).toBeVisible()
  const firstId = await answerCurrent(page, false)
  await expect(page.getByText(/Not quite|Partly right/)).toBeVisible()
  await expect(page.getByText(/Correct answer:/)).toBeVisible()
  await expect(page.getByText(/Why:/)).toBeVisible()
  await expect(page.getByRole('img', { name: '2 of 3 hearts left' })).toBeVisible()
  await page.getByRole('button', { name: /next question/i }).click()
  await expect(page.locator('[data-instance-id]:not([data-graded])')).toBeVisible()
  expect(await page.locator('[data-instance-id]:not([data-graded])').getAttribute('data-instance-id')).not.toBe(firstId)
  await expect(page.getByText(/A hint is ready/)).toBeVisible()
  await completeMission(page)
  await skipStory(page) // outro
  await expect(page.getByText('Mission complete!')).toBeVisible()
  await expect(page.getByText(/Weigh the Planks complete/)).toBeVisible()

  // Progress survives a full reload.
  await page.reload()
  await page.goto('/chapter/math-equations')
  const m1 = page.locator('li', { has: page.getByText('Weigh the Planks', { exact: true }) })
  await expect(m1.getByText('Completed')).toBeVisible()
  const m2 = page.locator('li', { has: page.getByText('Raise the Rope Lift', { exact: true }) })
  await expect(m2.getByText('Available')).toBeVisible()

  // Mission 2, then the mini-boss.
  await page.goto('/mission/math-m2')
  await skipStory(page)
  await completeMission(page)
  await skipStory(page)
  await expect(page.getByText('Mission complete!')).toBeVisible()

  await page.goto('/boss/math-mini')
  await expect(page.getByText('How this challenge works')).toBeVisible()
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

  // Chapter boss: one mistake is allowed (round 4 — "both sides" appears twice, so the idea is still covered).
  await page.goto('/boss/math-boss')
  await skipStory(page)
  await expect(page.getByRole('img', { name: /Storm Golem strength: 6 of 6/ })).toBeVisible()
  for (let i = 0; i < 6; i++) await answerAndContinue(page, i !== 3)
  await skipStory(page)
  await expect(page.getByText('Challenge passed!')).toBeVisible()
  await expect(page.getByText('5 of 6 correct.')).toBeVisible()

  // Follow-up check and transparent comparison.
  await page.getByRole('link', { name: /take the follow-up check/i }).click()
  await page.getByRole('button', { name: /^begin$/i }).click()
  for (let i = 0; i < 5; i++) {
    await answerCurrent(page, true)
    if (i < 4) await expect(page.getByText(`Question ${i + 2} of 5`)).toBeVisible()
  }
  await expect(page.getByText('Starting check → follow-up check')).toBeVisible()
  await expect(page.getByText(/Observed 4 more correct answers/)).toBeVisible()
  await expect(page.getByText('Limitations of this comparison')).toBeVisible()

  // Science region is now open.
  await page.goto('/world')
  await expect(page.getByRole('link', { name: /Frontier of Discovery.*open/i })).toBeVisible()

  // Teacher view reflects the real stored records.
  await page.goto('/teacher')
  await page.getByLabel('PIN', { exact: true }).fill('2468')
  await page.getByLabel('Confirm PIN').fill('2468')
  await page.getByRole('button', { name: /set pin and open/i }).click()
  const row = page.locator('tr', { has: page.getByText('E2E Explorer') })
  await expect(row).toBeVisible()
  await expect(row.getByText('6/6 stages')).toBeVisible()
  await row.getByRole('button', { name: 'Details' }).click()
  await expect(page.getByRole('heading', { name: /E2E Explorer/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent answers' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'boss', exact: true }).first()).toBeVisible()
  await expect(page.getByRole('cell', { name: 'diagnostic', exact: true }).first()).toBeVisible()
  await expect(page.getByText('Storm Over the Gorge').first()).toBeVisible()
  await expect(page.getByText(/Observed 4 more correct answers/)).toBeVisible()

  expect(errors).toEqual([])
})
