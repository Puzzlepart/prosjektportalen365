import { baseURL } from '../../playwright.config'
import { scanAccessibility } from '../fixtures/a11y'
import { expectCompactCommandBar } from '../fixtures/lists'
import { localBundleUse, localBundles, openWithLocalBundle } from '../fixtures/local-bundle'
import { configuredUrl, expect, test, webPart } from '../fixtures/pp365'

/** Read-only checks of the compact overview headers with the local PortfolioWebParts bundle. */
const hub = baseURL.replace(/\/+$/, '')
const project = configuredUrl(process.env.E2E_PROJECT_URL)
const overviews = [
  {
    name: 'portfolio overview',
    site: () => hub,
    alias: 'PortfolioOverviewWebPart',
    bundle: 'portfolio-overview-web-part',
    title: /porteføljeoversikt|portfolio overview/i,
    hasSearch: true,
    pages: ['Porteføljeoversikt.aspx', 'PortfolioOverview.aspx']
  },
  {
    name: 'aggregated overview',
    site: () => hub,
    alias: 'PortfolioAggregationWebPart',
    bundle: 'portfolio-aggregation-web-part',
    title: /leveranseoversikt|delivery overview|nytteoversikt|benefit overview/i,
    hasSearch: true,
    pages: ['Leveranseoversikt.aspx', 'DeliveryOverview.aspx', 'Nytteoversikt.aspx']
  },
  {
    name: 'benefit overview',
    site: () => hub,
    alias: 'PortfolioAggregationWebPart',
    bundle: 'portfolio-aggregation-web-part',
    title: /nytteoversikt|gevinstoversikt|benefit overview/i,
    hasSearch: true,
    pages: ['Nytteoversikt.aspx', 'Gevinstoversikt.aspx', 'BenefitOverview.aspx']
  },
  {
    name: 'project benefit overview',
    site: () => project,
    alias: 'PortfolioAggregationWebPart',
    bundle: 'portfolio-aggregation-web-part',
    title: /nytteoversikt|gevinstoversikt|benefit overview/i,
    hasSearch: true,
    pages: ['Nytteoversikt.aspx', 'Gevinstoversikt.aspx', 'BenefitOverview.aspx']
  },
  {
    name: 'portfolio timeline',
    site: () => hub,
    alias: 'PortfolioTimelineWebPart',
    bundle: 'project-timeline-web-part',
    title: /prosjekttidslinje|project timeline/i,
    hasSearch: false,
    pages: ['Prosjekttidslinje.aspx', 'ProjectTimeline.aspx', 'Tidslinje.aspx', 'Timeline.aspx']
  },
  {
    name: 'resource allocation',
    site: () => hub,
    alias: 'ResourceAllocationWebPart',
    bundle: 'resource-allocation-web-part',
    title: /ressursallokering|resource allocation/i,
    hasSearch: false,
    pages: ['Ressursallokering.aspx', 'ResourceAllocation.aspx']
  }
]

test.use(localBundleUse)

for (const overview of overviews) {
  test(`local: ${overview.name} keeps its title in the command bar`, async ({
    page,
    resolvePage
  }) => {
    test.setTimeout(180_000)
    const site = overview.site()
    test.skip(!site, `the site of the ${overview.name} is not configured`)
    await openWithLocalBundle(page, await resolvePage(site!, overview.pages))
    const part = webPart(page, overview.title).first()
    await expect(part.getByRole('heading', { level: 2 })).toBeVisible({ timeout: 60_000 })
    expect(
      (await localBundles(page)).some((url) => url.includes(`/dist/${overview.bundle}`)),
      'the page loaded this overview from the local bundle'
    ).toBe(true)
    if (overview.hasSearch) await expect(part.locator('.fui-SearchBox')).toBeVisible()
    await expectCompactCommandBar(part)
    await scanAccessibility(page, {
      component: overview.alias,
      include: ['[class*="commandBar_"]']
    })
  })
}
