// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The base web part reads DEBUG while it initialises. The data
// adapter is `adapter`, with what each test lets it answer. The components are the real ones: the
// portfolio overview and the aggregation of PortfolioWebParts, the timeline of the shared library
// and the program administration. Only what is beside the point is a stand-in: the project
// information panel of ProjectWebParts behind a project's title, and the workbook of the export.
;(globalThis as any).DEBUG = false
const adapter: Record<string, any> = {}
jest.mock('data/SPDataAdapter', () => ({ SPDataAdapter: jest.fn(() => adapter) }))
jest.mock('pp365-projectwebparts/lib/components/ProjectInformationPanel', () => ({
  ProjectInformationPanel: ({ children }: any) => children ?? null
}))
jest.mock('pp365-projectwebparts/lib/components/ProjectInformation', () => ({
  ProjectInformationPanel: ({ children }: any) => children ?? null
}))
jest.mock('pp365-shared-library/lib/services/ExcelExportService', () => ({
  __esModule: true,
  default: { configure: jest.fn(), export: jest.fn() }
}))

import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import strings from 'ProgramWebPartsStrings'
import {
  DataSource,
  errorWithCause,
  ProjectColumn,
  ProjectContentColumn
} from 'pp365-shared-library'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import {
  clearTestTelemetry,
  countedTelemetry,
  HUB_SITE_ID,
  HUB_URL,
  telemetryStore
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import ProgramAdministrationWebPart from './programAdministration'
import ProgramAggregationWebPart from './programAggregation'
import ProgramProjectOverview from './programProjectOverview'
import ProgramTimelineWebPart from './programTimeline'
import { initWebPart, manifestAlias, telemetryContext } from './testFixtures'

/**
 * The four program web parts as SharePoint loads them, each its own class with the alias of its
 * manifest, rendering the real components. Three of them render another package's component,
 * which counts usage for the web part it is in through a React context of the shared library: so
 * what the overview, the aggregation and the timeline count here, under the program web parts'
 * aliases, is counted only when this solution, PortfolioWebParts and the shared library's own
 * components share one copy of that context. The fourth is the program administration, whose
 * dialog renders in a portal of its own.
 */

/** The texts of PortfolioWebParts, which names the buttons of the overview and the aggregation. */
const portfolioStrings = jest.requireActual('PortfolioWebPartsStrings')

/** An error as SharePoint answers a user who may not read a list. */
const denied = (message: string) => Object.assign(new Error(message), { status: 403 })

const webParts: any[] = []

/**
 * Creates the web part as SharePoint does, on a page of a program of the hub, with the alias of
 * its manifest, initialises it and renders it.
 *
 * @param WebPart The web part's class
 * @param folder The web part's folder under `src/webparts`, which holds its manifest
 * @param properties The web part's properties
 */
async function load(
  WebPart: new () => { onInit(): Promise<void> },
  folder: string,
  properties: Record<string, any> = {}
) {
  const alias = manifestAlias(folder)
  const context = telemetryContext(alias)
  const webPart = await initWebPart(WebPart, properties, 1, {
    ...context,
    pageContext: { ...context.pageContext, user: { email: 'kari@contoso.no' } }
  })
  webParts.push(webPart)
  act(() => {
    webPart.render()
  })
  return { webPart, alias }
}

beforeEach(() => {
  jest.clearAllMocks()
  clearTestTelemetry()
  window.localStorage.clear()
  Object.keys(adapter).forEach((key) => delete adapter[key])
  Object.assign(adapter, {
    configure: jest.fn(() => Promise.resolve()),
    initChildProjects: jest.fn(() => Promise.resolve()),
    globalSettings: new Map<string, string>()
  })
})

afterEach(async () => {
  act(() => {
    webParts.splice(0).forEach((webPart) => {
      webPart.onDispose()
      webPart.domElement.remove()
    })
  })
  cleanup()
  // The lists and the toasters keep working after their test: let them finish before the next.
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('ProgramProjectOverviewWebPart with the portfolio overview of PortfolioWebParts', () => {
  const column = (id: number, fieldName: string, name: string) =>
    Object.assign(
      new ProjectColumn({
        Id: id,
        Title: name,
        GtInternalName: fieldName,
        GtManagedProperty: fieldName,
        GtFieldDataType: 'text',
        GtColMinWidth: 100,
        GtSortOrder: id * 10
      } as any),
      { key: fieldName, fieldName, name, dataType: 'text' }
    )
  const columns = [column(1, 'Title', 'Tittel'), column(2, 'GtProjectPhase', 'Fase')]
  const view = {
    id: 1,
    title: 'Alle prosjekter',
    columns,
    columnOrder: [],
    author: 'ola@contoso.no',
    isPersonal: false,
    isDefaultView: true
  }

  beforeEach(() => {
    adapter.getPortfolioConfig = jest.fn(() =>
      Promise.resolve({
        views: [view],
        columns,
        refiners: [],
        programs: [],
        userCanAddViews: false,
        hubSiteId: HUB_SITE_ID
      })
    )
    adapter.isUserInGroup = jest.fn(() => Promise.resolve(false))
    adapter.fetchDataForViewBatch = jest.fn(() =>
      Promise.resolve({
        items: [{ Title: 'Alfa', Path: '/sites/alfa', GtProjectPhase: 'Konsept', SiteId: 's1' }],
        managedProperties: []
      })
    )
  })

  it('counts an export to Excel from the overview for the program web part', async () => {
    const { alias } = await load(ProgramProjectOverview, 'programProjectOverview')
    expect(alias).toBe('ProgramProjectOverviewWebPart')
    expect(await screen.findByText('Konsept')).toBeInTheDocument()
    expect(countedTelemetry().usage).toEqual({ 'ProgramProjectOverviewWebPart loaded': 1 })
    fireEvent.click(screen.getByTitle(portfolioStrings.ExcelExportButtonLabel))
    expect(ExcelExportService.export).toHaveBeenCalledTimes(1)
    expect(countedTelemetry()).toEqual({
      usage: {
        'ProgramProjectOverviewWebPart loaded': 1,
        'ProgramProjectOverviewWebPart excel.exported': 1
      },
      errors: {},
      timings: { 'ProgramProjectOverviewWebPart init': 1 }
    })
  })

  it("counts the overview's failed read for the program web part, by the status SharePoint answered with", async () => {
    adapter.fetchDataForViewBatch = jest.fn(() => Promise.reject(denied('Ingen tilgang til søk')))
    await load(ProgramProjectOverview, 'programProjectOverview')
    // The overview shows the message; of the error, only its code and status are kept.
    expect(await screen.findByText(/Ingen tilgang til søk/)).toBeInTheDocument()
    // The overview reads as many times as PortfolioWebParts lets it as it mounts (once for the
    // view, once for the portfolio): each read that fails is counted once.
    const reads = adapter.fetchDataForViewBatch.mock.calls.length
    await waitFor(() =>
      expect(countedTelemetry()).toEqual({
        usage: { 'ProgramProjectOverviewWebPart loaded': 1 },
        errors: { 'ProgramProjectOverviewWebPart permission_denied 403': reads },
        timings: { 'ProgramProjectOverviewWebPart init': 1 }
      })
    )
    expect(JSON.stringify(telemetryStore())).not.toContain('tilgang')
  })
})

describe('ProgramAggregationWebPart with the aggregation of PortfolioWebParts', () => {
  const contentColumn = (
    Id: number,
    Title: string,
    GtManagedProperty: string,
    GtSortOrder: number
  ) =>
    new ProjectContentColumn({
      Id,
      Title,
      GtInternalName: GtManagedProperty,
      GtManagedProperty,
      GtFieldDataType: 'text',
      GtColMinWidth: 100,
      GtSortOrder
    } as any)
  const columns = [
    contentColumn(1, 'Tittel', 'Title', 10),
    contentColumn(2, 'Leveransestatus', 'GtDeliveryStatusOWSCHCS', 20)
  ]
  const dataSource = new DataSource(
    {
      Id: 1,
      Title: 'Alle leveranser',
      GtDataSourceLevel: ['Program'],
      GtProjectContentColumnsId: [1, 2],
      GtSearchQuery: '*',
      GtDataSourceCategory: 'Leveranser'
    } as any,
    columns
  )
  const PROPERTIES = {
    dataSource: 'Alle leveranser',
    dataSourceCategory: 'Leveranser',
    dataSourceLevel: 'Program'
  }

  beforeEach(() => {
    adapter.getAggregatedListConfig = jest.fn(() =>
      Promise.resolve({ views: [dataSource], columns, refiners: [], level: 'Program' })
    )
    adapter.fetchItemsWithSource = jest.fn(() =>
      Promise.resolve([
        {
          Title: 'Design av bane',
          GtDeliveryStatusOWSCHCS: 'Ihht. plan',
          SiteTitle: 'Alfa',
          SiteId: 's1'
        }
      ])
    )
  })

  it('counts an export to Excel from the aggregation for the program web part', async () => {
    const { alias } = await load(ProgramAggregationWebPart, 'programAggregation', PROPERTIES)
    expect(alias).toBe('ProgramAggregationWebPart')
    expect(await screen.findByText('Design av bane')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle(portfolioStrings.ExcelExportButtonLabel))
    expect(ExcelExportService.export).toHaveBeenCalledTimes(1)
    expect(countedTelemetry()).toEqual({
      usage: {
        'ProgramAggregationWebPart loaded': 1,
        'ProgramAggregationWebPart excel.exported': 1
      },
      errors: {},
      timings: { 'ProgramAggregationWebPart init': 1 }
    })
  })

  it("counts the aggregation's failed read for the program web part, by the status the adapter kept as the cause", async () => {
    // The program's adapter shows a general text, and keeps what search answered as its cause.
    const throttled = Object.assign(new Error('For mange forespørsler'), { status: 429 })
    adapter.fetchItemsWithSource = jest.fn(() =>
      Promise.reject(errorWithCause('Kunne ikke hente data fra Alle leveranser.', throttled))
    )
    await load(ProgramAggregationWebPart, 'programAggregation', PROPERTIES)
    expect(await screen.findByText(/Kunne ikke hente data fra Alle leveranser/)).toBeInTheDocument()
    expect(countedTelemetry()).toEqual({
      usage: { 'ProgramAggregationWebPart loaded': 1 },
      errors: { 'ProgramAggregationWebPart throttled 429': 1 },
      timings: { 'ProgramAggregationWebPart init': 1 }
    })
    expect(JSON.stringify(telemetryStore())).not.toMatch(/hente|foresp/)
  })
})

describe('ProgramTimelineWebPart with the timeline of the shared library', () => {
  it("counts the timeline's failed read for the program web part, by the status SharePoint answered with", async () => {
    adapter.fetchTimelineConfiguration = jest.fn(() =>
      Promise.reject(denied('Ingen tilgang til Tidslinjekonfigurasjon'))
    )
    const { alias } = await load(ProgramTimelineWebPart, 'programTimeline')
    expect(alias).toBe('ProgramTimelineWebPart')
    expect(await screen.findByText('Ingen tilgang til Tidslinjekonfigurasjon')).toBeInTheDocument()
    expect(countedTelemetry()).toEqual({
      usage: { 'ProgramTimelineWebPart loaded': 1 },
      errors: { 'ProgramTimelineWebPart permission_denied 403': 1 },
      timings: { 'ProgramTimelineWebPart init': 1 }
    })
    expect(JSON.stringify(telemetryStore())).not.toContain('tilgang')
  })
})

describe('ProgramAdministrationWebpart with the program administration', () => {
  const HUB = { hubSiteId: HUB_SITE_ID, title: 'Prosjektportalen' }
  const project = (SiteId: string, Title: string) => ({
    SiteId,
    Title,
    SPWebURL: `https://contoso.sharepoint.com/sites/${Title.toLowerCase()}`,
    HubSiteId: HUB_SITE_ID,
    HubSiteUrl: HUB_URL,
    HubSiteTitle: HUB.title
  })
  const ALFA = project('a', 'Alfa')
  const BRAVO = project('b', 'Bravo')
  const CHARLIE = project('c', 'Charlie')

  // Hidden elements too: under jsdom Fluent marks the open dialog `aria-hidden` a moment after it
  // opens, although the focus is in it.
  const rowChecks = (container: HTMLElement) =>
    within(container).getAllByRole('checkbox', { name: 'Velg rad', hidden: true })

  beforeEach(() => {
    Object.assign(adapter, {
      project: { getProjectInformationData: jest.fn(() => Promise.resolve({ fieldValues: {} })) },
      checkProjectAdminPermissions: jest.fn(() => Promise.resolve(true)),
      portalDataService: {
        url: HUB_URL,
        resolveHubSiteFromUrl: jest.fn(() => Promise.resolve(HUB))
      },
      initializeHubWebs: jest.fn(),
      fetchChildProjects: jest.fn(() => Promise.resolve([ALFA, BRAVO])),
      getHubSiteProjects: jest.fn(() => Promise.resolve([ALFA, BRAVO, CHARLIE])),
      addChildProjects: jest.fn(() => Promise.resolve()),
      removeChildProjects: jest.fn(() => Promise.resolve([BRAVO]))
    })
  })

  it('counts child projects removed and added, once each, under the alias of its manifest', async () => {
    const { webPart, alias } = await load(ProgramAdministrationWebPart, 'programAdministration')
    expect(alias).toBe('ProgramAdministrationWebpart')
    expect(await screen.findByText('Alfa')).toBeInTheDocument()
    expect(countedTelemetry().usage).toEqual({ 'ProgramAdministrationWebpart loaded': 1 })

    // Alfa is removed from the program.
    fireEvent.click(rowChecks(webPart.domElement)[0])
    fireEvent.click(screen.getByText(strings.ProgramRemoveChildsButtonLabel))
    await waitFor(() => expect(screen.queryByText('Alfa')).toBeNull())
    expect(adapter.removeChildProjects).toHaveBeenCalledTimes(1)
    expect(countedTelemetry().usage).toEqual({
      'ProgramAdministrationWebpart loaded': 1,
      'ProgramAdministrationWebpart childProjects.removed': 1
    })

    // Charlie is added, from the dialog, which renders outside the web part's element. The
    // dialog offers Alfa and Charlie, by title.
    fireEvent.click(screen.getByText(strings.ProgramAdministrationAddChildsButtonLabel))
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    expect(webPart.domElement).not.toContainElement(dialog)
    fireEvent.click(rowChecks(dialog)[1])
    fireEvent.click(within(dialog).getByText(strings.Add))
    await waitFor(() => expect(within(webPart.domElement).getByText('Charlie')).toBeInTheDocument())
    expect(adapter.addChildProjects).toHaveBeenCalledWith(
      [expect.objectContaining({ SiteId: 'c' })],
      HUB_URL
    )
    expect(countedTelemetry()).toEqual({
      usage: {
        'ProgramAdministrationWebpart loaded': 1,
        'ProgramAdministrationWebpart childProjects.removed': 1,
        'ProgramAdministrationWebpart childProjects.added': 1
      },
      errors: {},
      timings: { 'ProgramAdministrationWebpart init': 1 }
    })
  })

  it('counts child projects it cannot read under the alias of its manifest, by the status SharePoint answered with', async () => {
    adapter.fetchChildProjects = jest.fn(() =>
      Promise.reject(denied('Ingen tilgang til Prosjektegenskaper'))
    )
    // The administration logs the error it is given.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      await load(ProgramAdministrationWebPart, 'programAdministration')
      expect(await screen.findByText(strings.ProgramAdministrationEmptyTitle)).toBeInTheDocument()
      expect(countedTelemetry()).toEqual({
        usage: { 'ProgramAdministrationWebpart loaded': 1 },
        errors: { 'ProgramAdministrationWebpart permission_denied 403': 1 },
        timings: { 'ProgramAdministrationWebpart init': 1 }
      })
    } finally {
      consoleError.mockRestore()
    }
  })
})
