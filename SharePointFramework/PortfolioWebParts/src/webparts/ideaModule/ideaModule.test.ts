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
jest.mock('components/IdeaModule', () => ({
  IdeaModule: (props: any) => {
    rendered.props = props
    return null
  }
}))

import { act } from '@testing-library/react'
import IdeaModuleWebPart from '.'

/** The web part on the hub, in edit mode, initialised. */
async function webPartOnHub() {
  const webPart: any = new IdeaModuleWebPart()
  webPart.context = {
    pageContext: {
      web: { absoluteUrl: HUB, serverRelativeUrl: '/sites/pp365', title: 'Portefølje' },
      site: { id: { toString: () => 'site-1' } },
      legacyPageContext: { isSiteAdmin: true }
    },
    statusRenderer: { clearLoadingIndicator: jest.fn() },
    propertyPane: { refresh: jest.fn() }
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

describe('IdeaModuleWebPart', () => {
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
})
