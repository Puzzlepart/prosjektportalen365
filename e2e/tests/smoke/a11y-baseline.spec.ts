import { baseURL } from '../../playwright.config'
import { scanAccessibility, settleWebParts, waitForContent } from '../fixtures/a11y'
import { channelWebPartsOnPage, configuredUrl, test } from '../fixtures/pp365'

/**
 * Accessibility scans of the pages (#1788, docs/plans/universal-design-wcag.md): axe over every
 * PP365 web part of the channel under test on the pages the smoke suite opens, one test per page.
 * Read-only. Each web part's result is attached as `axe-<alias>.json` and counted in an `a11y`
 * annotation; the scans fail only for the web parts whose audit is done (`A11Y_BLOCKING` in
 * `fixtures/a11y.ts`). The dialogs, drawers and popovers are scanned by the specs that open them.
 * A page the site does not have is skipped with the pages it does have.
 */
const hub = baseURL.replace(/\/+$/, '')
const project = configuredUrl(process.env.E2E_PROJECT_URL)
const program = configuredUrl(process.env.E2E_PROGRAM_URL)

const PAGES: Array<{ name: string; site: () => string | undefined; pages: string[] }> = [
  { name: 'hub home', site: () => hub, pages: ['Home.aspx', 'Hjem.aspx'] },
  {
    name: 'portfolio overview',
    site: () => hub,
    pages: ['Porteføljeoversikt.aspx', 'PortfolioOverview.aspx']
  },
  {
    name: 'aggregated overview',
    site: () => hub,
    pages: ['Leveranseoversikt.aspx', 'DeliveryOverview.aspx', 'Usikkerhetsoversikt.aspx']
  },
  {
    name: 'benefit overview',
    site: () => hub,
    pages: ['Nytteoversikt.aspx', 'Gevinstoversikt.aspx', 'BenefitOverview.aspx']
  },
  {
    name: 'portfolio timeline',
    site: () => hub,
    pages: ['Prosjekttidslinje.aspx', 'ProjectTimeline.aspx', 'Tidslinje.aspx', 'Timeline.aspx']
  },
  {
    name: 'resource allocation',
    site: () => hub,
    pages: ['Ressursallokering.aspx', 'ResourceAllocation.aspx']
  },
  {
    name: 'idea module',
    site: () => hub,
    pages: ['Idémodul.aspx', 'Idemodul.aspx', 'Ideer.aspx', 'IdeaModule.aspx']
  },
  {
    name: 'project home',
    site: () => project,
    pages: ['ProjectHome.aspx', 'Hjem.aspx', 'Home.aspx']
  },
  {
    name: 'project status',
    site: () => project,
    pages: ['Prosjektstatus.aspx', 'ProjectStatus.aspx', 'Status.aspx']
  },
  {
    name: 'project timeline',
    site: () => project,
    pages: ['Prosjekttidslinje.aspx', 'ProjectTimeline.aspx', 'Tidslinje.aspx']
  },
  // Not provisioned by the templates: `npm run add-matrix-page` in integration/ adds it.
  { name: 'project matrices', site: () => project, pages: ['Usikkerhet.aspx'] },
  {
    name: 'program home',
    site: () => program,
    pages: ['ProgramHome.aspx', 'Hjem.aspx', 'Home.aspx']
  },
  {
    name: 'program overview',
    site: () => program,
    pages: ['ProgramOversikt.aspx', 'ProgramOverview.aspx']
  },
  {
    name: 'program aggregation',
    site: () => program,
    pages: ['ProgramLeveranser.aspx', 'ProgramUsikkerheter.aspx', 'ProgramDeliveries.aspx']
  },
  {
    name: 'program timeline',
    site: () => program,
    pages: ['ProgramTidslinje.aspx', 'ProgramTimeline.aspx', 'Tidslinje.aspx']
  },
  {
    name: 'program administration',
    site: () => program,
    pages: [
      'Admin.aspx',
      'ProgramAdministrasjon.aspx',
      'Administrasjon.aspx',
      'ProgramAdministration.aspx'
    ]
  }
]

test.describe('accessibility of the pages', () => {
  for (const entry of PAGES) {
    test(`the ${entry.name}'s web parts`, async ({ page, openPage, resolvePage }) => {
      test.setTimeout(180_000)
      const site = entry.site()
      test.skip(!site, `the site of the ${entry.name} is not configured`)
      await openPage(await resolvePage(site!, entry.pages))
      await settleWebParts(page)
      const parts = await channelWebPartsOnPage(page)
      test.skip(parts.length === 0, `the ${entry.name} has no web part of the channel under test`)
      await waitForContent(
        page,
        parts.map((part) => part.selector)
      )
      for (const part of parts) {
        await scanAccessibility(page, { component: part.alias, include: [part.selector] })
      }
    })
  }
})
