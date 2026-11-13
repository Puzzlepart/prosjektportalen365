// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The base web part reads DEBUG while it initialises. Every data
// adapter the web part makes is `hub.adapter`, and `configure` records the portfolio each was set
// up with; the component the web part renders (tested on its own) records its props.
;(globalThis as any).DEBUG = false
const hub = {
  adapter: { portalDataService: undefined as any, getPortfolioConfig: jest.fn() }
}
const configure = jest.fn((..._args: unknown[]) => Promise.resolve(hub.adapter))
jest.mock('data/DataAdapter', () => ({ DataAdapter: jest.fn(() => ({ configure })) }))
const rendered: { props?: any } = {}
jest.mock('components/PortfolioOverview', () => ({
  PortfolioOverview: (props: any) => {
    rendered.props = props
    return null
  }
}))

import { act, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { getTelemetryGate } from 'pp365-shared-library/lib/telemetry'
import {
  clearTestTelemetry,
  countedTelemetry,
  hubPortal,
  settingsMap,
  settle,
  spfxTestContext,
  telemetryStore
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import { GetPortfolioConfigError } from '../../data/types'
import PortfolioOverviewWebPart from '.'

/**
 * The portfolio overview web part: it shows the hub the page is on, or the portfolio it is set to
 * show, and lets the user switch between its portfolios. Usage statistics get the hub's own data
 * service only when the web part is set up without a portfolio; a switch of portfolio is counted
 * once it has the portfolio's configuration; and a configuration that cannot be read is told on
 * the page and counted once by its error code, however many times the web part renders.
 */
const HELSE = { uniqueId: 'a', title: 'Helse', url: 'https://contoso.sharepoint.com/sites/helse' }
const BYGG = { uniqueId: 'b', title: 'Bygg', url: 'https://contoso.sharepoint.com/sites/bygg' }
const CONFIGURATION = { views: [{ id: 1, title: 'Alle prosjekter' }], columns: [] }

const webParts: any[] = []

/** The web part on a page of the hub, with the properties the page gave it, initialised. */
async function webPartOnHub(properties: Record<string, any> = {}) {
  const webPart: any = new PortfolioOverviewWebPart()
  webPart.context = {
    ...spfxTestContext({ alias: 'PortfolioOverviewWebPart' }),
    statusRenderer: { clearLoadingIndicator: jest.fn() },
    propertyPane: { refresh: jest.fn() }
  }
  webPart.manifest = { id: 'manifest-1' }
  webPart.properties = properties
  webPart.domElement = document.body.appendChild(document.createElement('div'))
  webPart.displayMode = 1
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

/**
 * The fields of the web part's property pane that SPFx's own factories make, by their target
 * property. The portfolios' collection field is PnP's, a stub under Jest.
 */
function propertyPaneFields(webPart: any) {
  const fields: Record<string, any> = {}
  for (const page of webPart.getPropertyPaneConfiguration().pages) {
    for (const group of page.groups) {
      for (const field of group.groupFields) {
        if (typeof field.targetProperty === 'string')
          fields[field.targetProperty] = field.properties
      }
    }
  }
  return fields
}

beforeEach(() => {
  jest.clearAllMocks()
  clearTestTelemetry()
  rendered.props = undefined
  hub.adapter.portalDataService = hubPortal(settingsMap('3'))
  hub.adapter.getPortfolioConfig.mockImplementation(() => Promise.resolve({ ...CONFIGURATION }))
})

afterEach(() => {
  act(() => {
    webParts.splice(0).forEach((webPart) => {
      webPart.onDispose()
      webPart.domElement.remove()
    })
  })
})

describe('PortfolioOverviewWebPart', () => {
  it('offers the views of its configuration as the default view, and what goes with portfolios only when it has some', async () => {
    const alone = propertyPaneFields(await webPartOnHub({ showViewSelector: true }))
    expect(alone.defaultViewId.options).toEqual([
      { key: null, text: '' },
      { key: 1, text: 'Alle prosjekter' }
    ])
    expect(alone.selectedPortfolioId).toMatchObject({ options: undefined, disabled: true })
    expect(Object.keys(alone)).toEqual(expect.arrayContaining(['showFilters', 'showProgramViews']))
    expect(alone).not.toHaveProperty('showPortfolioSelector')
    expect(alone).not.toHaveProperty('showMergedViewInViewSelector')
    expect(alone).not.toHaveProperty('includeViewNameInExcelExportFilename')

    const several = propertyPaneFields(
      await webPartOnHub({
        portfolios: [HELSE, BYGG],
        showViewSelector: true,
        showExcelExportButton: true
      })
    )
    expect(several.selectedPortfolioId).toMatchObject({
      options: [
        { key: 'a', text: 'Helse' },
        { key: 'b', text: 'Bygg' }
      ],
      disabled: false
    })
    expect(Object.keys(several)).toEqual(
      expect.arrayContaining([
        'showPortfolioSelector',
        'showMergedViewInViewSelector',
        'includeViewNameInExcelExportFilename'
      ])
    )
  })

  it("shows the hub the page is on when it has no portfolios, and hands telemetry the hub's portal", async () => {
    const webPart = await webPartOnHub()
    expect(configure).toHaveBeenCalledWith(webPart.context, null, undefined)
    render(webPart)
    expect(rendered.props).toMatchObject({
      configuration: CONFIGURATION,
      portfolios: [],
      showMergedView: true,
      showMergedViewInViewSelector: false
    })
    await settle()
    expect(telemetryStore().anchor.portal).toBe(hub.adapter.portalDataService)
    expect(getTelemetryGate()).toMatchObject({ level: 3, reason: 'setting' })
    expect(countedTelemetry()).toEqual({
      usage: { 'PortfolioOverviewWebPart loaded': 1 },
      errors: {},
      timings: { 'PortfolioOverviewWebPart init': 1 }
    })
  })

  it('is set up with the portfolio it is set to show, the first by default, and hands telemetry no portal', async () => {
    const first = await webPartOnHub({ portfolios: [HELSE, BYGG] })
    expect(configure).toHaveBeenLastCalledWith(first.context, null, HELSE)
    const selected = await webPartOnHub({ portfolios: [HELSE, BYGG], selectedPortfolioId: 'b' })
    expect(configure).toHaveBeenLastCalledWith(selected.context, null, BYGG)
    render(selected)
    expect(rendered.props).toMatchObject({ portfolios: [HELSE, BYGG], selectedPortfolioId: 'b' })
    await settle()
    // A portfolio's URL may point at another hub: its portal decides nothing for this page.
    expect(telemetryStore().anchor).toBeUndefined()
    expect(hub.adapter.portalDataService.getGlobalSettings).not.toHaveBeenCalled()
    expect(getTelemetryGate()).toMatchObject({ level: 0, reason: 'pending' })
    expect(countedTelemetry().usage).toEqual({ 'PortfolioOverviewWebPart loaded': 2 })
  })

  it('counts a switch of portfolio once it has the configuration of the portfolio picked', async () => {
    const webPart = await webPartOnHub({
      portfolios: [HELSE, BYGG],
      showMergedViewInViewSelector: true
    })
    render(webPart)
    expect(rendered.props.showMergedViewInViewSelector).toBe(true)
    const bygg = { ...CONFIGURATION, hubSiteId: 'bygg' }
    hub.adapter.getPortfolioConfig.mockImplementationOnce(() => Promise.resolve(bygg))
    await act(() => rendered.props.onSetPortfolio('b'))
    expect(configure).toHaveBeenLastCalledWith(webPart.context, null, BYGG)
    expect(rendered.props).toMatchObject({ configuration: bygg, selectedPortfolioId: 'b' })
    expect(countedTelemetry().usage).toEqual({
      'PortfolioOverviewWebPart loaded': 1,
      'PortfolioOverviewWebPart portfolio.switched': 1
    })

    // The merged view is read through the first portfolio, and is a switch too.
    await act(() => rendered.props.onSetPortfolio(null))
    expect(configure).toHaveBeenLastCalledWith(webPart.context, null, HELSE)
    expect(rendered.props.selectedPortfolioId).toBeNull()
    expect(countedTelemetry().usage).toEqual({
      'PortfolioOverviewWebPart loaded': 1,
      'PortfolioOverviewWebPart portfolio.switched': 2
    })
    expect(telemetryStore().anchor).toBeUndefined()
  })

  it('counts no switch to a portfolio whose configuration cannot be read', async () => {
    const webPart = await webPartOnHub({ portfolios: [HELSE, BYGG] })
    render(webPart)
    const refusal = GetPortfolioConfigError(
      Object.assign(new Error('Ingen tilgang'), { status: 403 })
    )
    hub.adapter.getPortfolioConfig.mockImplementationOnce(() => Promise.reject(refusal))
    let thrown: unknown
    await act(() => rendered.props.onSetPortfolio('b').catch((error: unknown) => (thrown = error)))
    expect(thrown).toBe(refusal)
    expect(countedTelemetry().usage).toEqual({ 'PortfolioOverviewWebPart loaded': 1 })
  })

  it('tells why its configuration could not be read, and counts the failure once by its error code', async () => {
    hub.adapter.getPortfolioConfig.mockImplementation(() =>
      Promise.reject(
        GetPortfolioConfigError(
          Object.assign(new Error('https://contoso.sharepoint.com/sites/hemmelig'), { status: 403 })
        )
      )
    )
    const webPart = await webPartOnHub()
    render(webPart)
    render(webPart)
    expect(rendered.props).toBeUndefined()
    expect(screen.getByText(strings.GetPortfolioConfigErrorText)).toBeInTheDocument()
    expect(countedTelemetry()).toEqual({
      usage: { 'PortfolioOverviewWebPart loaded': 1 },
      errors: { 'PortfolioOverviewWebPart permission_denied 403': 1 },
      timings: { 'PortfolioOverviewWebPart init': 1 }
    })
    expect(JSON.stringify(countedTelemetry())).not.toContain('hemmelig')
    // With no configuration the pane offers no views.
    expect(webPart._getOptions('defaultViewId')).toEqual([])
  })
})
