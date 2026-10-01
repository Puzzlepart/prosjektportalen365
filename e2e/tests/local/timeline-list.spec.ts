import { configuredUrl, expect, test } from '../fixtures/pp365'
import { localBundleUse, localBundles, openWithLocalBundle } from '../fixtures/local-bundle'
import { expectListToFitContainer, measureTimelineList } from '../fixtures/timeline-list'

/**
 * The timeline list measured with the *local* ProjectWebParts bundle loaded onto the real page
 * through SPFx's debug manifests, which is how a fix is checked on the tenant before it is
 * deployed. Opt in with E2E_LOCAL_BUNDLE=1 while `npx heft start --nobrowser` serves the solution
 * on https://localhost:4321; ignored otherwise (see playwright.config.ts).
 */
const siteUrl = configuredUrl(process.env.E2E_LOCAL_SITE_URL ?? process.env.E2E_PROJECT_URL)

test.use(localBundleUse)

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
