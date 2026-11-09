import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test, webPartByAlias } from '../fixtures/pp365'

/**
 * Read-only smoke of one provisioned project site. E2E_PROJECT_URL must point at an existing,
 * fully set up project in the test tenant (project setup itself is a write flow and is not part
 * of the smoke suite yet). Skipped with a clear message when the variable is missing or still
 * holds the placeholder from .env.example.
 *
 * Web parts are located by component alias (data-sp-feature-tag), because the PP365 project web
 * parts load their data before rendering any text, and the texts are phase names, not labels.
 */
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const hubUrl = baseURL.replace(/\/+$/, '').toLowerCase()
const pointsAtHub = !!projectUrl && projectUrl.toLowerCase() === hubUrl
const MOUNT_TIMEOUT = { timeout: 60_000 }

test.describe('project site', () => {
  test.skip(
    !projectUrl,
    'E2E_PROJECT_URL is not set (or is the .env.example placeholder); skipping project site smoke tests'
  )
  // The hub also has a ProjectHome.aspx (the page listing all projects), so pointing the variable
  // at the hub would run these tests against the wrong page and fail them for the wrong reason.
  test.skip(
    pointsAtHub,
    `E2E_PROJECT_URL points at the hub (${projectUrl}); set it to a provisioned project site`
  )

  test('project home mounts project information and lists the phases', async ({
    page,
    openPage,
    resolvePage
  }) => {
    await openPage(await resolvePage(projectUrl!, ['ProjectHome.aspx', 'Hjem.aspx', 'Home.aspx']))
    await expect(webPartByAlias(page, 'ProjectInformation').first()).toBeVisible(MOUNT_TIMEOUT)
    const phases = webPartByAlias(page, 'ProjectPhases')
    await expect(phases.first()).toBeVisible(MOUNT_TIMEOUT)
    // The phase selector renders a <ul class="phaseList_*"> with one <li> per phase from the term
    // set. An empty list means the phases did not load, which is a defect for the user even though
    // the web part itself mounted, so this stays strict.
    await expect(phases.locator('[class*="phaseList"] li').first()).toBeVisible(MOUNT_TIMEOUT)
    // Every phase must be clickable (trial click: actionability checks without opening the
    // change-phase dialog, which would be a write flow).
    for (const phase of await phases.locator('[class*="phaseList"] li').all()) {
      await phase.click({ trial: true })
    }
    // "Show all project information" opens a panel and is read only.
    await webPartByAlias(page, 'ProjectInformation')
      .getByRole('button', { name: /vis all prosjektinformasjon|show all project information/i })
      .click()
    // Scoped to the panel: the web part also renders a heading with this title.
    await expect(
      page
        .getByRole('dialog')
        .getByRole('heading', { name: /^prosjektinformasjon$|^project information$/i })
    ).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('the phases open from the keyboard, hold the focus while open and give it back (#1788)', async ({
    page,
    openPage,
    resolvePage
  }) => {
    await openPage(await resolvePage(projectUrl!, ['ProjectHome.aspx', 'Hjem.aspx', 'Home.aspx']))
    const list = webPartByAlias(page, 'ProjectPhases').getByRole('list', {
      name: /prosjektets faser|the project's phases/i
    })
    await expect(list).toBeVisible(MOUNT_TIMEOUT)
    // Each phase is a button in its list item, and the current phase is the current step.
    await expect(list.locator('li > button[aria-current="step"]')).toHaveCount(1)
    const phase = list.getByRole('button').first()
    await phase.focus()
    await page.keyboard.press('Enter')
    const details = page.locator('.fui-PopoverSurface[role="dialog"]')
    await expect(details).toBeVisible()
    // Tab used to leave the open phase for the top of the page, leaving it open behind. It stays
    // in the phase now, or leaves the page for the browser's own controls, never for the page.
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab')
      const where = await page.evaluate(() => {
        const active = document.activeElement
        if (!active || active === document.body || active.hasAttribute('data-tabster-dummy'))
          return 'browser'
        return active.closest('.fui-PopoverSurface')
          ? 'phase'
          : `page: ${active.tagName} ${(active.textContent ?? '').trim().slice(0, 40)}`
      })
      expect(where, 'Tab in an open phase goes to the page behind it').not.toMatch(/^page/)
    }
    await page.keyboard.press('Escape')
    await expect(details).toBeHidden()
    await expect(phase).toBeFocused()
  })

  test('project status page mounts its web part', async ({ page, openPage, resolvePage }) => {
    // Prosjektstatus.aspx is a single web part app page: SharePoint sets no data-sp-feature-tag
    // there, so the mount is asserted through the generic web part container (openPage does that).
    // Content is not asserted yet: what the web part shows depends on published reports.
    await openPage(
      await resolvePage(projectUrl!, ['Prosjektstatus.aspx', 'ProjectStatus.aspx', 'Status.aspx'])
    )
    await expect(page.locator('[data-sp-web-part-id]')).toHaveCount(1)
  })

  test('tasks page renders the Planner board', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(projectUrl!, ['Oppgaver.aspx', 'Tasks.aspx']))
    // Oppgaver.aspx hosts Microsoft's Planner web part: a board with one column heading per bucket.
    await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible(MOUNT_TIMEOUT)
  })
})
