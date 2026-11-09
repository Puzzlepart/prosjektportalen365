import { configuredUrl, expect, test } from '../fixtures/pp365'
import { localBundleUse, localBundles, openWithLocalBundle } from '../fixtures/local-bundle'
import { publishedSnapshots, snapshotJourney, statusWebPart } from '../fixtures/status-report'

/**
 * The status report snapshot flow with the *local* ProjectWebParts bundle loaded onto the
 * project's status page through SPFx's debug manifests. Opt in with E2E_LOCAL_BUNDLE=1 while
 * `npm run watch` serves ProjectWebParts on https://localhost:4321, built with the channel's ids.
 */
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)

test.use(localBundleUse)

test('local: the snapshot opens in a dialog, its link is copied, and the link opens it again', async ({
  page,
  resolvePage
}) => {
  test.setTimeout(240_000)
  test.skip(!projectUrl, 'E2E_PROJECT_URL is not set')
  const snapshots = await publishedSnapshots(page, projectUrl!)
  test.skip(
    snapshots.length === 0,
    'the test project has no published report with a snapshot; publish one by hand'
  )
  const pagePath = await resolvePage(projectUrl!, [
    'Prosjektstatus.aspx',
    'ProjectStatus.aspx',
    'Status.aspx'
  ])
  let checked = false
  await snapshotJourney(page, snapshots[0], pagePath, async (path) => {
    await openWithLocalBundle(page, path)
    if (checked) return
    await statusWebPart(page)
    expect(
      (await localBundles(page)).length,
      'the local bundle should be the one loaded'
    ).toBeGreaterThan(0)
    checked = true
  })
})
