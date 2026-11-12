import { scanAccessibility } from '../fixtures/a11y'
import { expectCompactCommandBar } from '../fixtures/lists'
import { localBundleUse, localBundles, openWithLocalBundle } from '../fixtures/local-bundle'
import { configuredUrl, expect, test, webPart } from '../fixtures/pp365'

/** Read-only check of the project timeline's spacing with the local ProjectWebParts bundle. */
const project = configuredUrl(process.env.E2E_PROJECT_URL)

test.use(localBundleUse)

test('local: the project timeline has the same compact top spacing as the overviews', async ({
  page,
  resolvePage
}) => {
  test.setTimeout(180_000)
  test.skip(!project, 'E2E_PROJECT_URL is not configured')
  await openWithLocalBundle(
    page,
    await resolvePage(project!, [
      'Prosjekttidslinje.aspx',
      'ProjectTimeline.aspx',
      'Tidslinje.aspx'
    ])
  )
  const timeline = webPart(page, /prosjekttidslinje|project timeline/i).first()
  await expect(timeline.getByRole('heading', { level: 2 })).toBeVisible({ timeout: 60_000 })
  expect(
    (await localBundles(page)).some((url) => url.includes('/dist/project-timeline-web-part')),
    'the page loaded the local project timeline bundle'
  ).toBe(true)
  await expectCompactCommandBar(timeline)
  await scanAccessibility(page, {
    component: 'ProjectTimelineWebPart',
    include: ['[class*="commandBar_"]']
  })
})
