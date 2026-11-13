// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The base web part reads DEBUG while it initialises. The data
// adapter is `adapter`: its portal and its global settings are what a test gives it.
;(globalThis as any).DEBUG = false
const adapter = {
  configure: jest.fn((..._args: unknown[]) => Promise.resolve()),
  initChildProjects: jest.fn(() => Promise.resolve()),
  portalDataService: undefined as any,
  globalSettings: new Map<string, string>()
}
jest.mock('data/SPDataAdapter', () => ({ SPDataAdapter: jest.fn(() => adapter) }))

import { act, fireEvent, screen } from '@testing-library/react'
import strings from 'ProgramWebPartsStrings'
import { useToolbarItems } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation/ToolbarItems/useToolbarItems'
import { useViewsMenuItems } from 'pp365-portfoliowebparts/lib/components/PortfolioOverview/ToolbarItems/useViewsMenuItems'
import { useTimeline } from 'pp365-shared-library/lib/components/ProjectTimeline/Timeline/useTimeline'
import { getTelemetryGate, useTelemetry } from 'pp365-shared-library/lib/telemetry'
import {
  clearTestTelemetry,
  countedTelemetry,
  HUB_SITE_ID,
  hubPortal,
  PROJECT_SITE_ID,
  settingsMap,
  settle,
  telemetryStore,
  TENANT_ID
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import React, { FC } from 'react'
import { BaseProgramWebPart } from '.'
import { initWebPart, telemetryContext } from '../testFixtures'

/**
 * The base of the program web parts and usage statistics: telemetry starts once the data adapter
 * is configured and the child projects are read, with the hub's data service and the settings the
 * adapter has read; the web part is counted as loaded once, never by a render; what it renders
 * counts for its alias, the components of PortfolioWebParts and the shared library too; and a web
 * part that fails to render says so, and is counted by a code.
 */

const ADMINISTRATION = 'ProgramAdministrationWebpart'

/** A text only an error's message holds: it must stay on the page. */
const SECRET = 'https://contoso.sharepoint.com/sites/hemmelig'

/** What the web part renders: buttons that count as a component of the web part does. */
const Probe: FC<{ title?: string; fail?: boolean }> = ({ title, fail }) => {
  const telemetry = useTelemetry()
  if (fail) throw new Error(`Kunne ikke lese ${SECRET}`)
  return (
    <>
      <button onClick={() => telemetry.track('childProjects.added')}>{title}</button>
      <button onClick={() => telemetry.track('properties.edited')}>Rediger egenskaper</button>
    </>
  )
}

/** A view of the portfolio overview and a data source of the aggregation, as their menus list them. */
const VIEW = { id: 1, title: 'Alle prosjekter', iconName: 'List' }
const DATA_SOURCE = { id: 2, title: 'Alle leveranser', iconName: 'Box' }

/**
 * What the program web parts render from other packages, by the hooks that count in them, each as
 * the package builds it: the portfolio overview's view menu and the aggregation's toolbar
 * (PortfolioWebParts), and the timeline (the shared library). They read the web part they are in
 * from a React context of the shared library, so they count for a program web part only where
 * this solution and PortfolioWebParts load one copy of it.
 */
const Shared: FC = () => {
  const dispatch = (): void => undefined
  const [view] = useViewsMenuItems(
    { props: { configuration: { views: [VIEW] } }, dispatch } as any,
    () => true
  )
  const toolbar = useToolbarItems({
    state: { views: [DATA_SOURCE] },
    props: { showViewSelector: true },
    dispatch
  } as any)
  const choices = toolbar.flatMap((item) => item.items ?? [])
  const dataSource = choices.find((item) => item.name === 'views')
  const compact = choices.find((item) => item.value === 'compactList')
  const timeline = useTimeline({
    defaultTimeframe: [
      [-1, 'months'],
      [12, 'months']
    ],
    groups: []
  } as any)
  return (
    <>
      <button onClick={() => view.onClick(undefined)}>Bytt visning</button>
      <button onClick={() => dataSource.onClick(undefined)}>Bytt datakilde</button>
      <button onClick={() => compact.onClick(undefined)}>Kompakt liste</button>
      <button onClick={(event) => timeline.onItemClick(event as any, {} as any)}>
        Åpne element
      </button>
    </>
  )
}

/** Every web part a test has created, the newest last: SharePoint disposes of them all. */
const webParts: any[] = []

class TestWebPart extends BaseProgramWebPart<any> {
  public constructor() {
    super()
    webParts.push(this)
  }

  public render(): void {
    const component: FC<any> = this.properties.shared ? Shared : Probe
    this.renderComponent(component, { fail: this.properties.fail })
  }
}

interface IInitOptions {
  /** Which site the page is on: a site of the hub, as a program is (the default), or the hub */
  page?: 'hub' | 'project'
  /** The alias in the web part's manifest */
  alias?: string
  /** The web part's properties */
  properties?: Record<string, any>
  /** Parts of the context that differ from the page's */
  context?: Record<string, any>
}

/** Creates the web part as SharePoint does, on a page of a program or of the hub, and initialises it. */
function init(options: IInitOptions = {}): Promise<any> {
  const { page = 'project', alias = ADMINISTRATION, properties, context } = options
  return initWebPart(TestWebPart, properties, 1, { ...telemetryContext(alias, page), ...context })
}

/** Renders the web part as SharePoint does, which it may do any number of times. */
function render(webPart: any) {
  act(() => {
    webPart.render()
  })
}

/** Gives the adapter the hub's portal, and the hub's settings as it has read them. */
function hubWith(level: string | undefined, overrides: Record<string, any> = {}) {
  adapter.portalDataService = hubPortal(settingsMap(level), overrides)
  adapter.globalSettings = settingsMap(level)
  return adapter.portalDataService
}

beforeEach(() => {
  jest.clearAllMocks()
  clearTestTelemetry()
  adapter.portalDataService = undefined
  adapter.globalSettings = new Map()
})

afterEach(() => {
  act(() => {
    webParts.splice(0).forEach((webPart) => {
      webPart.onDispose()
      webPart.domElement.remove()
    })
  })
  ;(globalThis as any).DEBUG = false
})

describe('BaseProgramWebPart and usage statistics', () => {
  it('starts telemetry for the page once the adapter is set up, and counts the web part as loaded with the time its setup took', async () => {
    hubWith('3')
    // Not before the adapter is configured and has read the child projects.
    adapter.initChildProjects.mockImplementationOnce(() => {
      expect(adapter.configure).toHaveBeenCalledTimes(1)
      expect(telemetryStore()).toBeUndefined()
      return Promise.resolve()
    })
    await init()
    expect(adapter.initChildProjects).toHaveBeenCalledTimes(1)
    expect(telemetryStore().page).toMatchObject({
      host: 'contoso.sharepoint.com',
      tenantId: TENANT_ID,
      siteId: PROJECT_SITE_ID,
      hubSiteId: HUB_SITE_ID,
      isHubPage: false,
      appVersion: '1.15.0',
      isDebug: false
    })
    await settle()
    expect(countedTelemetry()).toEqual({
      usage: { 'ProgramAdministrationWebpart loaded': 1 },
      errors: {},
      timings: { 'ProgramAdministrationWebpart init': 1 }
    })
  })

  it("decides the level at once from the settings the adapter has read, through the hub's own portal", async () => {
    const portal = hubWith('2')
    await init()
    expect(getTelemetryGate()).toMatchObject({ level: 2, reason: 'setting' })
    expect(telemetryStore().anchor.portal).toBe(portal)
    expect(portal.getGlobalSettings).not.toHaveBeenCalled()
    await settle()
    // Level 2 keeps usage, and no durations.
    expect(countedTelemetry()).toEqual({
      usage: { 'ProgramAdministrationWebpart loaded': 1 },
      errors: {},
      timings: {}
    })
  })

  it('lets the portal read the settings itself where the adapter holds none', async () => {
    // The adapter's map is empty when the hub was out of reach as it was configured: no answer.
    let answer: (settings: Map<string, string>) => void
    adapter.portalDataService = hubPortal(settingsMap('3'), {
      getGlobalSettings: jest.fn(() => new Promise((resolve) => (answer = resolve)))
    })
    await init()
    await settle()
    expect(adapter.portalDataService.getGlobalSettings).toHaveBeenCalledTimes(1)
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'pending' })
    answer(settingsMap('3'))
    await settle()
    expect(getTelemetryGate()).toMatchObject({ level: 3, reason: 'setting' })
    expect(countedTelemetry().usage).toEqual({ 'ProgramAdministrationWebpart loaded': 1 })
  })

  it('sends nothing without a level in the settings', async () => {
    hubWith(undefined)
    await init()
    await settle()
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'no-level' })
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })
  })

  it('asks the hub what kind of site this is once for the page, and only where usage is counted', async () => {
    // The web parts can be placed on any site of the hub: the hub's project list tells which.
    const portal = hubWith('2', { getSiteKind: jest.fn(() => Promise.resolve('program')) })
    await init()
    await init({ alias: 'ProgramTimelineWebPart' })
    await settle()
    expect(portal.getSiteKind).toHaveBeenCalledTimes(1)
    expect(portal.getSiteKind).toHaveBeenCalledWith(PROJECT_SITE_ID)
    expect(telemetryStore().siteTypes[PROJECT_SITE_ID]).toBe('program')
    expect(countedTelemetry().usage).toEqual({
      'ProgramAdministrationWebpart loaded': 1,
      'ProgramTimelineWebPart loaded': 1
    })

    // A hub page is known as one without a read, and a level below 2 counts no usage to place.
    clearTestTelemetry()
    const onHub = hubWith('2')
    await init({ page: 'hub' })
    await settle()
    expect(onHub.getSiteKind).not.toHaveBeenCalled()
    expect(telemetryStore().siteTypes[HUB_SITE_ID]).toBe('hub')

    clearTestTelemetry()
    const atLevel1 = hubWith('1')
    await init()
    await settle()
    expect(atLevel1.getSiteKind).not.toHaveBeenCalled()
  })

  it('counts nothing for a web part SharePoint disposed while it was set up', async () => {
    hubWith('3')
    // The user moved on before the child projects were read: the web part was never shown.
    adapter.initChildProjects.mockImplementationOnce(() => {
      webParts[webParts.length - 1].isDisposed = true
      return Promise.resolve()
    })
    await init()
    expect(adapter.initChildProjects).toHaveBeenCalledTimes(1)
    expect(telemetryStore()).toBeUndefined()

    // The web part of the page the user went to starts telemetry as usual.
    await init({ alias: 'ProgramTimelineWebPart' })
    await settle()
    expect(countedTelemetry()).toEqual({
      usage: { 'ProgramTimelineWebPart loaded': 1 },
      errors: {},
      timings: { 'ProgramTimelineWebPart init': 1 }
    })
  })

  // Usage statistics start after the web part's own setup, and must never undo it.
  it.each([
    [
      'no legacy page context',
      {
        pageContext: {
          ...telemetryContext(ADMINISTRATION).pageContext,
          legacyPageContext: undefined
        }
      }
    ],
    ['no manifest', { manifest: undefined }]
  ])(
    'is set up and renders all the same from a context with %s, and sends nothing',
    async (_case, context) => {
      hubWith('3')
      const webPart = await init({ context })
      expect(adapter.configure).toHaveBeenCalledTimes(1)
      expect(adapter.initChildProjects).toHaveBeenCalledTimes(1)
      await settle()
      // No page to count usage on, and no hub whose portal could open the gate.
      expect(telemetryStore().anchor).toBeUndefined()
      expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'pending' })
      expect(countedTelemetry().usage).toEqual({})
      render(webPart)
      fireEvent.click(screen.getByRole('button', { name: 'Underområder' }))
      expect(countedTelemetry().usage).toEqual({})
    }
  )

  it('is counted where its adapter has no portal to hand over, and waits for the gate', async () => {
    await init()
    await settle()
    expect(telemetryStore().anchor).toBeUndefined()
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'pending' })
    expect(countedTelemetry().usage).toEqual({ 'ProgramAdministrationWebpart loaded': 1 })
  })

  it('is set up and renders all the same when usage statistics fail as they start', async () => {
    // Reading the portal throws: the web part must not.
    Object.defineProperty(adapter, 'portalDataService', {
      configurable: true,
      get: () => {
        throw new Error('Ingen portal')
      }
    })
    try {
      const webPart = await init()
      expect(adapter.initChildProjects).toHaveBeenCalledTimes(1)
      expect(countedTelemetry().usage).toEqual({})
      render(webPart)
      expect(screen.getByRole('button', { name: 'Underområder' })).toBeInTheDocument()
      expect(webPart.getPropertyPaneConfiguration()).toEqual({ pages: [] })
    } finally {
      Object.defineProperty(adapter, 'portalDataService', {
        configurable: true,
        writable: true,
        value: undefined
      })
    }
  })

  it('tells telemetry of a DEBUG build, whose batches are logged and never sent', async () => {
    ;(globalThis as any).DEBUG = true
    await init()
    expect(telemetryStore().page.isDebug).toBe(true)
  })

  it('counts nothing when it renders, however many times', async () => {
    hubWith('3')
    const webPart = await init()
    render(webPart)
    render(webPart)
    render(webPart)
    expect(screen.getByRole('button', { name: 'Underområder' })).toBeInTheDocument()
    expect(countedTelemetry()).toEqual({
      usage: { 'ProgramAdministrationWebpart loaded': 1 },
      errors: {},
      timings: { 'ProgramAdministrationWebpart init': 1 }
    })
  })

  it('gives what it renders its alias, so a component counts for the web part it is in', async () => {
    render(await init())
    fireEvent.click(screen.getByRole('button', { name: 'Underområder' }))
    expect(countedTelemetry().usage).toEqual({
      'ProgramAdministrationWebpart loaded': 1,
      'ProgramAdministrationWebpart childProjects.added': 1
    })
  })

  it("drops an event that is another web part's, as a component shared with it would count", async () => {
    // The project information panel from ProjectWebParts counts `properties.edited`, which the
    // contract gives its own web part alone; adding child projects is the administration's.
    render(await init({ alias: 'ProgramProjectOverviewWebPart' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rediger egenskaper' }))
    fireEvent.click(screen.getByRole('button', { name: 'Underområder' }))
    expect(countedTelemetry().usage).toEqual({ 'ProgramProjectOverviewWebPart loaded': 1 })
  })

  it('says so when it fails to render, and is counted once, by a code and never by the message', async () => {
    hubWith('3')
    // React logs the error the boundary is given.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      const webPart = await init({ properties: { fail: true } })
      render(webPart)
      // The page shows the message to the user, as it shows a configuration it could not read;
      // telemetry keeps only the code.
      expect(webPart.domElement).toHaveTextContent(strings.ErrorTitle)
      expect(webPart.domElement).toHaveTextContent(SECRET)
      render(webPart)
      expect(countedTelemetry().errors).toEqual({ 'ProgramAdministrationWebpart render_failed': 1 })
      expect(JSON.stringify(telemetryStore())).not.toContain('hemmelig')
    } finally {
      consoleError.mockRestore()
    }
  })

  describe('with the components of PortfolioWebParts and the shared library', () => {
    it.each([
      ['ProgramProjectOverviewWebPart', { 'ProgramProjectOverviewWebPart view.switched': 1 }],
      [
        'ProgramAggregationWebPart',
        {
          'ProgramAggregationWebPart dataSource.switched': 1,
          'ProgramAggregationWebPart layout.toggled': 1
        }
      ],
      ['ProgramTimelineWebPart', { 'ProgramTimelineWebPart timelineItem.opened': 1 }]
    ])(
      'counts what they count for %s, the web part they are in, and nothing of the others',
      async (alias, counted) => {
        render(await init({ alias, properties: { shared: true } }))
        // Every component is in every web part here: the contract keeps each web part its own.
        for (const name of ['Bytt visning', 'Bytt datakilde', 'Kompakt liste', 'Åpne element']) {
          fireEvent.click(screen.getByRole('button', { name }))
        }
        expect(countedTelemetry().usage).toEqual({ [`${alias} loaded`]: 1, ...counted })
      }
    )

    it('counts nothing of theirs for the program administration, which has none of them', async () => {
      render(await init({ properties: { shared: true } }))
      for (const name of ['Bytt visning', 'Bytt datakilde', 'Kompakt liste', 'Åpne element']) {
        fireEvent.click(screen.getByRole('button', { name }))
      }
      expect(countedTelemetry().usage).toEqual({ 'ProgramAdministrationWebpart loaded': 1 })
    })
  })
})
