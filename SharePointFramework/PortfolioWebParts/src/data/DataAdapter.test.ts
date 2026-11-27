// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Microsoft Graph answers no groups. Every `@pnp/*` import maps to
// the one PnP stub, so the mock of `@pnp/core` is all of them in this file: it keeps the stub and
// only lets `PnPClientStorage` keep what the card caches in `stored`, as localStorage keeps it
// from one load of the page to the next.
const stored = new Map<string, any>()
jest.mock('msgraph-helper', () => ({
  __esModule: true,
  default: { Get: () => Promise.resolve([]) }
}))
jest.mock('@pnp/core', () => {
  const stub = jest.requireActual('@pnp/core')
  class PnPClientStorage {
    public local = {
      getOrPut: async (key: string, getter: () => Promise<any>) => {
        if (!stored.has(key)) stored.set(key, await getter())
        return stored.get(key)
      }
    }
  }
  return new Proxy(stub, {
    get: (target, prop) => (prop === 'PnPClientStorage' ? PnPClientStorage : target[prop])
  })
})
// `clean-deep` is a function the adapter imports as a namespace. TypeScript's CommonJS output
// wraps a namespace import in an object unless the module says it is an ES module, so the
// function says so here and stays one, as it is in the bundle.
jest.mock('clean-deep', () => {
  const actual = jest.requireActual('clean-deep')
  const cleanDeep = typeof actual === 'function' ? actual : actual.default
  return Object.assign((...args: any[]) => cleanDeep(...args), { __esModule: true })
})

import strings from 'PortfolioWebPartsStrings'
import { clearProjectsCache, format, groupLatestReportBySeries } from 'pp365-shared-library'
import { errorCodeFrom, errorHttpStatusFrom } from 'pp365-shared-library/lib/telemetry'
import resource from 'SharedResources'
import { DataAdapter } from './DataAdapter'

/** The `Gt` fields of the hub's Projects list and their types: `SPProjectItem`'s, and a number. */
const PROJECT_LIST_FIELDS: Record<string, string> = {
  GtGroupId: 'Text',
  GtSiteId: 'Text',
  GtSiteUrl: 'Text',
  GtProjectPhaseText: 'Text',
  GtProjectTypeText: 'Note',
  GtProjectServiceAreaText: 'Note',
  GtProjectLifecycleStatus: 'Choice',
  GtStartDate: 'DateTime',
  GtEndDate: 'DateTime',
  GtProjectOwner: 'User',
  GtProjectManager: 'User',
  GtIsProgram: 'Boolean',
  GtIsParentProject: 'Boolean',
  GtProjectTemplate: 'Text',
  GtProjectExtensions: 'Note',
  GtProjectListContent: 'Note',
  GtProjectNumber: 'Text'
}

/** The one project on the hub, with its owner and manager. */
const PROJECT: Record<string, any> = {
  Id: 1,
  Title: 'Alfa',
  GtSiteId: 'site-1',
  GtSiteUrl: '/sites/alfa',
  GtProjectPhaseText: 'Konsept',
  GtProjectOwnerId: 7,
  GtProjectManagerId: 9,
  GtProjectNumber: 'P-42'
}

const USERS = [
  { Id: 7, Title: 'Kari Nordmann', Email: 'kari@contoso.no' },
  { Id: 9, Title: 'Ola Nordmann', Email: 'ola@contoso.no' }
]

/** The fields and person fields of the project card and the project list, as they are added. */
const CARD_FIELDS = {
  primaryField: 'GtProjectServiceAreaText',
  secondaryField: 'GtProjectTypeText',
  primaryUserField: 'GtProjectOwner',
  secondaryUserField: 'GtProjectManager'
}

/**
 * The adapter on a hub whose Projects list answers as SharePoint does: an items query gives the
 * fields it selects, and fails with a 400 for a field the list does not have and for a person
 * field asked for by name rather than by its `…Id`; the list's fields are read through `fields`.
 * `requests` records the selects and the field reads.
 *
 * @param fieldsReadable Whether the list's fields can be read
 * @param hubHasEntry Whether the Projects list has the project's entry: not for a shielded one
 */
