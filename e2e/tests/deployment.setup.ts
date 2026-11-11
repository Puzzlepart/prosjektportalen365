import { expect, test as setup } from '@playwright/test'
import { baseURL } from '../playwright.config'
import { configuredUrl } from './fixtures/pp365'

/**
 * Waits until the tenant serves the apps the run just upgraded. For a few minutes after an
 * upgrade, SharePoint can still hand a page a component's previous manifest, whose bundle the
 * upgrade has removed from the app catalog: the page then logs "Could not load <component> in
 * require" (CI run 37107937758, the template selector's command set on the project home, three
 * minutes after the upgrade). The hub and the project home are loaded until no bundle from the
 * app catalog fails, for at most ten minutes; one still failing after that is a broken
 * deployment, and the run stops here with its address.
 */
setup('the upgraded apps are served', async ({ page }) => {
  setup.setTimeout(12 * 60_000)
  const failed = new Set<string>()
  const fromAppCatalog = (url: string) => url.includes('/ClientSideAssets/')
  page.on('requestfailed', (request) => {
    // Leaving a page cancels what it still loads; that is not a missing bundle.
    if (fromAppCatalog(request.url()) && request.failure()?.errorText !== 'net::ERR_ABORTED') {
      failed.add(request.url())
    }
  })
  page.on('response', (response) => {
    if (fromAppCatalog(response.url()) && response.status() >= 400) failed.add(response.url())
  })
  const project = configuredUrl(process.env.E2E_PROJECT_URL)
  const pages = [baseURL, ...(project ? [`${project}/`] : [])]
  await expect(async () => {
    failed.clear()
    for (const url of pages) {
      await page.goto(url, { waitUntil: 'load', timeout: 90_000 })
      // Extensions and list view command sets load their bundles after the page has loaded.
      await page.waitForTimeout(10_000)
    }
    expect([...failed], 'bundles the tenant points at but cannot serve').toEqual([])
  }).toPass({ timeout: 10 * 60_000, intervals: [30_000] })
})
