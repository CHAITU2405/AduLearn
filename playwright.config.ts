import { defineConfig, devices } from '@playwright/test'

/**
 * Browser tests run against a production-like build made with `--mode e2e`,
 * which adds a test-only hook (see src/services/learning.ts) so tests can
 * answer questions correctly. Normal builds do not include that hook.
 */
// Set PW_CHANNEL=msedge (or chrome) to use an installed, signed browser instead of
// Playwright's bundled Chromium — useful where OS application-control policies
// block unsigned binaries.
const channel = process.env.PW_CHANNEL || undefined

export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel }, testIgnore: /responsive\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: {
    command: 'npx vite build --mode e2e --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
