// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The base web part reads DEBUG while it loads. `spfi()` hands out
// `sp`, whose lists answer with `listItems`; the data adapter is `adapter`, its search with
// `searchResults`; the property pane's slider is built like the other fields so the test can read
// it; and the matrices record the props they are rendered with.
;(globalThis as any).DEBUG = false
const listItems: { current: Record<string, any>[] } = { current: [] }
const list = { getItemsByCAMLQuery: jest.fn(() => Promise.resolve(listItems.current)) }
const sp = { web: { lists: { getByTitle: jest.fn((_title: string) => list) } } }
jest.mock('@pnp/sp', () => {
  const stub = jest.requireActual('@pnp/sp')
  return new Proxy(stub, {
    get: (target, prop) => (prop === 'spfi' ? () => ({ using: () => sp }) : target[prop])
  })
})
jest.mock('@microsoft/sp-property-pane', () => {
  const stub = jest.requireActual('@microsoft/sp-property-pane')
  return new Proxy(stub, {
    get: (target, prop) =>
      prop === 'PropertyPaneSlider'
        ? (targetProperty: string, properties: any) => ({ type: 8, targetProperty, properties })
        : target[prop]
  })
})
const HUB_CONFIGURATIONS = '/sites/hub/SiteAssets/Konfigurasjon'
const configurations = (folder: string) => [
  {
    name: 'standard.json',
    title: 'Standard',
    url: `${HUB_CONFIGURATIONS}/${folder}/standard.json`
  },
  { name: 'liten.json', title: 'Liten', url: `${HUB_CONFIGURATIONS}/${folder}/liten.json` }
]
const searchResults: { current: Record<string, any>[] } = { current: [] }
const adapter = {
  configure: jest.fn(() => Promise.resolve()),
  getConfigurations: jest.fn((folder: string) => Promise.resolve(configurations(folder))),
  globalSettings: new Map([
    ['RiskMatrixDefaultConfigurationFile', 'standard.json'],
    ['OpportunityMatrixDefaultConfigurationFile', 'standard.json']
  ]),
  portalDataService: { isAvailable: true },
  isParentProject: jest.fn(() => Promise.resolve(false)),
  resolveDataSource: jest.fn((name: string) =>
    Promise.resolve({ title: name ?? 'Standard', columns: [], refiners: [] })
  ),
  fetchItemsFromDataSource: jest.fn(() => Promise.resolve(searchResults.current))
}
jest.mock('../../data', () => ({ __esModule: true, default: adapter }))
const rendered: { props?: any } = {}
jest.mock('components/RiskMatrix', () => ({
  RiskMatrix: (props: any) => {
    rendered.props = props
    return null
  }
}))
jest.mock('components/OpportunityMatrix', () => ({
  OpportunityMatrix: (props: any) => {
    rendered.props = props
    return null
  }
}))

import { act, waitFor } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import resource from 'SharedResources'
import OpportunityMatrixWebPart from '../opportunityMatrix'
import RiskMatrixWebPart from '../riskMatrix'

/**
 * The risk and opportunity matrix web parts: where they read their items (the local list with the
 * web part's CAML query, or the data source on a parent site), that a change in the property pane
 * fetches them again, and what the property pane offers.
 */
const SITE = 'https://contoso.sharepoint.com/sites/prosjekt'
const CAML =
  '<View><Query><Where><Eq><FieldRef Name="GtRiskStatus" /><Value Type="Text">Aktiv</Value></Eq></Where></Query></View>'

/** What the manifests preconfigure a new web part with. */
const MANIFEST = {
  dataFetchMode: 'auto',
  filterByShowInPortfolio: true,
  probabilityFieldName: 'GtRiskProbability',
  consequenceFieldName: 'GtRiskConsequence',
  probabilityPostActionFieldName: 'GtRiskProbabilityPostAction',
  consequencePostActionFieldName: 'GtRiskConsequencePostAction',
  fullWidth: true
}

const risk = (ID: number, fields: Record<string, any> = {}) => ({
  ID,
  Title: `Risiko ${ID}`,
  GtRiskProbability: 3,
  GtRiskConsequence: 4,
  GtRiskProbabilityPostAction: 1,
  GtRiskConsequencePostAction: 2,
  ...fields
})

/**
 * Creates the web part as SharePoint does, with `properties` over the manifest's, on a project
 * site, and initialises it.
 */
async function initWebPart(
  WebPart: typeof RiskMatrixWebPart | typeof OpportunityMatrixWebPart,
  properties: Record<string, any> = {}
): Promise<any> {
  const webPart: any = new WebPart()
  webPart.context = {
    pageContext: {
      site: { id: { toString: () => 'site-1' } },
      web: { absoluteUrl: SITE, serverRelativeUrl: '/sites/prosjekt', title: 'Prosjekt' },
      legacyPageContext: {}
    },
    statusRenderer: { clearLoadingIndicator: jest.fn() },
    propertyPane: { refresh: jest.fn(), isPropertyPaneOpen: jest.fn(() => true) }
  }
  webPart.properties = { ...MANIFEST, ...properties }
  webPart.domElement = document.body.appendChild(document.createElement('div'))
  // SPFx's own: the web part's title, and the error it draws in place of the web part.
  webPart.title = WebPart === RiskMatrixWebPart ? 'Risikomatrise' : 'Mulighetsmatrise'
  webPart.renderError = jest.fn()
  webPart.clearError = jest.fn()
  await webPart.onInit()
  return webPart
}

