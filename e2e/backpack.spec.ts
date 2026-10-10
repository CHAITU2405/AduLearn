import { expect, test } from '@playwright/test'
import { completeMission, createExplorer, skipStory, trackErrors } from './helpers'

test('earn coins, try on and buy a wardrobe item, and see badges and scrolls in the backpack', async ({ page }) => {
  const errors = trackErrors(page)
  await createExplorer(page, 'Shopper')

  // Find the three hidden scrolls on the island (+5 coins each).
  for (const spot of ['lighthouse', 'grove', 'falls']) {
    await page.locator(`[data-node="${spot}"]`).click()
    await page
      .getByRole('region')
      .getByRole('button', { name: /read the scroll/i })
      .click()
    await expect(page.getByText('Hidden scroll found')).toBeVisible()
    await page.getByRole('button', { name: /keep exploring/i }).click()
    await page.keyboard.press('Escape') // close the location card
  }

  // Earn coins in a mission.
  await page.goto('/mission/math-m1')
  await skipStory(page)
  await completeMission(page)
  await skipStory(page)
  await expect(page.getByText('Mission complete!')).toBeVisible()

  // The HUD backpack button opens the backpack.
  await page.goto('/world')
  await page.getByRole('link', { name: 'Backpack', exact: true }).click()
  await expect(page).toHaveURL(/\/backpack$/)

  const hat = page.locator('[data-item="acc-explorer-hat"]')
  const crown = page.locator('[data-item="acc-crown"]')
  // Too expensive items are locked; affordable ones can be tried on and bought.
  await expect(crown.getByRole('button', { name: /buy for 250/i })).toBeDisabled()
  await hat.getByRole('button', { name: /try on the explorer hat/i }).click()
  await expect(hat.getByText('Trying on')).toBeVisible()
  await hat.getByRole('button', { name: /buy for 60/i }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /buy it/i })
    .click()
  await expect(page.getByText('New look!')).toBeVisible()
  await page.getByRole('button', { name: /looking good/i }).click()
  await expect(hat.getByText('Wearing')).toBeVisible()

  // Purchases and the new look persist.
  await page.reload()
  await expect(page.locator('[data-item="acc-explorer-hat"]').getByText('Wearing')).toBeVisible()
  await page
    .locator('[data-item="acc-explorer-hat"]')
    .getByRole('button', { name: /take off/i })
    .click()
  await expect(page.locator('[data-item="acc-explorer-hat"]').getByRole('button', { name: /^wear$/i })).toBeVisible()

  // Badges, scrolls and journey tabs show real progress.
  await page.getByRole('tab', { name: /badges/i }).click()
  await expect(page.getByText(/Weigh the Planks complete/)).toBeVisible()
  await page.getByRole('tab', { name: /scrolls/i }).click()
  await expect(page.getByText('3 of 6 hidden scrolls found')).toBeVisible()
  await expect(page.getByText('The Lighthouse Lens')).toBeVisible()
  await page.getByRole('tab', { name: /journey/i }).click()
  await expect(page.getByText('The Realm of Numbers')).toBeVisible()

  // The owned item now appears in the Settings avatar editor; unowned ones do not.
  await page.goto('/settings')
  await page.getByRole('button', { name: /edit avatar/i }).click()
  await expect(page.getByText('Explorer hat', { exact: true })).toBeVisible()
  await expect(page.getByText('Scholar crown', { exact: true })).toHaveCount(0)

  expect(errors).toEqual([])
})