function adapterOnHub(fieldsReadable = true, hubHasEntry = true) {
  const requests = { selects: [] as string[][], fieldReads: 0 }
  const isPerson = (name: string) => PROJECT_LIST_FIELDS[name] === 'User'
  const isSelectable = (name: string) =>
    ['Id', 'Title'].includes(name) ||
    (name in PROJECT_LIST_FIELDS && !isPerson(name)) ||
    (/Id$/.test(name) && isPerson(name.slice(0, -2)))
  const items = () => {
    let selected: string[] = []
    const query: any = {
      select: (...names: string[]) => {
        selected = names
        requests.selects.push(names)
        return query
      },
      filter: () => query,
      top: () => query,
      async *[Symbol.asyncIterator]() {
        const invalid = selected.find((name) => !isSelectable(name))
        if (invalid) throw new Error(`The field or property '${invalid}' cannot be selected.`)
        yield hubHasEntry
          ? [
              Object.fromEntries(
                selected.filter((name) => name in PROJECT).map((name) => [name, PROJECT[name]])
              )
            ]
          : []
      }
    }
    return query
  }
  const projectsList = {
    fields: {
      select: () => ({
        filter: () => () => {
          requests.fieldReads++
          return fieldsReadable
            ? Promise.resolve(
                Object.keys(PROJECT_LIST_FIELDS).map((InternalName) => ({
                  InternalName,
                  TypeAsString: PROJECT_LIST_FIELDS[InternalName]
                }))
              )
            : Promise.reject(new Error('Tilgang nektet'))
        }
      })
    },
    get items() {
      return items()
    }
  }
  const templatesList = { items: { select: () => () => Promise.resolve([]) } }
  const sp: any = {
    web: {
      lists: {
        getByTitle: (title: string) =>
          title === resource.Lists_Projects_Title ? projectsList : templatesList
      },
      siteUsers: { select: () => () => Promise.resolve(USERS) }
    },
    search: () => Promise.resolve({ PrimarySearchResults: [], TotalRows: 0 })
  }
  const spfxContext: any = { pageContext: { site: { id: { toString: () => 'hub-1' } } } }
  return { adapter: new DataAdapter(spfxContext, sp), requests }
}

/** Every field the adapter has asked the Projects list's items for. */
const selected = (requests: { selects: string[][] }) => ([] as string[]).concat(...requests.selects)

/**
 * Search as SharePoint answers a query: a row has the properties the query selects that the item
 * has, each under the name the query gives it first. The site's address asked for as `SPWebURL`
 * comes back as `SPWebURL`, and is not there as `SPWebUrl`.
 *
 * @param itemsOf The items a query template finds, by the index's names for their properties
 */
function searchAs(itemsOf: (queryTemplate: string) => Record<string, any>[]) {
  return jest.fn((query: any) => {
    const names: string[] = query.SelectProperties ?? []
    const results = itemsOf(`${query.QueryTemplate}`).map((item) => {
      const row: Record<string, any> = {}
      for (const name of names) {
        const property = Object.keys(item).find((key) => key.toLowerCase() === name.toLowerCase())
        const given = Object.keys(row).some((key) => key.toLowerCase() === name.toLowerCase())
        if (property && !given) row[name] = item[property]
      }
      return row
    })
    return Promise.resolve({ PrimarySearchResults: results, TotalRows: results.length })
  })
}

beforeEach(() => {
  clearProjectsCache()
  stored.clear()
})

describe('fetchEnrichedProject, for the project card', () => {
  it("finds the card's people", async () => {
    // Without the person fields no person was found: the card showed «Ikke satt» since 1.12.0.
    const { adapter } = adapterOnHub()
    const project = await adapter.fetchEnrichedProject('site-1', undefined, CARD_FIELDS)
    expect(project.primaryUser).toMatchObject({ name: 'Kari Nordmann', role: 'GtProjectOwner' })
    expect(project.secondaryUser).toMatchObject({ name: 'Ola Nordmann', role: 'GtProjectManager' })
  })

  it('fetches a field chosen in its pane, also when the project was fetched before', async () => {
    // The fields are part of the 30-minute cache key, or the card would show the project as it
    // was fetched before the field was chosen.
    const { adapter } = adapterOnHub()
    await adapter.fetchEnrichedProject('site-1', undefined, CARD_FIELDS)
    const project = await adapter.fetchEnrichedProject('site-1', undefined, {
      ...CARD_FIELDS,
      primaryField: 'GtProjectNumber'
    })
    expect(project.data).toMatchObject({ GtProjectNumber: 'P-42' })
  })

  it('leaves out fields the Projects list does not have, and still shows the project', async () => {
    // The pane offers every project column, the status columns among them: one in the query
    // fails it with a 400, and the card could not show the project.
    const { adapter, requests } = adapterOnHub()
    const project = await adapter.fetchEnrichedProject('site-1', undefined, {
      ...CARD_FIELDS,
      primaryField: 'GtOverallStatus',
      primaryUserField: 'GtProjectSponsor'
    })
    expect(project.title).toBe('Alfa')
    expect(selected(requests)).not.toContain('GtOverallStatus')
    expect(selected(requests)).not.toContain('GtProjectSponsorId')
  })
})

