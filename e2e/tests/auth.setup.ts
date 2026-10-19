import { expect, type Locator, type Page, test as setup } from '@playwright/test'
import { STORAGE_STATE, baseURL } from '../playwright.config'
import { withNetworkRetry } from './fixtures/pp365'

/**
 * Types a secret into a field without it reaching the report. `fill()` titles its step
 * `Fill "<value>"` (`type()`, `pressSequentially()` and `insertText()` likewise), and the HTML report
 * keeps every step of every test, passed ones too: until 2026-10-14 every CI report held the test
 * user's password. `fill('')` clears the field after the same actionability checks, and Chromium's
 * `Input.insertText`, which `fill()` itself ends in, types the secret as trusted input: a protocol
 * call is no step of the report.
 */
async function enterSecret(page: Page, field: Locator, secret: string) {
  await field.fill('')
  const cdp = await page.context().newCDPSession(page)
  try {
    await cdp.send('Input.insertText', { text: secret })
  } finally {
    await cdp.detach()
  }
}

// A failed test's error-context.md holds an ARIA snapshot of the page with every input's value,
// password fields too, and goes into the report and the public artifact. The snapshot is taken as
// the context closes, after this hook: blank the password first.
setup.afterEach(async ({ page }) => {
  for (const frame of page.frames()) {
    await frame
      .evaluate(() =>
        document
          .querySelectorAll<HTMLInputElement>('input[type="password"]')
          .forEach((input) => (input.value = ''))
      )
      .catch(() => undefined)
  }
})

/**
 * Signs in to Microsoft 365 as the dedicated end-to-end test user and saves the browser storage
 * state, so every test starts already authenticated against the test tenant.
 *
 * The account must not be challenged for MFA on this sign-in path (a Conditional Access exclusion
 * for this single account is the usual way); an MFA prompt fails this setup with a clear message.
 */
setup('sign in as the test user', async ({ page }) => {
  const username = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD
  if (!username || !password) {
    throw new Error('E2E_USERNAME and E2E_PASSWORD must be set (see e2e/.env.example).')
  }

  // Every test depends on this sign-in: a dropped connection is tried once more.
  await withNetworkRetry(() => page.goto(baseURL!))
  // Unauthenticated requests are redirected to login.microsoftonline.com.
  await enterSecret(
    page,
    page.getByRole('textbox', { name: /e-post|email|telefon|phone|skype/i }),
    username
  )
  await page.getByRole('button', { name: /neste|next/i }).click()
  await enterSecret(page, page.getByRole('textbox', { name: /passord|password/i }), password)
  await page.getByRole('button', { name: /logg på|sign in/i }).click()

  // "Stay signed in?" Choosing "Yes" gives a persistent cookie, which keeps the saved state valid
  // for the whole run. An MFA prompt would show up here instead.
  const staySignedIn = page.getByRole('button', { name: /^(ja|yes)$/i })
  const mfaPrompt = page.getByText(
    /godkjenn|verify your identity|approve sign in request|bekreft identiteten/i
  )
  await Promise.race([
    staySignedIn.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined),
    mfaPrompt.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined),
    page
      .waitForURL((url) => url.href.startsWith(baseURL!), { timeout: 30_000 })
      .catch(() => undefined)
  ])
  if (await mfaPrompt.isVisible().catch(() => false)) {
    throw new Error(
      'The test user (E2E_USERNAME) was challenged for MFA. Exclude the account from MFA for automated sign-in.'
    )
  }
  if (await staySignedIn.isVisible().catch(() => false)) {
    await staySignedIn.click()
  }

  await page.waitForURL((url) => url.href.startsWith(baseURL!), { timeout: 60_000 })
  await expect(page).toHaveURL(new RegExp('^' + baseURL!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  await page.context().storageState({ path: STORAGE_STATE })
})
