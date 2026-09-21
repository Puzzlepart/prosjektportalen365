import { expect, test as setup } from '@playwright/test'
import { STORAGE_STATE, baseURL } from '../playwright.config'

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

  await page.goto(baseURL!)
  // Unauthenticated requests are redirected to login.microsoftonline.com.
  await page.getByRole('textbox', { name: /e-post|email|telefon|phone|skype/i }).fill(username)
  await page.getByRole('button', { name: /neste|next/i }).click()
  await page.getByRole('textbox', { name: /passord|password/i }).fill(password)
  await page.getByRole('button', { name: /logg på|sign in/i }).click()

  // "Stay signed in?" Choosing "Yes" gives a persistent cookie, which keeps the saved state valid
  // for the whole run. An MFA prompt would show up here instead.
  const staySignedIn = page.getByRole('button', { name: /^(ja|yes)$/i })
  const mfaPrompt = page.getByText(/godkjenn|verify your identity|approve sign in request|bekreft identiteten/i)
  await Promise.race([
    staySignedIn.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined),
    mfaPrompt.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined),
    page.waitForURL((url) => url.href.startsWith(baseURL!), { timeout: 30_000 }).catch(() => undefined)
  ])
  if (await mfaPrompt.isVisible().catch(() => false)) {
    throw new Error(
      `The test user ${username} was challenged for MFA. Exclude the account from MFA for automated sign-in.`
    )
  }
  if (await staySignedIn.isVisible().catch(() => false)) {
    await staySignedIn.click()
  }

  await page.waitForURL((url) => url.href.startsWith(baseURL!), { timeout: 60_000 })
  await expect(page).toHaveURL(new RegExp('^' + baseURL!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  await page.context().storageState({ path: STORAGE_STATE })
})