/** The fields of the web part's property pane, by their target property. */
function propertyPaneFields(webPart: any): Record<string, any> {
  const fields: Record<string, any> = {}
  for (const page of webPart.getPropertyPaneConfiguration().pages) {
    for (const group of page.groups) {
      for (const field of group.groupFields) fields[field.targetProperty] = field.properties
    }
  }
  return fields
}

/** Changes a property as the property pane does: the property first, then the notification. */
function changeProperty(webPart: any, property: string, value: any) {
  const oldValue = webPart.properties[property]
  webPart.properties[property] = value
  webPart.onPropertyPaneFieldChanged(property, oldValue, value)
}

beforeEach(() => {
  jest.clearAllMocks()
  rendered.props = undefined
  listItems.current = [risk(1), risk(2)]
  searchResults.current = []
  adapter.isParentProject.mockImplementation(() => Promise.resolve(false))
})

describe('the matrix web parts on a project', () => {
  it('read the list and the CAML query set in the web part', async () => {
    await initWebPart(RiskMatrixWebPart, { listName: 'Risikologg', viewXml: CAML })
    expect(sp.web.lists.getByTitle).toHaveBeenCalledWith('Risikologg')
    expect(list.getItemsByCAMLQuery).toHaveBeenCalledWith({ ViewXml: CAML })
  })

  it('read the items of their content type from the uncertainty list when neither is set', async () => {
    await initWebPart(RiskMatrixWebPart)
    await initWebPart(OpportunityMatrixWebPart, { listName: '', viewXml: '  ' })
    expect(sp.web.lists.getByTitle.mock.calls).toEqual([
      [resource.Lists_Uncertainty_Title],
      [resource.Lists_Uncertainty_Title]
    ])
    const [[risks], [opportunities]] = list.getItemsByCAMLQuery.mock.calls as any[]
    expect(risks.ViewXml).toContain(`>${resource.ContentTypes_Risk_Name}</Value>`)
    expect(opportunities.ViewXml).toContain(`>${resource.ContentTypes_Possibility_Name}</Value>`)
    expect(adapter.fetchItemsFromDataSource).not.toHaveBeenCalled()
  })

  it('place the items by the fields set, and by the standard fields where a name is emptied', async () => {
    listItems.current = [risk(1, { GtCustomProbability: 6 })]
    const webPart = await initWebPart(RiskMatrixWebPart, {
      probabilityFieldName: 'GtCustomProbability',
      consequenceFieldName: '',
      probabilityPostActionFieldName: undefined
    })
    act(() => {
      webPart.render()
    })
    expect(rendered.props.items[0]).toMatchObject({
      id: 1,
      probability: 6,
      consequence: 4,
      probabilityPostAction: 1,
      consequencePostAction: 2
    })
    expect(rendered.props.manualConfigurationPath).toBe(
      `${HUB_CONFIGURATIONS}/${strings.RiskMatrixConfigurationFolder}/standard.json`
    )
  })

  it('fetch the items again when a property that decides them is changed', async () => {
    const webPart = await initWebPart(RiskMatrixWebPart)
    act(() => {
      webPart.render()
    })
    expect(rendered.props.items.map((item) => item.id)).toEqual([1, 2])
    listItems.current = [risk(7)]
    changeProperty(webPart, 'viewXml', CAML)
    // A text field reports every keystroke: nothing is fetched until the pane has been still.
    expect(list.getItemsByCAMLQuery).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(rendered.props.items.map((item) => item.id)).toEqual([7]), {
      timeout: 5000
    })
    expect(list.getItemsByCAMLQuery).toHaveBeenCalledTimes(2)
    expect(list.getItemsByCAMLQuery).toHaveBeenLastCalledWith({ ViewXml: CAML })
    expect(webPart.context.propertyPane.refresh).toHaveBeenCalled()
  })

  it('show the error, and the matrix again once a change mends it', async () => {
    list.getItemsByCAMLQuery.mockImplementationOnce(() =>
      Promise.reject(new Error('Ugyldig spørring'))
    )
    const webPart = await initWebPart(RiskMatrixWebPart, { viewXml: '<View>' })
    act(() => {
      webPart.render()
    })
    expect(webPart.renderError).toHaveBeenCalledWith(new Error('Ugyldig spørring'))
    expect(rendered.props).toBeUndefined()
    changeProperty(webPart, 'viewXml', CAML)
    await waitFor(() => expect(rendered.props?.items).toHaveLength(2), { timeout: 5000 })
    expect(webPart.clearError).toHaveBeenCalled()
  })

  it('offer the fields of the local list, and their defaults', async () => {
    const fields = propertyPaneFields(await initWebPart(RiskMatrixWebPart))
    expect(fields.dataFetchMode.selectedKey).toBe('auto')
    expect(fields.listName.placeholder).toBe(resource.Lists_Uncertainty_Title)
    expect(fields.viewXml.placeholder).toContain(`>${resource.ContentTypes_Risk_Name}</Value>`)
    expect(fields.probabilityFieldName.placeholder).toBe('GtRiskProbability')
    expect(fields.dataSource).toBeUndefined()
    expect(fields.filterByShowInPortfolio).toBeUndefined()
    expect(fields.manualConfigurationPath.options.map((option) => option.text)).toEqual([
      'Standard',
      'Liten'
    ])
  })

  it('fall back to their own title and callout template when the fields are emptied', async () => {
    const webPart = await initWebPart(RiskMatrixWebPart, {
      showTitle: true,
      title: '',
      calloutTemplate: ''
    })
    act(() => {
      webPart.render()
    })
    expect(rendered.props.showTitle).toBe(true)
    expect(rendered.props.title).toBe('Risikomatrise')
    expect(rendered.props.calloutTemplate).toBeUndefined()
    expect(propertyPaneFields(webPart).title.placeholder).toBe('Risikomatrise')
  })

  it('offer a width only when the matrix is not full width, the one it is drawn with', async () => {
    const webPart = await initWebPart(RiskMatrixWebPart, { fullWidth: undefined })
    expect(propertyPaneFields(webPart).fullWidth.checked).toBe(true)
    expect(propertyPaneFields(webPart).width).toBeUndefined()
    webPart.properties.fullWidth = false
    expect(propertyPaneFields(webPart).width.value).toBe(400)
  })
})

