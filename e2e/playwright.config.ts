import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Local runs read e2e/.env (gitignored, see .env.example). CI passes the same variables as job env.
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true })

export const STORAGE_STATE = path.join(__dirname, '.auth', 'user.json')

/**
 * Base URL of the portfolio hub under test. In CI this is the `SP_URL_TEST` repository variable,
 * the same site the test channel is deployed to.
 */
export const baseURL = process.env.E2E_BASE_URL

if (!baseURL) {
  throw new Error('E2E_BASE_URL is not set. Copy e2e/.env.example to e2e/.env or set the variable in CI.')
}

export default defineConfig({
  testDir: './tests',
  // SharePoint pages are slow to settle; one retry in CI absorbs transient throttling without
  // hiding a real regression (a test that only passes on retry is reported as "flaky").
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI
    ? [['github'], ['junit', { outputFile: 'test-results/junit.xml' }], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'nb-NO',
    timezoneId: 'Europe/Oslo'
  },
  projects: [
    // Signs in once with the dedicated test user and stores the session for the other projects.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup']
    }
  ]
})
