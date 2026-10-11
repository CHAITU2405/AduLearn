import { expect, test, type Page } from '@playwright/test'
import { createExplorer, trackErrors } from './helpers'

async function openTeacher(page: Page) {
  await page.goto('/teacher')
  await page.getByLabel('PIN', { exact: true }).fill('2468')
  await page.getByLabel('Confirm PIN').fill('2468')
  await page.getByRole('button', { name: /set pin and open/i }).click()
}

const question = (page: Page, i: number) => page.locator(`[data-question="${i}"]`)

test('teacher sets an assignment; a student attempts, re-attempts and the teacher sees the scores', async ({ page }) => {
  const errors = trackErrors(page)
  await createExplorer(page, 'Quiz Taker')

  // Teacher: dashboard opens first, with the sample leaderboard and the real explorer.
  await openTeacher(page)
  await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
  await expect(page.locator('tr', { hasText: 'Quiz Taker' })).toBeVisible()
  await page.getByLabel('Include sample students').uncheck()
  await expect(page.locator('tr', { hasText: 'Aarav' })).toHaveCount(0)

  // Build from the sample quiz, edit it and publish.
  await page.getByRole('tab', { name: 'Assignments' }).click()
  await page.getByRole('button', { name: /start from a sample quiz/i }).click()
  await page.getByLabel('Title').fill('E2E weekly quiz')
  await page.getByLabel('Attempts allowed').selectOption('2')
  await page.getByRole('button', { name: /save and publish/i }).click()
  const card = page.locator('li', { hasText: 'E2E weekly quiz' })
  await expect(card.getByText('Published')).toBeVisible()

  // Student: the assignment is listed; first attempt answers only one question.
  await page.goto('/assignments')
  const mine = page.locator('[data-assignment]', { hasText: 'E2E weekly quiz' })
  await expect(mine.getByText('New')).toBeVisible()
  await mine.getByRole('link', { name: 'Start' }).click()
  await question(page, 0).getByRole('textbox').fill('12')
  await page.getByRole('button', { name: 'Submit answers' }).click()
  await expect(page.getByText('Submit with unanswered questions?')).toBeVisible()
  await page.getByRole('button', { name: 'Submit anyway' }).click()
  await expect(page.locator('[data-result]')).toHaveAttribute('data-result', '20')
  await expect(page.getByText('1 of 5 correct')).toBeVisible()
  await expect(page.getByText('Correct answer:').first()).toBeVisible()

  // Re-attempt with everything right.
  await page.getByRole('button', { name: /re-attempt \(1 left\)/i }).click()
  await question(page, 0).getByRole('textbox').fill('12')
  await question(page, 1).getByRole('radio', { name: 'an', exact: true }).click()
  await question(page, 2).getByRole('textbox').fill('50')
  await question(page, 3).getByRole('textbox').fill('Chloroplasts')
  await question(page, 4).getByRole('radio', { name: 'Sulphur' }).click()
  await page.getByRole('button', { name: 'Submit answers' }).click()
  await expect(page.locator('[data-result]')).toHaveAttribute('data-result', '100')
  await expect(page.getByText('No attempts left')).toBeVisible()

  await page.goto('/assignments')
  await expect(mine.getByText('Best score: 100% (5/5)')).toBeVisible()
  await expect(mine.getByText('No attempts left')).toBeVisible()

  // Teacher sees both scores.
  await page.goto('/teacher')
  await page.getByRole('tab', { name: 'Assignments' }).click()
  await card.getByRole('button', { name: 'Results' }).click()
  const row = page.locator('tr', { hasText: 'Quiz Taker' })
  await expect(row).toContainText('100% (5/5)')
  await expect(row).toContainText('20%, 100%')

  // Unpublishing hides it from students.
  await page.getByRole('button', { name: /back to assignments/i }).click()
  await card.getByRole('button', { name: 'Unpublish' }).click()
  await page.goto('/assignments')
  await expect(page.getByText('No assignments yet')).toBeVisible()

  expect(errors).toEqual([])
})
