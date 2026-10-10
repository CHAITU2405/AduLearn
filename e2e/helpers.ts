import { expect, type Locator, type Page } from '@playwright/test'

type PartResponse = { kind: 'mcq'; choiceId: string } | { kind: 'numeric'; value: string } | { kind: 'text'; value: string }
type Response = PartResponse | { kind: 'match' | 'label'; pairs: Record<string, string> } | { kind: 'order'; tokenIds: string[] } | { kind: 'multi'; parts: PartResponse[] }

declare global {
  interface Window {
    __adulearnTest: { correctResponse: (id: string) => Response | null }
  }
}

/** Collect uncaught page errors so tests can assert the app runs cleanly. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  return errors
}

export async function createExplorer(page: Page, nickname = 'E2E Explorer') {
  await page.goto('/')
  await page.getByRole('link', { name: /start a new adventure/i }).click()
  await page.getByRole('button', { name: /create my explorer/i }).click()
  await page.getByText('Curly', { exact: true }).click()
  await page.getByText('Field jacket', { exact: true }).click()
  await page.getByRole('button', { name: /^next/i }).click()
  await page.getByLabel('Nickname').fill(nickname)
  await page.getByRole('button', { name: /save my explorer/i }).click()
  await expect(page.getByRole('heading', { name: `Welcome, ${nickname}!` })).toBeVisible()
  await page.getByRole('button', { name: /go straight to the map/i }).click()
  await expect(page).toHaveURL(/\/world$/)
}

async function fillPart(scope: Locator, part: PartResponse, correct: boolean) {
  if (part.kind === 'mcq') {
    if (correct) await scope.locator(`[data-choice-id="${part.choiceId}"]`).first().click()
    else await scope.locator(`[data-choice-id]:not([data-choice-id="${part.choiceId}"])`).first().click()
  } else {
    await scope
      .getByRole('textbox')
      .first()
      .fill(correct ? part.value : part.kind === 'numeric' ? '987654' : 'qqqq')
  }
}

/** Answer the question currently on screen, correctly or incorrectly, through the real UI. */
export async function answerCurrent(page: Page, correct = true) {
  const card = page.locator('[data-instance-id]:not([data-graded])').last()
  await expect(card).toBeVisible()
  const id = (await card.getAttribute('data-instance-id'))!
  const response = await page.evaluate((i) => window.__adulearnTest.correctResponse(i), id)
  if (!response) throw new Error('No active answer key for this question')
  switch (response.kind) {
    case 'mcq':
    case 'numeric':
    case 'text':
      await fillPart(card, response, correct)
      break
    case 'multi':
      for (const [i, part] of response.parts.entries()) await fillPart(card.locator(`[data-part-index="${i}"]`), part, correct && true)
      break
    case 'match':
    case 'label': {
      const entries = Object.entries(response.pairs)
      for (const [i, [row, option]] of entries.entries()) {
        const target = correct ? option : entries[(i + 1) % entries.length][1]
        await card.locator(`select#pair-${row}`).selectOption(target)
      }
      break
    }
    case 'order': {
      const ids = correct ? response.tokenIds : [...response.tokenIds].reverse()
      for (const t of ids) await card.locator(`[data-token-id="${t}"]`).click()
      break
    }
  }
  await card.getByRole('button', { name: /check answer|submit answer/i }).click()
  return id
}

/** Answer and continue (for screens that show feedback). Returns whether the feedback said correct. */
export async function answerAndContinue(page: Page, correct = true) {
  const id = await answerCurrent(page, correct)
  const card = page.locator(`[data-instance-id="${id}"]`)
  await expect(card).toHaveAttribute('data-graded', correct ? 'correct' : 'incorrect')
  await card
    .getByRole('button', { name: /next|finish|continue|see result|back to review/i })
    .last()
    .click()
}

export async function skipStory(page: Page) {
  await page.getByRole('button', { name: /skip story/i }).click()
}

/** Play a mission (after the story) until it completes, answering correctly. */
export async function completeMission(page: Page) {
  if (await page.getByRole('button', { name: /start the mission/i }).isVisible()) await page.getByRole('button', { name: /start the mission/i }).click()
  for (let i = 0; i < 25; i++) {
    const graded = page.locator('[data-instance-id]:not([data-graded])')
    const outroOrSummary = page.getByText('Mission complete!').or(page.getByRole('button', { name: /skip story/i }))
    await expect(graded.or(outroOrSummary).first()).toBeVisible()
    if (await outroOrSummary.first().isVisible()) break
    await answerAndContinue(page, true)
  }
}
