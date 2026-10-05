import { readFileSync } from 'node:fs'
import { baseURL } from '../../playwright.config'
import { WEB_PART, expect, test, webPart } from '../fixtures/pp365'

/**
 * Read-only smoke of the portfolio hub: the pages load, the SPFx canvas renders, the web parts the
 * test channel deploys mount, and the browser reports no missing-module errors.
 *
 * Page names differ between Norwegian and English provisioning, so each test resolves its page from
 * the hub's own SitePages library (first existing candidate wins; E2E_PAGE_* overrides come first)
 * and skips with the list of existing pages when none matches.
 */
const hub = baseURL.replace(/\/+$/, '')
const candidates = (override: string | undefined, ...names: string[]) =>
  override ? [override.replace(/^SitePages\//i, ''), ...names] : names

const PAGES = {
  home: candidates(process.env.E2E_PAGE_HOME, 'Home.aspx', 'Hjem.aspx'),
  overview: candidates(
    process.env.E2E_PAGE_OVERVIEW,
    'Porteføljeoversikt.aspx',
    'PortfolioOverview.aspx'
  ),
  // The hub has no status page of its own; the aggregation web part sits on the delivery, the
  // uncertainty and the experience-log pages, which the hub template provisions.
  aggregation: candidates(
    process.env.E2E_PAGE_AGGREGATION,
    'Leveranseoversikt.aspx',
    'DeliveryOverview.aspx',
    'Usikkerhetsoversikt.aspx',
    'UncertaintyOverview.aspx',
    'Erfaringslogg.aspx',
    'ExperienceLog.aspx'
  ),
  timeline: candidates(
    process.env.E2E_PAGE_TIMELINE,
    'Prosjekttidslinje.aspx',
    'ProjectTimeline.aspx',
    'Tidslinje.aspx',
    'Timeline.aspx'
  ),
  benefits: candidates(
    process.env.E2E_PAGE_BENEFITS,
    'Nytteoversikt.aspx',
    'Gevinstoversikt.aspx',
    'BenefitOverview.aspx'
  )
}

test.describe('portfolio hub', () => {
  test('home page mounts its web parts', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(hub, PAGES.home))
    await expect(page).toHaveTitle(/.+/)
    // Home is a canvas page with several PP365 web parts (latest projects, project list, news).
    await expect
      .poll(async () => page.locator(WEB_PART).count(), { timeout: 60_000 })
      .toBeGreaterThanOrEqual(2)
  })

  test('portfolio overview renders its list', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(hub, PAGES.overview))
    await expect(webPart(page, /porteføljeoversikt|portfolio overview/i).first()).toBeVisible()
    // The overview renders a Fluent list; grid/table are its stable roles.
    await expect(page.getByRole('grid').or(page.getByRole('table')).first()).toBeVisible({
      timeout: 60_000
    })
    // Searching narrows the list: the results counter reports 0 of N for a nonsense term. This
    // exercises the toolbar (a covered or dead search box fails the fill) and the list binding.
    // Scoped to the web part: the page also has SharePoint's suite bar search box.
    const overview = page.locator(WEB_PART).first()
    const search = overview
      .getByRole('searchbox')
      .or(overview.getByPlaceholder(/søk|search/i))
      .first()
    await search.fill('zzz-e2e-ingen-treff')
    await expect(overview.getByText(/^viser 0 av \d+|^showing 0 of \d+/i)).toBeVisible({
      timeout: 20_000
    })
    await search.clear()
    // The filter panel is wired through a props object that the toolbar spreads, which type
    // checking does not see into, so only opening it here proves the wiring survives a rename.
    await overview.getByRole('button', { name: /^filtrer$|^filter$/i }).click()
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: /^filtr|^filter/i })
    ).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('portfolio overview exports its list to an Excel file', async ({
    page,
    openPage,
    resolvePage
  }) => {
    await openPage(await resolvePage(hub, PAGES.overview))
    const overview = page.locator(WEB_PART).first()
    await expect(overview.getByRole('grid').or(overview.getByRole('table')).first()).toBeVisible({
      timeout: 60_000
    })
    // The button is a web part property ("Vis eksport til Excel-knapp"). The hub template turns it
    // on, but an installation can have it off, so it is looked for once the toolbar has rendered.
    await expect(overview.getByRole('toolbar').first().getByRole('button').first()).toBeVisible({
      timeout: 30_000
    })
    const exportButton = overview.getByRole('button', {
      name: /^eksporter til excel$|^export to excel$/i
    })
    test.skip(
      (await exportButton.count()) === 0,
      'The overview shows no export button: turn on "Vis eksport til Excel-knapp" in its properties'
    )
    // Only here does the export run as users run it: the browser takes SheetJS's ES module build
    // through webpack, while Jest takes its CommonJS build in Node.
    const download = page.waitForEvent('download')
    await exportButton.first().click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(/\.xlsx$/)
    // An xlsx file is a ZIP package. The entry names are stored uncompressed, whichever way the
    // parts themselves are compressed, so the workbook and its first sheet can be found as text.
    const bytes = readFileSync(await file.path())
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('PK\u0003\u0004')
    expect(bytes.includes('xl/workbook.xml')).toBe(true)
    expect(bytes.includes('xl/worksheets/sheet1.xml')).toBe(true)
  })

  test('portfolio aggregation page mounts its web part', async ({
    page,
    openPage,
    resolvePage
  }) => {
    await openPage(await resolvePage(hub, PAGES.aggregation))
    // A single web part page, so no feature tag to find the web part by: it is the one mounted
    // web part, past its loading state when its list (a grid) or, with nothing to aggregate, the
    // message shows.
    const aggregation = page.locator(WEB_PART).first()
    await expect(
      aggregation
        .getByRole('grid')
        .or(aggregation.getByText(/ingen|no items|fant ingen/i))
        .first()
    ).toBeVisible({ timeout: 60_000 })
  })

  test('project timeline page loads and its controls can be reached', async ({
    page,
    openPage,
    resolvePage
  }) => {
    await openPage(await resolvePage(hub, PAGES.timeline))
    await expect(webPart(page, /tidslinje|timeline/i).first()).toBeVisible()
    // The timeline is react-calendar-timeline; its group list holds one link per project. A trial
    // click runs Playwright's actionability checks (visible, stable, not covered by another
    // element) without navigating, which is exactly what a stylesheet or z-index regression breaks:
    // when the library's CSS lost its class names, the header covered these links.
    const firstProjectLink = page.locator('.react-calendar-timeline a[href]').first()
    await expect(firstProjectLink).toBeVisible({ timeout: 60_000 })
    await firstProjectLink.click({ trial: true })
    // The filter toolbar button must open its panel and close again.
    await page
      .locator(WEB_PART)
      .first()
      .getByRole('button', { name: /^filtrer$|^filter$/i })
      .click()
    // The filter panel's own root has no box, so the visible proof is its heading.
    // The level is deliberately not asserted: it is the panel implementation's
    // choice (v8 rendered an h1, the v9 drawer renders an h2) and not a contract.
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: /^filtr|^filter/i })
    ).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('benefit overview page loads', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(hub, PAGES.benefits))
    await expect(webPart(page, /nytte|benefit/i).first()).toBeVisible()
    await page
      .locator(WEB_PART)
      .first()
      .getByRole('button', { name: /^filtrer$|^filter$/i })
      .click()
    // The filter panel's own root has no box, so the visible proof is its heading.
    // The level is deliberately not asserted: it is the panel implementation's
    // choice (v8 rendered an h1, the v9 drawer renders an h2) and not a contract.
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: /^filtr|^filter/i })
    ).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('footer application customizer renders the version', async ({
    page,
    openPage,
    resolvePage
  }) => {
    await openPage(await resolvePage(hub, PAGES.home))
    // PortfolioExtensions' footer shows the installed version on every hub page, so it doubles as
    // the extension bundle check.
    await expect(page.getByText(/versjon|version/i).first()).toBeVisible({ timeout: 60_000 })
  })
})
