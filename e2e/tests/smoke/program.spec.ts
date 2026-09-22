import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test, webPart } from '../fixtures/pp365'

/**
 * Read-only smoke of one program site. E2E_PROGRAM_URL must point at an existing program in the
 * test tenant with at least one child project. ProgramWebParts was the one solution the suite never
 * opened before Phase 3; deeper interaction tests for it belong to slice 3b of the Fluent v9 plan.
 * Skipped with a clear message when the variable is missing, is the .env.example placeholder, or
 * points at the hub.
 */
const programUrl = configuredUrl(process.env.E2E_PROGRAM_URL)
const hubUrl = baseURL.replace(/\/+$/, '').toLowerCase()
const pointsAtHub = !!programUrl && programUrl.toLowerCase() === hubUrl

test.describe('program site', () => {
  test.skip(!programUrl, 'E2E_PROGRAM_URL is not set (or is the .env.example placeholder); skipping program site smoke tests')
  test.skip(pointsAtHub, `E2E_PROGRAM_URL points at the hub (${programUrl}); set it to a program site`)

  test('program home mounts its web parts', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(programUrl!, ['ProgramHome.aspx', 'Hjem.aspx', 'Home.aspx']))
    await expect(page.locator('[data-sp-web-part-id]').first()).toBeVisible()
  })

  test('program overview lists the child projects', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(programUrl!, ['ProgramOversikt.aspx', 'ProgramOverview.aspx']))
    // The program overview web part is titled "Oversikt over underområder" and reuses the
    // portfolio list: a grid with the results counter ("Viser N av N prosjekter").
    await expect(webPart(page, /underområder|child projects|program overview/i).first()).toBeVisible()
    await expect(page.getByRole('grid').or(page.getByRole('table')).first()).toBeVisible({ timeout: 60_000 })
    // The counter element has no box of its own on this page, so assert its text, not visibility.
    await expect(page.locator('[class*="resultsCount"]').first()).toHaveText(/viser [1-9]\d* av \d+|showing [1-9]\d* of \d+/i)
  })

  test('program timeline page loads', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(programUrl!, ['ProgramTidslinje.aspx', 'ProgramTimeline.aspx']))
    await expect(webPart(page, /tidslinje|timeline/i).first()).toBeVisible()
  })

  test('program status page loads', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(programUrl!, ['Status.aspx', 'ProgramStatus.aspx', 'Prosjektstatus.aspx', 'ProjectStatus.aspx']))
    await expect(page.locator('[data-sp-web-part-id]').first()).toBeVisible()
  })
})
