import { expect, test, webPart } from '../fixtures/pp365'

/**
 * Read-only smoke of the portfolio hub: the pages load, the SPFx canvas renders, the web parts the
 * test channel deploys mount, and the browser reports no missing-module errors. Page names are the
 * ones the portfolio template provisions (Templates/Portfolio); an English-provisioned hub can be
 * pointed at with E2E_PAGE_* overrides.
 */
const PAGES = {
  home: process.env.E2E_PAGE_HOME ?? 'SitePages/Hjem.aspx',
  projectStatus: process.env.E2E_PAGE_PROJECT_STATUS ?? 'SitePages/Prosjektstatus.aspx',
  timeline: process.env.E2E_PAGE_TIMELINE ?? 'SitePages/Prosjekttidslinje.aspx',
  benefits: process.env.E2E_PAGE_BENEFITS ?? 'SitePages/Nytteoversikt.aspx'
}

test.describe('portfolio hub', () => {
  test('home page renders the portfolio overview', async ({ page, openPage }) => {
    await openPage(PAGES.home)
    await expect(page).toHaveTitle(/.+/)
    // The portfolio overview renders a command bar with the view selector and a list; both are
    // Fluent UI controls with stable roles.
    await expect(page.getByRole('grid').or(page.getByRole('table')).first()).toBeVisible({ timeout: 60_000 })
  })

  test('project status aggregation page loads', async ({ page, openPage }) => {
    await openPage(PAGES.projectStatus)
    await expect(webPart(page, /status/i).first()).toBeVisible()
  })

  test('project timeline page loads', async ({ page, openPage }) => {
    await openPage(PAGES.timeline)
    await expect(webPart(page, /tidslinje|timeline/i).first()).toBeVisible()
  })

  test('benefit overview page loads', async ({ page, openPage }) => {
    await openPage(PAGES.benefits)
    await expect(webPart(page, /nytte|benefit/i).first()).toBeVisible()
  })

  test('footer application customizer renders the version', async ({ page, openPage }) => {
    await openPage(PAGES.home)
    // PortfolioExtensions' footer shows the installed version; it is the only extension that
    // renders on every hub page, so it doubles as the extension bundle check.
    await expect(page.getByText(/versjon|version/i).first()).toBeVisible({ timeout: 60_000 })
  })
})