describe('fetchEnrichedProjects, for the project list', () => {
  it('leaves out fields the Projects list does not have, and still lists the projects', async () => {
    // One such field in the query failed it with a 400, and the list showed only its error.
    const { adapter, requests } = adapterOnHub()
    const projects = await adapter.fetchEnrichedProjects({
      ...CARD_FIELDS,
      primaryField: 'GtOverallStatus'
    })
    expect(projects.map((project) => project.title)).toEqual(['Alfa'])
    expect(projects[0].primaryUser).toMatchObject({ name: 'Kari Nordmann' })
    expect(selected(requests)).not.toContain('GtOverallStatus')
  })

  it('leaves out a person column chosen as a field, which SharePoint gives only by its id', async () => {
    // The fields' dropdowns offer the person columns too: asked for by name, the query failed.
    const { adapter, requests } = adapterOnHub()
    const projects = await adapter.fetchEnrichedProjects({
      ...CARD_FIELDS,
      secondaryField: 'GtProjectManager'
    })
    expect(projects.map((project) => project.title)).toEqual(['Alfa'])
    expect(selected(requests)).not.toContain('GtProjectManager')
    expect(selected(requests)).toContain('GtProjectManagerId')
  })

  it("reads the Projects list's fields once for the hub, for the list and the card", async () => {
    const { adapter, requests } = adapterOnHub()
    await adapter.fetchEnrichedProjects(CARD_FIELDS)
    await adapter.fetchEnrichedProject('site-1', undefined, CARD_FIELDS)
    expect(requests.fieldReads).toBe(1)
  })

  it("selects only the project's own fields when the list's fields cannot be read", async () => {
    const { adapter, requests } = adapterOnHub(false)
    const projects = await adapter.fetchEnrichedProjects({
      ...CARD_FIELDS,
      primaryField: 'GtProjectNumber'
    })
    expect(projects.map((project) => project.title)).toEqual(['Alfa'])
    expect(projects[0].primaryUser).toMatchObject({ name: 'Kari Nordmann' })
    expect(selected(requests)).not.toContain('GtProjectNumber')
  })
})

