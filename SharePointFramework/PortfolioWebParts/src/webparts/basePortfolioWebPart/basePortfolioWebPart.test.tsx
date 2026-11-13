// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The base web part reads DEBUG while it initialises. The data
// adapter is `adapter`: its portal is what a test gives it, and `configure` records the portfolio
// the web part was set up with.
;(globalThis as any).DEBUG = false
const adapter = { portalDataService: undefined as any }
const configure = jest.fn((..._args: unknown[]) => Promise.resolve(adapter))
jest.mock('../../data', () => ({
  __esModule: true,
  ...jest.requireActual('../../data'),
  DataAdapter: jest.fn(() => ({ configure }))
}))

import { act, fireEvent, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import {
  attachTelemetryPortal,
  getTelemetryGate,
  useTelemetry
} from 'pp365-shared-library/lib/telemetry'
import {
  clearTestTelemetry,
  countedTelemetry,
  HUB_SITE_ID,
  HUB_URL,
  hubPortal,
  OTHER_HUB_SITE_ID,
  OTHER_HUB_URL,
  PROJECT_SITE_ID,
  settingsMap,
  settle,
  spfxTestContext,
  telemetryStore,
  TENANT_ID
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import React, { FC } from 'react'
import { PortfolioInstance } from '../../data'
import { BasePortfolioWebPart } from './index'

/**
 * The base of the portfolio web parts and usage statistics: telemetry starts once the data adapter
 * is configured, with the hub's own data service, unless the web part was set up with a portfolio,
 * whose service may be another site's; the web part is counted as loaded once, never by a render;
 * what it renders counts for its alias; and a web part that fails to render is counted by a code.
 */

/** A text only an error's message holds: it must stay on the page. */
const SECRET = 'https://contoso.sharepoint.com/sites/hemmelig'

/** What the web part renders: buttons that count as a component of the web part does. */
const Probe: FC<{ title?: string; fail?: boolean }> = ({ title, fail }) => {
  const telemetry = useTelemetry()
  if (fail) throw new Error(`Kunne ikke lese ${SECRET}`)
  return (
    <>
      <button onClick={() => telemetry.track('viewAll.toggled')}>{title}</button>
      <button onClick={() => telemetry.track('properties.edited')}>Rediger egenskaper</button>
    </>
  )
}

class TestWebPart extends BasePortfolioWebPart<any> {
  public render(): void {
    this.renderComponent(Probe, { fail: this.properties.fail })
  }
}

const webParts: any[] = []

interface IInitOptions {
  /** Which site the page is on: the hub (the default) or a project of it */
  page?: 'hub' | 'project'
  /** The alias in the web part's manifest */
  alias?: string
  /** The portfolio a subclass sets the web part up with */
  portfolio?: Partial<PortfolioInstance>
  /** The web part's properties */
  properties?: Record<string, any>
  /** Parts of the context that differ from the page's */
  context?: Record<string, any>
}

/**
 * Creates the web part as SharePoint does, on a page of the hub or of a project of it, and
 * initialises it, with a portfolio when a subclass would hand it one.
 */
async function initWebPart(options: IInitOptions = {}): Promise<any> {
  const { page = 'hub', alias = 'LatestProjectsWebPart', portfolio, properties, context } = options
  const webPart: any = new TestWebPart()
  webPart.context = {
    ...spfxTestContext({ page, alias }),
    statusRenderer: { clearLoadingIndicator: jest.fn() },
    ...context
  }
  webPart.manifest = { id: 'manifest-1' }
  webPart.properties = { title: 'Siste prosjekter', ...properties }
  webPart.domElement = document.body.appendChild(document.createElement('div'))
  webParts.push(webPart)
  await webPart.onInit(portfolio)
  return webPart
}

/** Renders the web part as SharePoint does, which it may do any number of times. */
function render(webPart: any) {
  act(() => {
    webPart.render()
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  clearTestTelemetry()
  adapter.portalDataService = undefined
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

describe('BasePortfolioWebPart and usage statistics', () => {
  it('starts telemetry for the page once the adapter is configured, and counts the web part as loaded with the time its setup took', async () => {
    adapter.portalDataService = hubPortal(settingsMap('3'))
    await initWebPart()
    expect(configure).toHaveBeenCalledTimes(1)
    expect(telemetryStore().page).toMatchObject({
      host: 'contoso.sharepoint.com',
      tenantId: TENANT_ID,
      siteId: HUB_SITE_ID,
      hubSiteId: HUB_SITE_ID,
      isHubPage: true,
      appVersion: '1.15.0',
      isDebug: false
    })
    await settle()
    expect(countedTelemetry()).toEqual({
      usage: { 'LatestProjectsWebPart loaded': 1 },
      errors: {},
      timings: { 'LatestProjectsWebPart init': 1 }
    })
  })

  it("decides the level through the hub's own portal, which reads the settings the app caches", async () => {
    let answer: (settings: Map<string, string>) => void
    adapter.portalDataService = hubPortal(settingsMap('2'), {
      getGlobalSettings: jest.fn(() => new Promise((resolve) => (answer = resolve)))
    })
    await initWebPart()
    await settle()
    // The adapter holds no settings map: the gate is closed until the portal's own read answers.
    expect(adapter.portalDataService.getGlobalSettings).toHaveBeenCalledTimes(1)
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'pending' })
    answer(settingsMap('2'))
    await settle()
    expect(getTelemetryGate()).toMatchObject({ level: 2, reason: 'setting' })
    expect(telemetryStore().anchor.portal).toBe(adapter.portalDataService)
    // Level 2 keeps usage, and no durations.
    expect(countedTelemetry()).toEqual({
      usage: { 'LatestProjectsWebPart loaded': 1 },
      errors: {},
      timings: {}
    })
  })

  it('sends nothing without a level in the settings', async () => {
    adapter.portalDataService = hubPortal(settingsMap(undefined))
    await initWebPart()
    await settle()
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'no-level' })
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })
  })

  it.each([
    ['another hub', { hubSiteId: OTHER_HUB_SITE_ID, url: OTHER_HUB_URL }],
    ["the page's own hub", { hubSiteId: HUB_SITE_ID, url: HUB_URL }]
  ])('hands telemetry no portal when it is set up with a portfolio of %s', async (_case, hub) => {
    const portfolio = { title: 'Portefølje', url: hub.url }
    const portal = hubPortal(settingsMap('3'), hub)
    adapter.portalDataService = portal
    await initWebPart({ page: 'project', alias: 'PortfolioOverviewWebPart', portfolio })
    expect(configure).toHaveBeenCalledWith(expect.anything(), null, portfolio)
    await settle()
    // Neither the level, the hub's URL nor the kind of site is read through a portfolio's portal.
    expect(telemetryStore().anchor).toBeUndefined()
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'pending' })
    expect(portal.getGlobalSettings).not.toHaveBeenCalled()
    expect(portal.getSiteKind).not.toHaveBeenCalled()
    // The web part is counted all the same, and waits in memory for the hub's own portal.
    expect(countedTelemetry().usage).toEqual({ 'PortfolioOverviewWebPart loaded': 1 })

    // Another bundle on the page (the footer) hands over the hub's own, at its level.
    const own = hubPortal(settingsMap('2'))
    attachTelemetryPortal(own)
    await settle()
    expect(telemetryStore().anchor.portal).toBe(own)
    expect(getTelemetryGate()).toMatchObject({ level: 2, reason: 'setting' })
    expect(portal.getGlobalSettings).not.toHaveBeenCalled()
    expect(countedTelemetry().usage).toEqual({ 'PortfolioOverviewWebPart loaded': 1 })
  })

  it('asks the hub what kind of site this is once for the page, and only where usage is counted', async () => {
    adapter.portalDataService = hubPortal(settingsMap('2'))
    await initWebPart({ page: 'project', alias: 'ProjectCardWebPart' })
    await initWebPart({ page: 'project', alias: 'ProjectListWebPart' })
    await settle()
    expect(adapter.portalDataService.getSiteKind).toHaveBeenCalledTimes(1)
    expect(adapter.portalDataService.getSiteKind).toHaveBeenCalledWith(PROJECT_SITE_ID)
    expect(telemetryStore().siteTypes[PROJECT_SITE_ID]).toBe('project')
    expect(countedTelemetry().usage).toEqual({
      'ProjectCardWebPart loaded': 1,
      'ProjectListWebPart loaded': 1
    })

    // A hub page is known as one without a read, and a level below 2 counts no usage to place.
    clearTestTelemetry()
    adapter.portalDataService = hubPortal(settingsMap('2'))
    await initWebPart()
    await settle()
    expect(adapter.portalDataService.getSiteKind).not.toHaveBeenCalled()
    expect(telemetryStore().siteTypes[HUB_SITE_ID]).toBe('hub')

    clearTestTelemetry()
    adapter.portalDataService = hubPortal(settingsMap('1'))
    await initWebPart({ page: 'project' })
    await settle()
    expect(adapter.portalDataService.getSiteKind).not.toHaveBeenCalled()
  })

  it('counts nothing for a web part SharePoint disposed while it was set up', async () => {
    adapter.portalDataService = hubPortal(settingsMap('3'))
    // The user moved on before the adapter was configured: the web part was never shown.
    configure.mockImplementationOnce(() => {
      webParts[webParts.length - 1].isDisposed = true
      return Promise.resolve(adapter)
    })
    await initWebPart()
    expect(configure).toHaveBeenCalledTimes(1)
    expect(telemetryStore()).toBeUndefined()

    // The web part of the page the user went to starts telemetry as usual.
    await initWebPart({ alias: 'ProjectListWebPart' })
    await settle()
    expect(countedTelemetry()).toEqual({
      usage: { 'ProjectListWebPart loaded': 1 },
      errors: {},
      timings: { 'ProjectListWebPart init': 1 }
    })
  })

  // Usage statistics start after the web part's own setup, and must never undo it.
  it.each([
    [
      'no legacy page context',
      { pageContext: { ...spfxTestContext().pageContext, legacyPageContext: undefined } }
    ],
    ['no manifest', { manifest: undefined }]
  ])('is set up all the same from a context with %s, and sends nothing', async (_case, context) => {
    adapter.portalDataService = hubPortal(settingsMap('3'))
    const webPart = await initWebPart({ context })
    expect(configure).toHaveBeenCalledTimes(1)
    expect(webPart.dataAdapter).toBe(adapter)
    expect(webPart.context.statusRenderer.clearLoadingIndicator).toHaveBeenCalledTimes(1)
    await settle()
    // No page to count usage on, and no hub whose portal could open the gate.
    expect(telemetryStore().anchor).toBeUndefined()
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'pending' })
    expect(countedTelemetry().usage).toEqual({})
  })

  it('is counted where its adapter has no portal to hand over, and waits for the gate', async () => {
    await initWebPart({ page: 'project' })
    await settle()
    expect(telemetryStore().anchor).toBeUndefined()
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'pending' })
    expect(countedTelemetry().usage).toEqual({ 'LatestProjectsWebPart loaded': 1 })
  })

  it('is set up all the same when usage statistics fail as they start, and has an empty pane of its own', async () => {
    // Reading the portal of an adapter that is not there throws: the web part must not.
    configure.mockImplementationOnce(() => Promise.resolve(undefined))
    const webPart = await initWebPart()
    expect(webPart.dataAdapter).toBeUndefined()
    expect(webPart.context.statusRenderer.clearLoadingIndicator).toHaveBeenCalledTimes(1)
    expect(countedTelemetry().usage).toEqual({})
    expect(webPart.getPropertyPaneConfiguration()).toEqual({ pages: [] })
  })

  it('tells telemetry of a DEBUG build, whose batches are logged and never sent', async () => {
    ;(globalThis as any).DEBUG = true
    await initWebPart()
    expect(telemetryStore().page.isDebug).toBe(true)
  })

  it('counts nothing when it renders, however many times', async () => {
    const webPart = await initWebPart()
    render(webPart)
    render(webPart)
    render(webPart)
    expect(screen.getByRole('button', { name: 'Siste prosjekter' })).toBeInTheDocument()
    expect(countedTelemetry()).toEqual({
      usage: { 'LatestProjectsWebPart loaded': 1 },
      errors: {},
      timings: { 'LatestProjectsWebPart init': 1 }
    })
  })

  it('gives what it renders its alias, so a component counts for the web part it is in', async () => {
    render(await initWebPart())
    fireEvent.click(screen.getByRole('button', { name: 'Siste prosjekter' }))
    expect(countedTelemetry().usage).toEqual({
      'LatestProjectsWebPart loaded': 1,
      'LatestProjectsWebPart viewAll.toggled': 1
    })
  })

  it("drops an event that is another web part's, as a component shared with it would count", async () => {
    // The project information panel from ProjectWebParts counts `properties.edited`, which the
    // contract gives its own web part alone.
    render(await initWebPart({ alias: 'ProjectListWebPart' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rediger egenskaper' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siste prosjekter' }))
    expect(countedTelemetry().usage).toEqual({ 'ProjectListWebPart loaded': 1 })
  })

  it('counts a web part that fails to render once, by a code and never by the message', async () => {
    // React and the fallback both log the error they are given.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      const webPart = await initWebPart({ properties: { fail: true } })
      render(webPart)
      expect(screen.getByRole('alert')).toHaveTextContent(
        format(strings.ErrorBoundaryFallbackText, 'Siste prosjekter')
      )
      // The page shows the message to the user; telemetry keeps only the code.
      expect(screen.getByRole('alert')).toHaveTextContent(SECRET)
      render(webPart)
      expect(countedTelemetry().errors).toEqual({ 'LatestProjectsWebPart render_failed': 1 })
      expect(JSON.stringify(telemetryStore())).not.toContain('hemmelig')
    } finally {
      consoleError.mockRestore()
    }
  })
})
