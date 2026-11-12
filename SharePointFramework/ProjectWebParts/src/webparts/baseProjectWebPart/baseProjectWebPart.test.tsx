// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The base web part reads DEBUG while it loads. The data adapter
// is `adapter`: its portal and the settings it has read are what a test gives it, and
// `getSiteType` is the read usage statistics may ask for.
;(globalThis as any).DEBUG = false
const adapter = {
  configure: jest.fn(() => Promise.resolve()),
  portalDataService: undefined as any,
  globalSettings: new Map<string, string>(),
  getSiteType: jest.fn(() => Promise.resolve('project'))
}
jest.mock('../../data', () => ({ __esModule: true, default: adapter }))

import { act, fireEvent, screen } from '@testing-library/react'
import { format } from 'pp365-shared-library'
import { getTelemetryGate, useTelemetry } from 'pp365-shared-library/lib/telemetry'
import {
  clearTestTelemetry,
  countedTelemetry,
  HUB_SITE_ID,
  hubPortal,
  OTHER_HUB_SITE_ID,
  PROJECT_SITE_ID,
  settingsMap,
  settle,
  telemetryStore,
  TENANT_ID
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { BaseProjectWebPart } from './index'

/**
 * The base of the project web parts and usage statistics: telemetry starts once the data adapter
 * is configured, with the hub's settings the adapter has read; the web part is counted as loaded
 * once, never by a render; what it renders counts for its alias; and a web part that fails to
 * render is counted by a code.
 */
const SITE = 'https://contoso.sharepoint.com/sites/frisbee'

/** A text only an error's message holds: it must stay on the page. */
const SECRET = 'https://contoso.sharepoint.com/sites/hemmelig'

/** What the web part renders: a button that counts as a component of the web part does. */
const Probe: FC<{ title?: string; fail?: boolean }> = ({ title, fail }) => {
  const telemetry = useTelemetry()
  if (fail) throw new Error(`Kunne ikke lese ${SECRET}`)
  return <button onClick={() => telemetry.track('statusReport.published')}>{title}</button>
}

class TestWebPart extends BaseProjectWebPart<any> {
  public render(): void {
    this.renderComponent(Probe, { fail: this.properties.fail })
  }
}

/** The site and the web of the page context, which the web part's own setup reads. */
const PAGE = {
  site: { id: { toString: () => PROJECT_SITE_ID } },
  web: { absoluteUrl: SITE, serverRelativeUrl: '/sites/frisbee', title: 'Frisbeegolfbane' }
}

const webParts: any[] = []

/**
 * Creates the web part as SharePoint does, on a project site of the hub, and initialises it.
 *
 * @param properties The web part's properties
 * @param alias The alias in the web part's manifest
 * @param context Parts of the context that differ from a project page's
 */
async function initWebPart(
  properties: Record<string, any> = {},
  alias = 'ProjectStatusWebPart',
  context: Record<string, any> = {}
): Promise<any> {
  const webPart: any = new TestWebPart()
  webPart.context = {
    pageContext: {
      ...PAGE,
      legacyPageContext: {
        aadTenantId: TENANT_ID,
        siteId: `{${PROJECT_SITE_ID}}`,
        hubSiteId: HUB_SITE_ID
      }
    },
    manifest: { alias, version: '1.15.0' },
    statusRenderer: { clearLoadingIndicator: jest.fn() },
    ...context
  }
  webPart.properties = { title: 'Prosjektstatus', ...properties }
  webPart.domElement = document.body.appendChild(document.createElement('div'))
  webParts.push(webPart)
  await webPart.onInit()
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

describe('BaseProjectWebPart and usage statistics', () => {
  it('starts telemetry for the page once the adapter is configured, and counts the web part as loaded with the time its setup took', async () => {
    adapter.portalDataService = hubPortal()
    adapter.globalSettings = settingsMap('3')
    await initWebPart()
    expect(adapter.configure).toHaveBeenCalledTimes(1)
    expect(telemetryStore().page).toMatchObject({
      host: 'contoso.sharepoint.com',
      tenantId: TENANT_ID,
      siteId: PROJECT_SITE_ID,
      hubSiteId: HUB_SITE_ID,
      isHubPage: false,
      appVersion: '1.15.0',
      isDebug: false
    })
    expect(countedTelemetry()).toEqual({
      usage: { 'ProjectStatusWebPart loaded': 1 },
      errors: {},
      timings: { 'ProjectStatusWebPart init': 1 }
    })
  })

  it("decides the level from the settings the adapter has read, through the hub's own portal", async () => {
    adapter.portalDataService = hubPortal()
    adapter.globalSettings = settingsMap('2')
    await initWebPart()
    expect(getTelemetryGate()).toMatchObject({ level: 2, reason: 'setting' })
    // The map is the one the app has read and cached: telemetry reads no settings of its own.
    expect(adapter.portalDataService.getGlobalSettings).not.toHaveBeenCalled()
    expect(telemetryStore().anchor.portal).toBe(adapter.portalDataService)
  })

  it('sends nothing without a level in the settings, or through a portal of another hub', async () => {
    adapter.portalDataService = hubPortal()
    adapter.globalSettings = settingsMap(undefined)
    await initWebPart()
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'no-level' })
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })

    clearTestTelemetry()
    adapter.portalDataService = hubPortal(settingsMap('3'), { hubSiteId: OTHER_HUB_SITE_ID })
    adapter.globalSettings = settingsMap('3')
    await initWebPart()
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'pending' })
    expect(telemetryStore().anchor).toBeUndefined()
  })

  it('asks what kind of site this is once for the page, and only where usage is counted', async () => {
    adapter.portalDataService = hubPortal()
    adapter.globalSettings = settingsMap('2')
    await initWebPart()
    await initWebPart({}, 'ProjectInformationWebPart')
    await settle()
    expect(adapter.getSiteType).toHaveBeenCalledTimes(1)
    expect(telemetryStore().siteTypes[PROJECT_SITE_ID]).toBe('project')
    // Level 2 keeps usage, and no durations.
    expect(countedTelemetry()).toEqual({
      usage: { 'ProjectStatusWebPart loaded': 1, 'ProjectInformationWebPart loaded': 1 },
      errors: {},
      timings: {}
    })

    clearTestTelemetry()
    adapter.getSiteType.mockClear()
    adapter.globalSettings = settingsMap('1')
    await initWebPart()
    await settle()
    expect(adapter.getSiteType).not.toHaveBeenCalled()
  })

  it('counts nothing for a web part SharePoint disposed while it was set up', async () => {
    adapter.portalDataService = hubPortal()
    adapter.globalSettings = settingsMap('3')
    // The user moved on before the adapter was configured: the web part was never shown.
    adapter.configure.mockImplementationOnce(() => {
      webParts[webParts.length - 1].isDisposed = true
      return Promise.resolve()
    })
    await initWebPart()
    expect(adapter.configure).toHaveBeenCalledTimes(1)
    expect(telemetryStore()).toBeUndefined()
    expect(adapter.getSiteType).not.toHaveBeenCalled()

    // The web part of the page the user went to starts telemetry as usual.
    await initWebPart({}, 'ProjectInformationWebPart')
    expect(countedTelemetry()).toEqual({
      usage: { 'ProjectInformationWebPart loaded': 1 },
      errors: {},
      timings: { 'ProjectInformationWebPart init': 1 }
    })
  })

  // Usage statistics start after the web part's own setup, and must never undo it.
  it.each([
    ['no legacy page context', { pageContext: PAGE }],
    ['no manifest', { manifest: undefined }]
  ])('is set up all the same from a context with %s, and sends nothing', async (_case, context) => {
    adapter.portalDataService = hubPortal()
    adapter.globalSettings = settingsMap('3')
    const webPart = await initWebPart({}, 'ProjectStatusWebPart', context)
    expect(adapter.configure).toHaveBeenCalledTimes(1)
    expect(webPart.sp).toBeDefined()
    // No page to count usage on, and no hub whose portal could open the gate.
    expect(telemetryStore().anchor).toBeUndefined()
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'pending' })
    expect(countedTelemetry().usage).toEqual({})
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
    expect(screen.getByRole('button', { name: 'Prosjektstatus' })).toBeInTheDocument()
    expect(countedTelemetry()).toEqual({
      usage: { 'ProjectStatusWebPart loaded': 1 },
      errors: {},
      timings: { 'ProjectStatusWebPart init': 1 }
    })
  })

  it('gives what it renders its alias, so a component counts for the web part it is in', async () => {
    render(await initWebPart())
    fireEvent.click(screen.getByRole('button', { name: 'Prosjektstatus' }))
    expect(countedTelemetry().usage).toEqual({
      'ProjectStatusWebPart loaded': 1,
      'ProjectStatusWebPart statusReport.published': 1
    })
  })

  it('counts a web part that fails to render once, by a code and never by the message', async () => {
    // React and the fallback both log the error they are given.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      const webPart = await initWebPart({ fail: true })
      render(webPart)
      expect(screen.getByRole('alert')).toHaveTextContent(
        format(strings.ErrorBoundaryFallbackText, 'Prosjektstatus')
      )
      // The page shows the message to the user; telemetry keeps only the code.
      expect(screen.getByRole('alert')).toHaveTextContent(SECRET)
      render(webPart)
      expect(countedTelemetry().errors).toEqual({ 'ProjectStatusWebPart render_failed': 1 })
      expect(JSON.stringify(telemetryStore())).not.toContain('hemmelig')
    } finally {
      consoleError.mockRestore()
    }
  })
})
