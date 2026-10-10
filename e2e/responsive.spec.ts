import { expect, test, type Page } from '@playwright/test'
import { createExplorer, skipStory } from './helpers'

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const { scroll, width } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: window.innerWidth }))
  expect(scroll, `${label} overflows horizontally`).toBeLessThanOrEqual(width + 1)
}

test('layouts do not overflow on a phone', async ({ page }) => {
  await page.goto('/')
  await expectNoHorizontalOverflow(page, 'welcome')
  await createExplorer(page, 'Phone')
  for (const path of ['/world', '/home', '/region/numbers', '/chapter/math-equations', '/progress', '/review', '/settings', '/about', '/teacher']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expectNoHorizontalOverflow(page, path)
  }
  await page.goto('/mission/math-m1')
  await skipStory(page)
  await expect(page.locator('[data-instance-id]')).toBeVisible()
  await expectNoHorizontalOverflow(page, 'mission')
  // Touch targets for answering are comfortably sized.
  const box = await page.getByRole('button', { name: /check answer/i }).boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
})