describe('the matrix web parts on a parent project or program', () => {
  beforeEach(() => {
    adapter.isParentProject.mockImplementation(() => Promise.resolve(true))
    searchResults.current = [
      {
        ListItemID: '12',
        Title: 'Flom',
        SiteTitle: 'Bymiljø',
        GtRiskProbabilityOWSNMBR: '3',
        GtRiskConsequenceOWSNMBR: '4',
        GtShowInPortfolioOWSBOOL: '1'
      },
      {
        ListItemID: '13',
        Title: 'Ras',
        SiteTitle: 'Bymiljø',
        GtRiskProbabilityOWSNMBR: '2',
        GtRiskConsequenceOWSNMBR: '2',
        GtShowInPortfolioOWSBOOL: '0'
      }
    ]
  })

  it('aggregate the child projects through the data source set, or the default one', async () => {
    const webPart = await initWebPart(RiskMatrixWebPart, { dataSource: 'Mine risikoer' })
    await initWebPart(OpportunityMatrixWebPart)
    expect(adapter.resolveDataSource.mock.calls).toEqual([
      [
        'Mine risikoer',
        'b0ef3852-230e-4119-8156-5a2ba625e5e1',
        resource.Lists_DataSources_Category_UncertaintyOverview_RisksChildren
      ],
      [
        undefined,
        'dc3a4676-a38a-4fa7-a2b3-790f89046b52',
        resource.Lists_DataSources_Category_UncertaintyOverview_PossibilitiesChildren
      ]
    ])
    expect(sp.web.lists.getByTitle).not.toHaveBeenCalled()
    act(() => {
      webPart.render()
    })
    // Only what the child projects show in the portfolio, marked with the site's initials.
    expect(
      rendered.props.items.map((item) => [item.id, item.probability, item.consequence])
    ).toEqual([['BY12', 3, 4]])
  })

  it('show every item when the portfolio filter is turned off', async () => {
    const webPart = await initWebPart(RiskMatrixWebPart, { filterByShowInPortfolio: false })
    act(() => {
      webPart.render()
    })
    expect(rendered.props.items.map((item) => item.id)).toEqual(['BY12', 'BY13'])
  })

  it('offer the fields of the data source, not those of the local list', async () => {
    const fields = propertyPaneFields(await initWebPart(OpportunityMatrixWebPart))
    expect(fields.dataSource.placeholder).toBe(
      resource.Lists_DataSources_Category_UncertaintyOverview_PossibilitiesChildren
    )
    expect(fields.filterByShowInPortfolio.checked).toBe(true)
    expect(fields.listName).toBeUndefined()
    expect(fields.viewXml).toBeUndefined()
  })

  it('read the local list when told to, and offer its fields', async () => {
    const webPart = await initWebPart(RiskMatrixWebPart, { dataFetchMode: 'list' })
    expect(sp.web.lists.getByTitle).toHaveBeenCalledWith(resource.Lists_Uncertainty_Title)
    expect(adapter.fetchItemsFromDataSource).not.toHaveBeenCalled()
    const fields = propertyPaneFields(webPart)
    expect(fields.listName).toBeDefined()
    expect(fields.dataSource).toBeUndefined()
  })
})
