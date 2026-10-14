import { baseURL } from '../../playwright.config'
import { WEB_PART, configuredUrl, expect, test, webPartByAlias } from '../fixtures/pp365'
import { restGet } from '../fixtures/rest'

/**
 * The ways a user moves through the portal: from the hub's overview into a project and back, between
 * the status page's sections through its pinned tabs, and across a project's pages. Read only.
 */
const hub = baseURL.replace(/\/+$/, '')
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const pointsAtHub = !!projectUrl && projectUrl.toLowerCase() === hub.toLowerCase()

test.describe('navigation', () => {
  test('from the overview into a project and back', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(hub, ['Porteføljeoversikt.aspx', 'PortfolioOverview.aspx']))
    const grid = page.getByRole('grid').or(page.getByRole('table')).first()
    await expect(grid).toBeVisible({ timeout: 60_000 })
    // The title column links to the project site.
    const projectLink = grid.locator('a[href*="/sites/"]').first()
    await expect(projectLink).toBeVisible({ timeout: 60_000 })
    const href = await projectLink.getAttribute('href')
    expect(href).toBeTruthy()
    await projectLink.click()
    await page.waitForURL(
      (url) =>
        url.href
          .toLowerCase()
          .startsWith(new URL(href!, hub).href.toLowerCase().replace(/\/(sitepages\/.*)?$/i, '')),
      { timeout: 60_000 }
    )
    await expect(page.locator(WEB_PART).first()).toBeVisible({ timeout: 60_000 })
    await page.goBack()
    await expect(page.getByRole('grid').or(page.getByRole('table')).first()).toBeVisible({
      timeout: 60_000
    })
  })

  test.describe('in a project', () => {
    test.skip(
      !projectUrl,
      'E2E_PROJECT_URL is not set (or is the .env.example placeholder); skipping'
    )
    test.skip(
      pointsAtHub,
      `E2E_PROJECT_URL points at the hub (${projectUrl}); set it to a project site`
    )

    test('the status page tabs scroll to their sections and stay pinned', async ({
      page,
      openPage,
      resolvePage
    }) => {
      // The sections, and so the tabs, only show for a project with a published report.
      await openPage(
        await resolvePage(projectUrl!, ['Prosjektstatus.aspx', 'ProjectStatus.aspx', 'Status.aspx'])
      )
      const tabs = page.getByRole('tab')
      // The report loads after the web part mounts; the tabs come with it.
      await tabs
        .first()
        .waitFor({ state: 'visible', timeout: 30_000 })
        .catch(() => undefined)
      test.skip(
        (await tabs.count()) < 2,
        'the project has no published report with sections, so there are no tabs'
      )
      // A tab scrolls to the section element whose id is the section's id behind the language's
      // prefix (`seksjon12`, `section12`); the tab is a button whose `value` is that id. Finding
      // the section by its title instead picked a status field's label of the same name lower on
      // the page, out of view once the page had scrolled (run 38516321658); the tab's own text is
      // no key either, since Fluent renders it twice ("FremdriftFremdrift").
      const section = async (tab: typeof tabs) => {
        const id = await tab.getAttribute('value')
        expect(id, 'the tab carries its section id').toBeTruthy()
        return page.locator(`[id="seksjon${id}"], [id="section${id}"]`).first()
      }
      // The tabs that fit; the ones that do not sit behind the overflow menu's own tab.
      const shown = tabs
        .and(page.locator('[role="tab"][value]:not([value="overflow-menu"])'))
        .filter({ visible: true })
      const last = shown.last()
      // The sections fill in after the tabs appear, each pushing the ones below it down, so a tab
      // clicked before then scrolls to where its section was and the section moves on out of view
      // (CI run 37107937758). A user reads the page first; the test waits until the section the
      // last tab names has stopped moving and the page has stopped growing: a list section that
      // finished loading between two looks at the last section still moved it (run 38429925362).
      const target = await section(last)
      const layout = async () => ({
        section: await target.boundingBox(),
        height: await page.evaluate(() => document.documentElement.scrollHeight)
      })
      await expect(async () => {
        const before = await layout()
        await page.waitForTimeout(1_500)
        expect(before.section).not.toBeNull()
        expect(await layout()).toEqual(before)
      }).toPass({ timeout: 45_000 })
      await last.click()
      // The section the tab names scrolls into view, and the tab list stays where it is.
      await expect(target).toBeInViewport({ timeout: 10_000 })
      await expect(shown.first()).toBeInViewport()
      await shown.first().click()
      await expect(await section(shown.first())).toBeInViewport({ timeout: 10_000 })
    })

    test('every page in the project navigation opens', async ({ page }) => {
      test.setTimeout(300_000)
      // The quick launch, as SharePoint has it: pages and list views alike.
      const response = await restGet(
        page,
        `${projectUrl}/_api/web/Navigation/QuickLaunch?$select=Title,Url,Children/Title,Children/Url&$expand=Children`
      )
      expect(response.ok(), `quick launch: HTTP ${response.status()}`).toBe(true)
      type Node = { Title: string; Url: string; Children?: Node[] }
      const nodes = ((await response.json()) as { value: Node[] }).value.flatMap((n) => [
        n,
        ...(n.Children ?? [])
      ])
      const origin = new URL(projectUrl!).origin
      const sitePath = new URL(projectUrl!).pathname.toLowerCase()
      const links = nodes
        .map((n) => ({ title: n.Title, url: new URL(n.Url, origin).href }))
        .filter((l) => l.url.toLowerCase().startsWith(origin.toLowerCase() + sitePath + '/'))
        .filter((l) => !/\/_layouts\/|viewlsts\.aspx/i.test(l.url))
      expect(links.length, 'the navigation should have links into the site').toBeGreaterThan(0)
      for (const link of links) {
        await test.step(link.title, async () => {
          const result = await page.goto(link.url, { timeout: 90_000 })
          expect
            .soft(result?.status(), `${link.title} answered HTTP ${result?.status()}`)
            .toBeLessThan(400)
          // A web part page shows its web parts, a list view its list; neither shows an error boundary.
          await expect
            .soft(
              page
                .locator(
                  '[data-sp-web-part-id], [role="grid"], [role="table"], [data-automationid="DetailsList"]'
                )
                .first(),
              `${link.title} should show a web part or a list`
            )
            // A list view on a cold site can take more than a minute to render its rows.
            .toBeVisible({ timeout: 90_000 })
          await expect
            .soft(
              page.getByRole('heading', { name: /noe gikk galt|something went wrong/i }),
              `${link.title} rendered an error boundary`
            )
            .toHaveCount(0)
        })
      }
    })

    test('the project home links back to the hub', async ({ page, openPage, resolvePage }) => {
      // Two cold pages, the project's and the hub's, each up to a minute and a half under load.
      test.setTimeout(240_000)
      await openPage(await resolvePage(projectUrl!, ['ProjectHome.aspx', 'Hjem.aspx', 'Home.aspx']))
      await expect(webPartByAlias(page, 'ProjectInformation').first()).toBeVisible({
        timeout: 90_000
      })
      // The hub's name in SharePoint's hub navigation leads back to the hub.
      const hubLink = page
        .locator('a[href]')
        .filter({ has: page.locator(':scope') })
        .filter({ hasText: /prosjektportalen/i })
        .first()
      await expect(hubLink).toBeVisible({ timeout: 60_000 })
      await hubLink.click()
      await page.waitForURL((url) => url.href.toLowerCase().startsWith(hub.toLowerCase()), {
        timeout: 90_000
      })
      await expect(page.locator(WEB_PART).first()).toBeVisible({ timeout: 90_000 })
    })
  })
})