describe('a read that fails, as the user is told of it and as usage statistics count it', () => {
  /** An error as PnPjs gives one for a response: its HTTP status. */
  const httpError = (status: number) => Object.assign(new Error('SharePoint svarte'), { status })

  /** The hub's data service as the portfolio's configuration reads it, with what a test changes. */
  const portal = (overrides: Record<string, any> = {}): any => ({
    hubSiteId: 'hub-1',
    getProjectColumnConfig: () => Promise.resolve([]),
    getProjectColumns: () => Promise.resolve([]),
    getPortfolioOverviewViews: () => Promise.resolve([]),
    getPrograms: () => Promise.resolve([]),
    getListFormUrls: () => Promise.resolve({ defaultNewFormUrl: '/NewForm.aspx' }),
    currentUserHasPermissionsToList: () => Promise.resolve(true),
    ...overrides
  })

  it("reads a portfolio's configuration from the hub", async () => {
    const { adapter } = adapterOnHub()
    adapter.portalDataService = portal()
    expect(await adapter.getPortfolioConfig()).toMatchObject({
      columns: [],
      views: [],
      refiners: [],
      userCanAddViews: true,
      hubSiteId: 'hub-1'
    })
  })

  it("tells of a portfolio's configuration that cannot be read in general words, and keeps what the hub answered as the cause", async () => {
    const { adapter } = adapterOnHub()
    adapter.portalDataService = portal({
      getPortfolioOverviewViews: () => Promise.reject(httpError(403))
    })
    const error = await adapter.getPortfolioConfig().catch((e) => e)
    expect(error).toMatchObject({
      name: strings.GetPortfolioConfigErrorTitle,
      message: strings.GetPortfolioConfigErrorText,
      intent: 'warning'
    })
    // The cause follows the error into no spread, and gives usage statistics its code.
    expect(Object.keys(error)).not.toContain('cause')
    expect(errorCodeFrom(error)).toBe('permission_denied')
    expect(errorHttpStatusFrom(error)).toBe(403)
  })

  it("searches a data source's items with its own columns beside the ones asked for", async () => {
    const { adapter } = adapterOnHub()
    const search = jest.fn((..._args: any[]) =>
      Promise.resolve({ PrimarySearchResults: [{ Title: 'Ny bane' }], TotalRows: 1 })
    )
    ;(adapter as any)._sp.search = search
    adapter.dataSourceService = {
      getByName: () =>
        Promise.resolve({
          category: 'Leveranser',
          searchQuery: 'ContentTypeId:0x0100D7B74DE815F946D3B0F99D19F9B36B68*',
          columns: [{ fieldName: 'GtDeliveryStatusOWSCHCS' }]
        })
    } as any
    expect(await adapter.fetchItemsWithSource('Leveranser', ['Title'])).toEqual([
      { Title: 'Ny bane' }
    ])
    expect(search).toHaveBeenCalledTimes(1)
    expect(search.mock.calls[0][0]).toMatchObject({
      QueryTemplate: 'ContentTypeId:0x0100D7B74DE815F946D3B0F99D19F9B36B68*',
      SelectProperties: expect.arrayContaining([
        'Title',
        'GtDeliveryStatusOWSCHCS',
        'FileExtension',
        'ServerRedirectedURL'
      ])
    })
  })

  it('keeps what SharePoint answered as the cause of a data source that cannot be read', async () => {
    const { adapter } = adapterOnHub()
    adapter.dataSourceService = { getByName: () => Promise.reject(httpError(429)) } as any
    const error = await adapter.fetchItemsWithSource('Leveranser', []).catch((e) => e)
    expect(error.message).toContain(format(strings.DataSourceError, 'Leveranser'))
    expect(errorCodeFrom(error)).toBe('throttled')
    expect(errorHttpStatusFrom(error)).toBe(429)
  })

  it('has no status to count a data source that is not there by', async () => {
    const { adapter } = adapterOnHub()
    adapter.dataSourceService = { getByName: () => Promise.resolve(null) } as any
    const missing = await adapter.fetchItemsWithSource('Leveranser', []).catch((e) => e)
    expect(missing.message).toContain(format(strings.DataSourceNotFound, 'Leveranser'))
    expect(errorCodeFrom(missing)).toBe('unknown')
    // A hub out of reach leaves the adapter without a data source service.
    adapter.dataSourceService = undefined
    const unreachable = await adapter.fetchItemsWithSource('Leveranser', []).catch((e) => e)
    expect(unreachable.message).toContain(format(strings.DataSourceError, 'Leveranser'))
    expect(errorCodeFrom(unreachable)).toBe('unknown')
  })

  it("reads a category's data sources, and keeps what SharePoint answered as the cause when it cannot", async () => {
    const { adapter } = adapterOnHub()
    const getByCategory = jest.fn((..._args: unknown[]) => Promise.resolve([{ id: 1 }]))
    adapter.dataSourceService = { getByCategory } as any
    expect(await adapter.fetchDataSources('Leveranser', 'Portefølje')).toEqual([{ id: 1 }])
    expect(getByCategory).toHaveBeenCalledWith('Leveranser', 'Portefølje', undefined)

    getByCategory.mockImplementationOnce(() => Promise.reject(httpError(404)))
    const error = await adapter.fetchDataSources('Leveranser').catch((e) => e)
    expect(error.message).toBe(format(strings.DataSourceCategoryError, 'Leveranser'))
    expect(errorCodeFrom(error)).toBe('not_found')
    expect(errorHttpStatusFrom(error)).toBe(404)

    adapter.dataSourceService = undefined
    const unreachable = await adapter.fetchDataSources('Leveranser').catch((e) => e)
    expect(unreachable.message).toBe(format(strings.DataSourceCategoryError, 'Leveranser'))
    expect(errorCodeFrom(unreachable)).toBe('unknown')
  })
})

