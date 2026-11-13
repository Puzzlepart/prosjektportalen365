// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The base web part reads DEBUG while it initialises. The hub
// answers through `hub.adapter` while `hub.reachable` holds; the component the web part renders
// (tested on its own) records its props.
;(globalThis as any).DEBUG = false
const HUB = 'https://contoso.sharepoint.com/sites/pp365'
const CONFIGURATION = {
  level: 'Portefølje',
  levels: ['Portefølje'],
  views: [
    { id: 1, title: 'Alle leveranser' },
    { id: 2, title: 'Forsinkede leveranser', isDefault: true }
  ]
}
const hub = {
  reachable: true,
  adapter: { getAggregatedListConfig: jest.fn(() => Promise.resolve(CONFIGURATION)) }
}
jest.mock('../../data', () => ({
  __esModule: true,
  ...jest.requireActual('../../data'),
  DataAdapter: jest.fn(() => ({
    configure: () =>
      hub.reachable
        ? Promise.resolve(hub.adapter)
        : Promise.reject(new Error('Hubområdet svarte ikke'))
  }))
}))
const rendered: { props?: any } = {}
jest.mock('../../components/PortfolioAggregation', () => ({
  PortfolioAggregation: (props: any) => {
    rendered.props = props
    return null
  }
}))

import { act, within } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import {
  clearTestTelemetry,
  countedTelemetry,
  spfxTestContext
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import { GetPortfolioConfigError } from '../../data/types'
import PortfolioAggregationWebPart from '.'

/**
 * The web part on the hub, in edit mode, initialised.
 *
 * @param context Parts of the context that differ: the page as usage statistics read it
 */
async function webPartOnHub(context: Record<string, any> = {}) {
  const webPart: any = new PortfolioAggregationWebPart()
  webPart.context = {
    pageContext: {
      web: { absoluteUrl: HUB, serverRelativeUrl: '/sites/pp365', title: 'Portefølje' },
      site: { id: { toString: () => 'site-1' } },
      legacyPageContext: { isSiteAdmin: true }
    },
    statusRenderer: { clearLoadingIndicator: jest.fn() },
    propertyPane: { refresh: jest.fn() },
    ...context
  }
  webPart.manifest = { id: 'manifest-1' }
  webPart.properties = { dataSource: 'Leveranser', dataSourceCategory: 'Leveranser' }
  webPart.domElement = document.body.appendChild(document.createElement('div'))
  webPart.displayMode = 2
  await webPart.onInit()
  return webPart
}

/** The fields of the web part's property pane, by their target property. */
function propertyPaneFields(webPart: any) {
  const fields: Record<string, any> = {}
  for (const page of webPart.getPropertyPaneConfiguration().pages) {
    for (const group of page.groups) {
      for (const field of group.groupFields) fields[field.targetProperty] = field.properties
    }
  }
  return fields
}

beforeEach(() => {
  hub.reachable = true
  rendered.props = undefined
})

describe('PortfolioAggregationWebPart', () => {
  it('renders with the configuration of its data source and refreshes the pane on a change', async () => {
    const webPart = await webPartOnHub()
    act(() => {
      webPart.render()
    })
    expect(rendered.props).toMatchObject({
      dataSource: 'Leveranser',
      configuration: CONFIGURATION,
      manifestId: 'manifest-1',
      webAbsoluteUrl: HUB,
      displayMode: 2
    })
    await act(() => rendered.props.onUpdateProperty('defaultViewId', 1))
    expect(webPart.properties.defaultViewId).toBe(1)
    expect(webPart.context.propertyPane.refresh).toHaveBeenCalled()
    expect(propertyPaneFields(webPart).defaultViewId.selectedKey).toBe(2)
  })

  it('opens its property pane when the data source cannot be read, so it can be corrected', async () => {
    hub.reachable = false
    const webPart = await webPartOnHub()
    const fields = propertyPaneFields(webPart)
    expect(fields.defaultViewId.options).toEqual([])
    expect(fields.defaultViewId.selectedKey).toBeUndefined()
  })

  it('tells why the configuration of its data source could not be read, and counts the failure once by its error code', async () => {
    clearTestTelemetry()
    hub.adapter.getAggregatedListConfig.mockImplementationOnce(() =>
      Promise.reject(
        GetPortfolioConfigError(
          Object.assign(new Error('https://contoso.sharepoint.com/sites/hemmelig'), { status: 404 })
        )
      )
    )
    const webPart = await webPartOnHub(spfxTestContext({ alias: 'PortfolioAggregationWebPart' }))
    // SharePoint renders the web part any number of times: the failure is one.
    act(() => {
      webPart.render()
    })
    act(() => {
      webPart.render()
    })
    expect(rendered.props).toBeUndefined()
    expect(
      within(webPart.domElement).getByText(strings.GetPortfolioConfigErrorText)
    ).toBeInTheDocument()
    expect(countedTelemetry()).toEqual({
      usage: { 'PortfolioAggregationWebPart loaded': 1 },
      errors: { 'PortfolioAggregationWebPart not_found 404': 1 },
      timings: { 'PortfolioAggregationWebPart init': 1 }
    })
    expect(JSON.stringify(countedTelemetry())).not.toContain('hemmelig')
  })

  it('tells in general words when the hub gave neither a configuration nor a reason, and counts no failure', async () => {
    clearTestTelemetry()
    hub.adapter.getAggregatedListConfig.mockImplementationOnce(() => Promise.resolve(undefined))
    const webPart = await webPartOnHub(spfxTestContext({ alias: 'PortfolioAggregationWebPart' }))
    act(() => {
      webPart.render()
    })
    expect(rendered.props).toBeUndefined()
    expect(within(webPart.domElement).getByText(strings.ErrorTitle)).toBeInTheDocument()
    expect(
      within(webPart.domElement).getByText(strings.GetPortfolioConfigErrorText)
    ).toBeInTheDocument()
    expect(countedTelemetry().errors).toEqual({})
  })

  it('says that it is not configured until it has a data source', async () => {
    const webPart = await webPartOnHub()
    webPart.properties.dataSource = undefined
    act(() => {
      webPart.render()
    })
    expect(rendered.props).toBeUndefined()
    expect(
      within(webPart.domElement).getByText(strings.PortfolioAggregationNotConfiguredMessage)
    ).toBeInTheDocument()
  })
})
