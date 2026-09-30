import { configuredUrl, expect, test } from '../fixtures/pp365'
import { expectListToFitContainer, measureTimelineList } from '../smoke/timeline-list.spec'

/**
 * The timeline list measured with the *local* ProjectWebParts bundle loaded onto the real page
 * through SPFx's debug manifests, which is how a fix is checked on the tenant before it is
 * deployed. Opt in with E2E_LOCAL_BUNDLE=1 while `npx heft start --nobrowser` serves the solution
 * on https://localhost:4321; ignored otherwise (see playwright.config.ts).
 */
const siteUrl = configuredUrl(process.env.E2E_LOCAL_SITE_URL ?? process.env.E2E_PROJECT_URL)
const manifests = process.env.DEBUG_MANIFESTS ?? 'https://localhost:4321/temp/build/manifests.js'

// The dev certificate is self-signed, and recent Chromium gates a public site's requests to
// localhost behind a local-network-access check that automation denies by default.
test.use({
  ignoreHTTPSErrors: true,
  launchOptions: {
    args: [
      '--ignore-certificate-errors',
      '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults'
    ]
  }
})

/** Opens a page with the debug manifests and accepts SharePoint's prompt about them. */
export async function openWithLocalBundle(page: import('@playwright/test').Page, pagePath: string) {
  await page.goto(`${pagePath}?loadSPFX=true&debugManifestsFile=${encodeURIComponent(manifests)}`)
  const allow = page.getByRole('button', {
    name: /^load debug scripts$|^last inn feilsøkingsskript$/i
  })
  await allow.waitFor({ state: 'visible', timeout: 60_000 }).catch(() => undefined)
  if (await allow.isVisible().catch(() => false)) await allow.click()
}

/** The bundles the page loaded from the dev server; empty means the deployed build was measured. */
export function localBundles(page: import('@playwright/test').Page) {
  return page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => /^https:\/\/localhost:4321\/dist\//.test(name))
  )
}

test.describe('project timeline list, local bundle', () => {
  test.skip(!siteUrl, 'E2E_LOCAL_SITE_URL or E2E_PROJECT_URL must point at a project site')

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1920, height: 1080 }
  ]) {
    test(`fits the web part at ${viewport.width}px`, async ({ page, resolvePage }, testInfo) => {
      await page.setViewportSize(viewport)
      await openWithLocalBundle(
        page,
        await resolvePage(siteUrl!, [
          'Prosjekttidslinje.aspx',
          'ProjectTimeline.aspx',
          'Tidslinje.aspx'
        ])
      )
      const metrics = await measureTimelineList(page)
      const bundles = await localBundles(page)
      await testInfo.attach('metrics.json', {
        body: JSON.stringify({ ...metrics, bundles }, null, 2),
        contentType: 'application/json'
      })
      expect(bundles.length, 'the local bundle should be the one loaded').toBeGreaterThan(0)
      expectListToFitContainer(metrics)
    })
  }
})
