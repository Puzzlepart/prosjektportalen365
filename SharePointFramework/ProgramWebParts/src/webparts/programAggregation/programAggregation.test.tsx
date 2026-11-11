// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The base web part reads DEBUG while it initialises. The data
// adapter is `adapter`; the aggregation (tested in PortfolioWebParts) records its props.
;(globalThis as any).DEBUG = false
const adapter = {
  configure: jest.fn(() => Promise.resolve()),
  initChildProjects: jest.fn(() => Promise.resolve()),
  getAggregatedListConfig: jest.fn()
}
jest.mock('data/SPDataAdapter', () => ({ SPDataAdapter: jest.fn(() => adapter) }))
const rendered: { props?: any } = {}
jest.mock('pp365-portfoliowebparts/lib/components/PortfolioAggregation', () => ({
  PortfolioAggregation: (props: any) => {
    rendered.props = props
    return null
  }
}))

import { SPHttpClient } from '@microsoft/sp-http'
import { act } from '@testing-library/react'
import ProgramAggregationWebPart from '.'
import { SITE, initWebPart, propertyPaneFields } from '../testFixtures'

const CONFIGURATION = {
  level: 'Program',
  views: [
    { id: 1, title: 'Alle leveranser' },
    { id: 2, title: 'Forsinkede leveranser', isDefault: true }
  ]
}
const PROPERTIES = { dataSourceCategory: 'Leveranser', dataSourceLevel: 'Program' }

beforeEach(() => {
  rendered.props = undefined
  adapter.getAggregatedListConfig.mockImplementation(() => Promise.resolve(CONFIGURATION))
})

describe('ProgramAggregationWebPart', () => {
  it("renders the aggregation of the program's data source", async () => {
    const webPart = await initWebPart(ProgramAggregationWebPart, PROPERTIES)
    expect(adapter.getAggregatedListConfig).toHaveBeenCalledWith('Leveranser', 'Program')
    act(() => {
      webPart.render()
    })
    expect(rendered.props).toMatchObject({
      configuration: CONFIGURATION,
      isParentProject: true,
      spfxContext: webPart.context,
      dataSourceCategory: 'Leveranser'
    })
  })

  it('says what went wrong when the data source cannot be read', async () => {
    adapter.getAggregatedListConfig.mockImplementation(() =>
      Promise.reject({
        name: 'Ukjent datakilde',
        message: 'Fant ingen datakilde.',
        intent: 'warning'
      })
    )
    const webPart = await initWebPart(ProgramAggregationWebPart, PROPERTIES)
    act(() => {
      webPart.render()
    })
    expect(rendered.props).toBeUndefined()
    expect(webPart.domElement).toHaveTextContent('Ukjent datakilde')
    expect(webPart.domElement).toHaveTextContent('Fant ingen datakilde.')
  })

  it('refreshes the property pane on a change while the page is edited', async () => {
    const webPart = await initWebPart(ProgramAggregationWebPart, PROPERTIES, 2)
    act(() => {
      webPart.render()
    })
    await rendered.props.onUpdateProperty('defaultViewId', 2)
    expect(webPart.properties.defaultViewId).toBe(2)
    expect(webPart.context.propertyPane.refresh).toHaveBeenCalled()
    expect(webPart.context.spHttpClient.post).not.toHaveBeenCalled()
  })

  it('saves a change to the page itself while the page is read', async () => {
    const webPart = await initWebPart(ProgramAggregationWebPart, PROPERTIES, 1)
    act(() => {
      webPart.render()
    })
    await rendered.props.onUpdateProperty('defaultViewId', 2)
    const [url, configuration, options] = webPart.context.spHttpClient.post.mock.calls[0]
    expect(url).toBe(`${SITE}/_api/SitePages/Pages/UpdateAppPage`)
    expect(configuration).toBe(SPHttpClient.configurations.v1)
    const body = JSON.parse(options.body)
    expect(body).toMatchObject({ includeInNavigation: false, pageId: 3, title: 'Underområder' })
    expect(JSON.parse(body.webPartDataAsJson)).toMatchObject({
      id: 'manifest-1',
      instanceId: 'instance-1',
      properties: { defaultViewId: 2, dataSourceCategory: 'Leveranser' }
    })
  })

  it('offers the views of the data source, the default view chosen', async () => {
    const webPart = await initWebPart(ProgramAggregationWebPart, PROPERTIES)
    const fields = propertyPaneFields(webPart)
    expect(fields.defaultViewId.options).toEqual([
      { key: null, text: '' },
      { key: 1, text: 'Alle leveranser' },
      { key: 2, text: 'Forsinkede leveranser' }
    ])
    expect(fields.defaultViewId.selectedKey).toBe(2)
    expect(fields.dataSourceLevel.placeholder).toBe('Program')
  })

  it('chooses the first view when none is the default', async () => {
    adapter.getAggregatedListConfig.mockImplementation(() =>
      Promise.resolve({
        ...CONFIGURATION,
        views: [
          { id: 5, title: 'Alle' },
          { id: 6, title: 'Mine' }
        ]
      })
    )
    const webPart = await initWebPart(ProgramAggregationWebPart, PROPERTIES)
    expect(propertyPaneFields(webPart).defaultViewId.selectedKey).toBe(5)
  })

  it('opens its property pane when the data source cannot be read, so it can be corrected', async () => {
    adapter.getAggregatedListConfig.mockImplementation(() => Promise.reject(new Error('Nei')))
    const webPart = await initWebPart(ProgramAggregationWebPart, PROPERTIES)
    const fields = propertyPaneFields(webPart)
    expect(Object.keys(fields)).toEqual([
      'dataSourceCategory',
      'dataSourceLevel',
      'defaultViewId',
      'searchBoxPlaceholderText'
    ])
    expect(fields.defaultViewId.options).toEqual([])
  })
})
