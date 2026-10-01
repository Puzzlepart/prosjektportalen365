import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test } from '../fixtures/pp365'
import {
  deleteOwnDraftReports,
  deleteReportButton,
  describeBlockingDrafts,
  newReportButton,
  statusWebPart
} from '../fixtures/status-report'

/**
 * A write flow on a project: a new status report draft is created from the status page's toolbar,
 * the edit panel opens for it, and the draft is deleted again from the same toolbar. The hub's
 * status list is cleaned of the test user's leftover drafts for the project before and after.
 *
 * Needs the test user to have the project's admin permission, since "Opprett" and "Slett" are
 * offered to admins only; skips with a message otherwise.
 */
// A new draft copies the last report's values, which is what satisfies the form's required fields,
// so the test project must have a published report; without one the save stays disabled.
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const hubUrl = baseURL.replace(/\/+$/, '').toLowerCase()
const pointsAtHub = !!projectUrl && projectUrl.toLowerCase() === hubUrl

test.describe('status report draft', () => {
  test.skip(
    !projectUrl,
    'E2E_PROJECT_URL is not set (or is the .env.example placeholder); skipping'
  )
  test.skip(
    pointsAtHub,
    `E2E_PROJECT_URL points at the hub (${projectUrl}); set it to a project site`
  )

  test('a draft is created from the toolbar and deleted again', async ({
    page,
    openPage,
    resolvePage
  }) => {
    test.setTimeout(240_000)
    const started = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const pagePath = await resolvePage(projectUrl!, [
      'Prosjektstatus.aspx',
      'ProjectStatus.aspx',
      'Status.aspx'
    ])
    await openPage(pagePath)
    // Leftovers of an earlier run would keep "Opprett" disabled (one draft at a time).
    if ((await deleteOwnDraftReports(page, projectUrl!, started)) > 0) await openPage(pagePath)
    let webPart = await statusWebPart(page)
    const create = newReportButton(webPart)
    await expect(create).toBeVisible({ timeout: 60_000 })
    if (!(await create.isEnabled())) {
      const blocking = await describeBlockingDrafts(page, projectUrl!)
      test.skip(
        true,
        blocking
          ? `a draft keeps "Opprett" disabled: ${blocking} in the hub's status list; publish or delete it, or point E2E_PROJECT_URL at another project with reports`
          : 'the test user may not create reports here (no admin permission on the project)'
      )
    }

    try {
      await create.click()
      // "Opprett" opens the edit panel with the draft's properties; saving the panel is what
      // creates the report in the hub's list, so the panel is saved as it is.
      const panel = page
        .getByRole('dialog')
        .filter({ hasText: /ny statusrapport|new status report/i })
        .first()
      await expect(panel).toBeVisible({ timeout: 60_000 })
      const save = panel.getByRole('button', { name: /^lagre$|^save$/i })
      if (!(await save.isEnabled({ timeout: 10_000 }).catch(() => false))) {
        await page.keyboard.press('Escape')
        test.skip(
          true,
          'the new draft has required fields with no value to copy from an earlier report, so it cannot be saved here; point E2E_PROJECT_URL at a project with reports'
        )
      }
      await save.click()
      await expect(panel).toBeHidden({ timeout: 60_000 })

      webPart = await statusWebPart(page)
      await expect(create, 'a draft exists, so no second one can be created').toBeDisabled({
        timeout: 30_000
      })
      const remove = deleteReportButton(webPart)
      await expect(remove).toBeEnabled({ timeout: 30_000 })
      await remove.click()
      await expect(
        newReportButton(await statusWebPart(page)),
        'the draft is gone, so a new one can be created'
      ).toBeEnabled({ timeout: 60_000 })
    } finally {
      await deleteOwnDraftReports(page, projectUrl!, started)
    }
  })
})
