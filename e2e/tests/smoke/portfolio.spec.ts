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
  overview: candidates(process.env.E2E_PAGE_OVERVIEW, 'Porteføljeoversikt.aspx', 'PortfolioOverview.aspx'),
  projectStatus: candidates(process.env.E2E_PAGE_PROJECT_STATUS, 'Prosjektstatus.aspx', 'ProjectStatus.aspx'),
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
    await expect.poll(async () => page.locator(WEB_PART).count(), { timeout: 60_000 }).toBeGreaterThanOrEqual(2)
  })

  test('portfolio overview renders its list', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(hub, PAGES.overview))
    await expect(webPart(page, /porteføljeoversikt|portfolio overview/i).first()).toBeVisible()
    // The overview renders a Fluent list; grid/table are its stable roles.
    await expect(page.getByRole('grid').or(page.getByRole('table')).first()).toBeVisible({ timeout: 60_000 })
  })

  test('project status aggregation page loads', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(hub, PAGES.projectStatus))
    await expect(webPart(page, /status/i).first()).toBeVisible()
  })

  test('project timeline page loads', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(hub, PAGES.timeline))
    await expect(webPart(page, /tidslinje|timeline/i).first()).toBeVisible()
  })

  test('benefit overview page loads', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(hub, PAGES.benefits))
    await expect(webPart(page, /nytte|benefit/i).first()).toBeVisible()
  })

  test('footer application customizer renders the version', async ({ page, openPage, resolvePage }) => {
    await openPage(await resolvePage(hub, PAGES.home))
    // PortfolioExtensions' footer shows the installed version on every hub page, so it doubles as
    // the extension bundle check.
    await expect(page.getByText(/versjon|version/i).first()).toBeVisible({ timeout: 60_000 })
  })
})
