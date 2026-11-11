import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test } from '../fixtures/pp365'
import { publishedSnapshots, snapshotJourney } from '../fixtures/status-report'

/**
 * The snapshot of a published status report, read-only (`snapshotJourney`): opened from the
 * toolbar in a dialog that fills the window, full screen where the browser allows it, its link
 * copied and opening the page with the snapshot shown, and the image file in a new tab.
 *
 * Publishing cannot be undone from the page, so the flow reads a report that is published already,
 * and skips with a message when the test project has none with a snapshot.
 */
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const hubUrl = baseURL.replace(/\/+$/, '').toLowerCase()
const pointsAtHub = !!projectUrl && projectUrl.toLowerCase() === hubUrl

test.describe('status report snapshot', () => {
  test.skip(
    !projectUrl,
    'E2E_PROJECT_URL is not set (or is the .env.example placeholder); skipping'
  )
  test.skip(
    pointsAtHub,
    `E2E_PROJECT_URL points at the hub (${projectUrl}); set it to a project site`
  )

  test('the snapshot opens in a dialog, its link is copied, and the link opens it again', async ({
    page,
    openPage,
    resolvePage
  }) => {
    test.setTimeout(240_000)
    const snapshots = await publishedSnapshots(page, projectUrl!)
    test.skip(
      snapshots.length === 0,
      'the test project has no published report with a snapshot; publish one by hand (no flow publishes, since publishing cannot be undone from the page)'
    )
    expect(snapshots[0].reportId).toBeGreaterThan(0)
    const pagePath = await resolvePage(projectUrl!, [
      'Prosjektstatus.aspx',
      'ProjectStatus.aspx',
      'Status.aspx'
    ])
    await snapshotJourney(page, snapshots[0], pagePath, openPage)
  })
})