/**
 * The overview's two row builders: from the project sites the user can open, or, for the portfolio
 * insight group, from every project.
 */
const ROW_BUILDERS = ['fetchDataForRegularView', 'fetchDataForManagerView'] as const

// The status report column reads each row's report by its `StatusReportId`: wrong here, every row
// of the hub would claim «Ingen publisert rapport», and no other unit test would fail.
describe.each(ROW_BUILDERS)('%s, for the status report column', (builder) => {
  const ALFA = 'aaaaaaaa-0000-0000-0000-000000000001'
  const BETA = 'bbbbbbbb-0000-0000-0000-000000000002'
  const GAMMA = 'cccccccc-0000-0000-0000-000000000003'

  /** Three projects as the view's search finds them, each on a site of its own. */
  const PROJECTS = [
    { GtSiteIdOWSTEXT: ALFA, Title: 'Alfa' },
    { GtSiteIdOWSTEXT: BETA, Title: 'Beta' },
    { GtSiteIdOWSTEXT: GAMMA, Title: 'Gamma' }
  ]

  /**
   * The latest published report of each series, as search finds it: Alfa's own and its
   * delprosjekt DP1's, and Beta's, whose item id is no number. Gamma has no report.
   */
  const REPORTS = [
    { GtSiteIdOWSTEXT: ALFA, ListItemId: '12' },
    { GtSiteIdOWSTEXT: `${ALFA}-DP1`, ListItemId: '17' },
    { GtSiteIdOWSTEXT: BETA, ListItemId: 'abc' }
  ]

  /**
   * Each row's title and report id, as the builder makes the rows of these projects and reports.
   * `_fetchDataForView` is stubbed with what it would give: it searches.
   */
  const rowsOf = async (projects: Record<string, any>[], reports: Record<string, any>[]) => {
    const { adapter } = adapterOnHub()
    jest.spyOn(adapter as any, '_fetchDataForView').mockResolvedValue({
      projects,
      sites: projects.map(({ GtSiteIdOWSTEXT, Title }) => ({ SiteId: GtSiteIdOWSTEXT, Title })),
      statusReportsBySite: groupLatestReportBySeries(reports),
      managedProperties: []
    })
    const { items } = await adapter[builder]({} as any, {} as any, 'hub-1')
    return items.map((item) => [item.Title, item.StatusReportId])
  }

  it("gives each row the item id of its series' latest published report, and none without a readable one", async () => {
    expect(await rowsOf(PROJECTS, REPORTS)).toEqual([
      ['Alfa', 12],
      ['Alfa – DP1', 17],
      ['Beta', undefined],
      ['Gamma', undefined]
    ])
  })

  it("names the project's own site for a shielded project and for its report, which search finds outside the hub, and none for what lies in the hub", async () => {
    const hubUrl = 'https://contoso.sharepoint.com/sites/portefolje'
    const shieldedUrl = 'https://contoso.sharepoint.com/sites/skjermet'
    // Alfa has an entry and a report in the hub's lists. Beta is shielded: its properties item
    // and its report are on its own site, whose ID search gives in another form than the item.
    const projects = [
      { GtSiteIdOWSTEXT: ALFA, Title: 'Alfa', SiteId: 'hub-1', SPWebUrl: hubUrl },
      {
        GtSiteIdOWSTEXT: BETA,
        Title: 'Beta',
        SiteId: `{${BETA.toUpperCase()}}`,
        SPWebUrl: shieldedUrl
      }
    ]
    const reports = [
      { GtSiteIdOWSTEXT: ALFA, ListItemId: '12', SiteId: '{HUB-1}', SPWebUrl: hubUrl },
      { GtSiteIdOWSTEXT: BETA, ListItemId: '3', SiteId: BETA, SPWebUrl: shieldedUrl }
    ]
    const { adapter } = adapterOnHub()
    jest.spyOn(adapter as any, '_fetchDataForView').mockResolvedValue({
      projects,
      sites: projects.map(({ GtSiteIdOWSTEXT, Title }) => ({ SiteId: GtSiteIdOWSTEXT, Title })),
      statusReportsBySite: groupLatestReportBySeries(reports),
      managedProperties: []
    })
    const { items } = await adapter[builder]({} as any, {} as any, 'hub-1')
    expect(items.map((item) => [item.Title, item.StatusReportId, item.StatusReportWebUrl])).toEqual(
      [
        ['Alfa', 12, undefined],
        ['Beta', 3, shieldedUrl]
      ]
    )
    // The insight group's rows also name where the information panel reads the project from.
    if (builder === 'fetchDataForManagerView') {
      expect(items.map((item) => item.ProjectWebUrl)).toEqual([undefined, shieldedUrl])
    }
  })

  it("keeps the report's id over a project property of the same name", async () => {
    // The id is set after the row's spreads, so the project can neither overwrite it nor give one.
    const projects = PROJECTS.map((project) => ({ ...project, StatusReportId: 99 }))
    expect(await rowsOf(projects, REPORTS)).toEqual([
      ['Alfa', 12],
      ['Alfa – DP1', 17],
      ['Beta', undefined],
      ['Gamma', undefined]
    ])
  })
})

