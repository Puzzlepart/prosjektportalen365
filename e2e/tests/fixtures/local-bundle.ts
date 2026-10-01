import { Page } from '@playwright/test'

/**
 * Loading a solution's local bundle onto a tenant page through SPFx's debug manifests, for the
 * tests under `tests/local/` (`E2E_LOCAL_BUNDLE=1`, with `npx heft start --nobrowser` serving the
 * solution on https://localhost:4321). The dev build must carry the component ids of the channel
 * the page uses, or the page never asks the dev server for a bundle.
 */
const manifests = process.env.DEBUG_MANIFESTS ?? 'https://localhost:4321/temp/build/manifests.js'

/**
 * `test.use` options for a local-bundle test: the dev certificate is self-signed, and recent
 * Chromium gates a public site's requests to localhost behind a local-network-access check that
 * automation denies by default.
 */
export const localBundleUse = {
  ignoreHTTPSErrors: true,
  launchOptions: {
    args: [
      '--ignore-certificate-errors',
      '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults'
    ]
  }
}

/** Opens a page with the debug manifests and accepts SharePoint's prompt about them. */
export async function openWithLocalBundle(page: Page, pagePath: string) {
  await page.goto(`${pagePath}?loadSPFX=true&debugManifestsFile=${encodeURIComponent(manifests)}`)
  const allow = page.getByRole('button', {
    name: /^load debug scripts$|^last inn feilsøkingsskript$/i
  })
  await allow.waitFor({ state: 'visible', timeout: 60_000 }).catch(() => undefined)
  if (await allow.isVisible().catch(() => false)) await allow.click()
}

/** The bundles the page loaded from the dev server; empty means the deployed build was measured. */
export function localBundles(page: Page) {
  return page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => /^https:\/\/localhost:4321\/dist\//.test(name))
  )
}
