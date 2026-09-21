import { expect, test, webPart } from '../fixtures/pp365'

/**
 * Read-only smoke of one provisioned project site. E2E_PROJECT_URL must point at an existing,
 * fully set up project in the test tenant (project setup itself is a write flow and is not part
 * of the smoke suite yet). Skipped with a clear message when the variable is missing.
 */
const projectUrl = process.env.E2E_PROJECT_URL

test.describe('project site', () => {
  test.skip(!projectUrl, 'E2E_PROJECT_URL is not set; skipping project site smoke tests')

  test('project home renders project information and phases', async ({ page, openPage }) => {
    await openPage(`${projectUrl!.replace(/\/+$/, '')}/SitePages/ProjectHome.aspx`)
    await expect(webPart(page, /prosjektinformasjon|project information/i).first()).toBeVisible()
    await expect(webPart(page, /fase|phase/i).first()).toBeVisible()
  })

  test('project status page renders', async ({ page, openPage }) => {
    await openPage(`${projectUrl!.replace(/\/+$/, '')}/SitePages/Prosjektstatus.aspx`)
    await expect(webPart(page, /status/i).first()).toBeVisible()
  })

  test('tasks page renders the dynamic list', async ({ page, openPage }) => {
    await openPage(`${projectUrl!.replace(/\/+$/, '')}/SitePages/Oppgaver.aspx`)
    await expect(page.getByRole('grid').or(page.getByRole('table')).first()).toBeVisible({ timeout: 60_000 })
  })
})
