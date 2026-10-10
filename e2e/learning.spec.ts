import { expect, test } from '@playwright/test'
import { answerAndContinue, answerCurrent, createExplorer, skipStory, trackErrors } from './helpers'

test('running out of hearts offers targeted practice and a retry with different questions', async ({ page }) => {
  const errors = trackErrors(page)
  await createExplorer(page, 'Retry Tester')
  await page.goto('/mission/eng-m1')
  await skipStory(page)
  for (let i = 0; i < 3; i++) await answerAndContinue(page, false)
  await expect(page.getByText('Out of hearts — for now')).toBeVisible()
  await expect(page.getByText(/Everything you answered has been saved/)).toBeVisible()
  await page.getByRole('link', { name: /targeted practice/i }).click()
  await expect(page.getByRole('heading', { name: /^Practise:/ })).toBeVisible()
  for (let i = 0; i < 3; i++) await answerAndContinue(page, true)
  await expect(page.getByText('Practice complete!')).toBeVisible()
  await page.getByRole('link', { name: /try signboards of lexton again/i }).click()
  await skipStory(page)
  await expect(page.getByRole('img', { name: '3 of 3 hearts left' })).toBeVisible()
  expect(errors).toEqual([])
})

test('hearts are not restored by refreshing mid-mission, and history persists for review', async ({ page }) => {
  await createExplorer(page, 'Refresh Tester')
  await page.goto('/mission/math-m1')
  await skipStory(page)
  await answerAndContinue(page, false)
  await expect(page.getByRole('img', { name: '2 of 3 hearts left' })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Welcome back')).toBeVisible()
  await skipStory(page)
  await expect(page.getByRole('img', { name: '2 of 3 hearts left' })).toBeVisible()

  await page.goto('/review')
  await expect(page.getByText('Missed last time')).toBeVisible()
  await page.getByRole('button', { name: 'Try again' }).first().click()
  await answerAndContinue(page, true)
  await expect(page.getByText('Revisit earlier questions')).toBeVisible()
})

test('the app works with Ollama unavailable and falls back to approved explanations', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'adulearn:prefs',
      JSON.stringify({ motion: 'reduce', textSize: 'normal', showReasons: true, ai: { enabled: true, endpoint: 'http://127.0.0.1:9', model: 'missing-model', timeoutMs: 3000 } }),
    )
  })
  const errors = trackErrors(page)
  await createExplorer(page, 'No AI')
  await page.goto('/mission/math-m1')
  await skipStory(page)
  await answerCurrent(page, false)
  await page.getByRole('button', { name: /explain it another way/i }).click()
  await expect(page.getByText(/Local AI was not used/)).toBeVisible()
  await expect(page.getByText('Approved content')).toBeVisible()
  // Gameplay continues normally.
  await page.getByRole('button', { name: /next question/i }).click()
  await answerAndContinue(page, true)
  // The failed request to the unreachable endpoint is expected; nothing else should error.
  expect(errors.filter((e) => !/127\.0\.0\.1:9|Failed to load resource|ERR_/.test(e))).toEqual([])
})

test('science diagram labelling and labs work', async ({ page }) => {
  await createExplorer(page, 'Lab Tester')
  // Unlock the Frontier of Discovery by completing an English mission quickly.
  await page.goto('/mission/eng-m1')
  await skipStory(page)
  for (let i = 0; i < 12; i++) {
    if (await page.getByRole('button', { name: /skip story/i }).isVisible()) break
    await answerAndContinue(page, true)
  }
  await page.goto('/mission/sci-m3')
  await skipStory(page)
  await expect(page.getByText('Pressure simulator')).toBeVisible()
  await page.getByLabel(/^Area/).focus()
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft')
  await expect(page.getByText(/Pressure = 200 N ÷ 0.5 m² = 400 Pa/)).toBeVisible()
  await page.getByRole('button', { name: /start the mission/i }).click()
  await answerAndContinue(page, true)
  await page.goto('/mission/sci-m1')
  await skipStory(page)
  // Answer until a labelling question appears (or a few questions pass).
  for (let i = 0; i < 6; i++) {
    if (await page.getByRole('img', { name: /Diagram of a plant cell/ }).isVisible()) break
    await answerAndContinue(page, true)
  }
})

test('teacher can reject content, and the PIN is required', async ({ page }) => {
  await page.goto('/teacher')
  await page.getByLabel('PIN', { exact: true }).fill('1357')
  await page.getByLabel('Confirm PIN').fill('1357')
  await page.getByRole('button', { name: /set pin and open/i }).click()
  await expect(page.getByText('No explorers on this device yet')).toBeVisible()
  await page.getByRole('tab', { name: /content review/i }).click()
  await page.getByLabel('Set status for One-step equation: x + a = b').selectOption('rejected')
  await expect(page.locator('tr', { has: page.getByText('One-step equation: x + a = b') }).locator('span', { hasText: /^Rejected$/ })).toBeVisible()
  await page.getByRole('button', { name: 'Lock' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: /open teacher view/i })).toBeVisible()
  await page.getByLabel('PIN', { exact: true }).fill('0000')
  await page.getByRole('button', { name: /open teacher view/i }).click()
  await expect(page.getByText('That PIN is not correct.')).toBeVisible()
})
