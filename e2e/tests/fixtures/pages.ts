import { baseURL } from '../../playwright.config'
import { configuredUrl } from './pp365'

const hub = baseURL.replace(/\/+$/, '')
const project = configuredUrl(process.env.E2E_PROJECT_URL)
const program = configuredUrl(process.env.E2E_PROGRAM_URL)

/** A page of the test sites the accessibility checks open, with the names it may have. */
export interface IA11yPage {
  name: string
  site: () => string | undefined
  pages: string[]
}

/**
 * The pages the accessibility checks open (#1788): every page the smoke suite opens, and the
 * dynamic list's. The axe scans (`a11y-baseline.spec.ts`) and the visual checks
 * (`a11y-visual.spec.ts`) go through the same pages. A page the site does not have is skipped
 * with the pages it does have.
 */
export const A11Y_PAGES: IA11yPage[] = [
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
  // Not provisioned by the templates: a page on the test hub, or E2E_PAGE_DYNAMIC_LIST.
  {
    name: 'dynamic list',
    site: () => hub,
    pages: [process.env.E2E_PAGE_DYNAMIC_LIST, 'DynList.aspx'].filter(Boolean) as string[]
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