// Search names a property in its answer as the query names it. The stand-ins above answer by the
// names the code reads, so a query that asked for the site's address under another name passed
// them: in a tenant the hub's project list found no shielded project.
describe('shielded projects, as search answers the queries for them', () => {
  const ALFA = 'aaaaaaaa-0000-0000-0000-000000000001'
  const BETA = 'bbbbbbbb-0000-0000-0000-000000000002'
  const hubUrl = 'https://contoso.sharepoint.com/sites/portefolje'
  const alfaUrl = 'https://contoso.sharepoint.com/sites/alfa'
  const shieldedUrl = 'https://contoso.sharepoint.com/sites/skjermet'

  /** Beta is shielded: its properties item is on its own site. */
  const BETA_ITEM = {
    Title: 'Beta',
    GtSiteIdOWSTEXT: BETA,
    SiteId: BETA,
    SPWebUrl: shieldedUrl,
    Path: `${shieldedUrl}/Lists/Properties/DispForm.aspx?ID=1`
  }

  it("finds the sites of the hub's shielded projects, for the project list and the aggregations", async () => {
    const { adapter } = adapterOnHub()
    ;(adapter as any)._sp.search = searchAs(() => [BETA_ITEM])
    expect(await (adapter as any)._findShieldedProjects('hub-1')).toEqual([shieldedUrl])
  })

  it("names a shielded project's own site in the insight group's rows, where the information panel reads the project", async () => {
    const { adapter } = adapterOnHub()
    ;(adapter as any)._sp.search = searchAs((query) => {
      // The insight group may read Beta's lists for project data, and not open its site.
      if (query.includes('contentclass:STS_Site')) {
        return [{ Title: 'Alfa', SiteId: ALFA, Path: alfaUrl, SPWebUrl: alfaUrl }]
      }
      // No report is published.
      if (query.includes('0x010022252E35737A413FB56A1BA53862F6D5')) return []
      return [
        { Title: 'Alfa', GtSiteIdOWSTEXT: ALFA, SiteId: 'hub-1', SPWebUrl: hubUrl },
        BETA_ITEM
      ]
    })
    const { items } = await adapter.fetchDataForManagerView(
      { searchQuery: 'ContentTypeId:0x0100805E9E4FEAAB4F0EABAB2600D30DB70C*' } as any,
      { columns: [{ fieldName: 'Title' }], refiners: [] } as any,
      'hub-1'
    )
    expect(items.map((item) => [item.Title, item.ProjectWebUrl, item.SPWebUrl])).toEqual([
      ['Alfa', undefined, alfaUrl],
      ['Beta', shieldedUrl, undefined]
    ])
  })

  it("reads the card of a shielded project from its own site, which the hub's list has no entry for", async () => {
    const { adapter } = adapterOnHub(true, false)
    ;(adapter as any)._sp.search = searchAs(() => [
      { Title: 'Beta', SiteId: BETA, SPWebUrl: shieldedUrl, Path: shieldedUrl }
    ])
    const readItem = jest
      .spyOn(adapter as any, '_fetchShieldedProjectItem')
      .mockResolvedValue({ Id: 1, Title: 'Beta', GtSiteId: BETA })
    const project = await adapter.fetchEnrichedProject(BETA, undefined, CARD_FIELDS)
    expect(readItem).toHaveBeenCalledWith(shieldedUrl, expect.any(Array))
    expect(project.title).toBe('Beta')
    expect(project.hasUserAccess).toBe(true)
  })
})
