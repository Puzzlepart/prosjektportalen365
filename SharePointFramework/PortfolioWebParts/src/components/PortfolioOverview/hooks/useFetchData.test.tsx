import { render, waitFor } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { ColumnRenderComponentRegistry, PortfolioOverviewView } from 'pp365-shared-library'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  HUB_SITE_ID,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import { DATA_FETCH_ERROR, DATA_FETCHED, STARTING_DATA_FETCH } from '../reducer'
import { useFetchData } from './useFetchData'

/**
 * The portfolio overview's fetch: the rows of the view it shows (the default view at first), read
 * as the site reads them (a hub, a parent project, or several hubs merged), handed to the reducer
 * with what the user may see. A fetch that fails is shown by the list and counted once by its
 * error code, never by its message; so is each hub a merged view could not read.
 *
 * The overview fetches twice as it mounts (once for the view, once for the portfolio), so every
 * count here is per fetch.
 */
const QUERY = 'DepartmentId:{5c7d2f6a-3b1e-4d8c-9a0f-6e2b1c4d7f80} contentclass:STS_Site'

const view = (Id: number, Title: string, extra: Record<string, any> = {}) =>
  new PortfolioOverviewView({ Id, Title, GtSearchQuery: QUERY, ...extra }).configure([])

const all = view(1, 'Alle prosjekter', { GtPortfolioIsDefaultView: true })
const active = view(2, 'Aktive prosjekter')

const ROWS = { items: [{ SiteId: 'site-1', Title: 'Alfa' }], managedProperties: ['Title'] }
const HUB_BYGG = { uniqueId: 'b', title: 'Hub Bygg', url: 'https://contoso.sharepoint.com/sites/b' }
const HUB_HELSE = {
  uniqueId: 'a',
  title: 'Hub Helse',
  url: 'https://contoso.sharepoint.com/sites/a'
}

/** An error as PnPjs gives one for a response: its HTTP status, and a message never to be sent. */
const httpError = (status: number) =>
  Object.assign(new Error('https://contoso.sharepoint.com/sites/hemmelig svarte ikke'), { status })

/** A column renderer that reads data for its cells, as the status report column does. */
const STATUS_COLUMN: any = Object.assign(() => null, {
  key: 'teststatus',
  id: 'teststatus',
  displayName: 'Status',
  iconName: 'Info',
  fetchData: jest.fn(() => Promise.resolve([{ siteId: 'site-1' }]))
})
ColumnRenderComponentRegistry.registerMultiple(STATUS_COLUMN)

function fetchWith(
  props: Record<string, any> = {},
  state: Record<string, any> = {},
  alias = 'PortfolioOverviewWebPart'
) {
  const dataAdapter = {
    fetchDataForView: jest.fn((..._args: unknown[]) => Promise.resolve(ROWS)),
    fetchDataForViewBatch: jest.fn((..._args: unknown[]) => Promise.resolve(ROWS)),
    fetchMergedViewData: jest.fn((..._args: unknown[]) => Promise.resolve(ROWS)),
    isUserInGroup: jest.fn(() => Promise.resolve(true)),
    ...props.dataAdapter
  }
  const context = {
    props: {
      pageContext: { site: { id: { toString: () => HUB_SITE_ID } } },
      configuration: { views: [all, active], columns: [], hubSiteId: HUB_SITE_ID },
      portfolios: [],
      ...props,
      dataAdapter
    },
    state: { isMergedView: false, ...state },
    dispatch: jest.fn()
  } as any
  const Probe: React.FC = () => {
    useFetchData(context)
    return null
  }
  render(
    <TelemetryProvider component={alias}>
      <Probe />
    </TelemetryProvider>
  )
  /** The actions of one type dispatched so far. */
  const actions = (type: string) =>
    context.dispatch.mock.calls.map(([action]) => action).filter((action) => action.type === type)
  /** Waits until both fetches of the mount have ended, in rows or in an error. */
  const fetched = async (type: string) => {
    await waitFor(() => expect(actions(type)).toHaveLength(2))
    return actions(type)
  }
  return { context, dataAdapter, actions, fetched }
}

beforeEach(() => {
  jest.clearAllMocks()
  startTestTelemetry()
  window.localStorage.clear()
})

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('useFetchData (portfolio overview)', () => {
  it('fetches the default view of the hub and hands its rows to the reducer, and counts nothing', async () => {
    const { dataAdapter, actions, fetched } = fetchWith()
    const [{ payload }] = await fetched(DATA_FETCHED.type)
    expect(actions(STARTING_DATA_FETCH.type)).toHaveLength(2)
    expect(dataAdapter.fetchDataForView).toHaveBeenCalledWith(
      all,
      expect.objectContaining({ hubSiteId: HUB_SITE_ID }),
      HUB_SITE_ID
    )
    expect(payload).toMatchObject({
      items: ROWS.items,
      currentView: all,
      managedProperties: ['Title'],
      isUserInPortfolioManagerGroup: true,
      showChildProjectInfoInProgram: false
    })
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })
  })

  it("fetches the view the web part is set to show, and a parent project's rows in a batch", async () => {
    const { dataAdapter, fetched } = fetchWith({
      defaultViewId: 2,
      isParentProject: true,
      dataAdapter: { globalSettings: new Map([['ShowChildProjectInfoInProgram', '1']]) }
    })
    const [{ payload }] = await fetched(DATA_FETCHED.type)
    expect(dataAdapter.fetchDataForViewBatch.mock.calls[0][0]).toBe(active)
    expect(dataAdapter.fetchDataForView).not.toHaveBeenCalled()
    expect(payload).toMatchObject({ currentView: active, showChildProjectInfoInProgram: true })
  })

  it('keeps to the view the overview shows, and starts from the default view for the portfolio', async () => {
    // The fetch for the view keeps the view shown; the fetch for the portfolio starts afresh.
    const { fetched } = fetchWith({}, { currentView: active })
    const shown = await fetched(DATA_FETCHED.type)
    expect(shown.map(({ payload }) => payload.currentView.title).sort()).toEqual([
      'Aktive prosjekter',
      'Alle prosjekter'
    ])
  })

  it('shows the view the address names, in its query or in its hash', async () => {
    window.history.replaceState(null, '', '/?viewId=2')
    const [byQuery] = await fetchWith().fetched(DATA_FETCHED.type)
    expect(byQuery.payload.currentView).toBe(active)
    window.history.replaceState(null, '', '/#viewId=2&groupBy=7')
    const [byHash] = await fetchWith().fetched(DATA_FETCHED.type)
    expect(byHash.payload.currentView).toBe(active)
    // The hash names no column of the configuration to group by.
    expect(byHash.payload.groupBy).toBeUndefined()
  })

  it.each([
    ['its query', '/?viewId=99'],
    ['its hash', '/#viewId=99']
  ])('tells when the address names a view that is not there, in %s', async (_case, address) => {
    window.history.replaceState(null, '', address)
    const failures = await fetchWith().fetched(DATA_FETCH_ERROR.type)
    expect(failures[0].payload.error.message).toBe(strings.ViewNotFoundMessage)
  })

  it('tells when no view is the default', async () => {
    const { fetched } = fetchWith({
      configuration: { views: [active], columns: [], hubSiteId: HUB_SITE_ID }
    })
    const failures = await fetched(DATA_FETCH_ERROR.type)
    expect(failures[0].payload.error.message).toBe(strings.NoDefaultViewMessage)
  })

  it('takes the user for no portfolio manager where the adapter cannot tell', async () => {
    const { fetched } = fetchWith({ dataAdapter: { isUserInGroup: undefined } })
    const [{ payload }] = await fetched(DATA_FETCHED.type)
    expect(payload.isUserInPortfolioManagerGroup).toBe(false)
  })

  it('reads what a column of the view needs to show its cells, but not for a parent project', async () => {
    const status = view(3, 'Status', { GtPortfolioIsDefaultView: true })
    status.columns = [
      { fieldName: 'Title', dataType: 'text' },
      { fieldName: 'GtOverallStatus', dataType: STATUS_COLUMN.key }
    ] as any
    const configuration = { views: [status], columns: [], hubSiteId: HUB_SITE_ID, web: {} }
    const [{ payload }] = await fetchWith({ configuration }).fetched(DATA_FETCHED.type)
    expect(STATUS_COLUMN.fetchData).toHaveBeenCalledWith(configuration.web, status.columns[1])
    expect(payload.currentView.columns[1].data.$).toEqual([{ siteId: 'site-1' }])
    expect(payload.currentView.columns[0]).not.toHaveProperty('data')

    STATUS_COLUMN.fetchData.mockClear()
    await fetchWith({ configuration, isParentProject: true }).fetched(DATA_FETCHED.type)
    expect(STATUS_COLUMN.fetchData).not.toHaveBeenCalled()
  })

  it('counts a fetch that fails once by its error code, for the web part the overview is in', async () => {
    const error = httpError(403)
    const { fetched } = fetchWith(
      { dataAdapter: { fetchDataForView: jest.fn(() => Promise.reject(error)) } },
      {},
      'ProgramProjectOverviewWebPart'
    )
    const failures = await fetched(DATA_FETCH_ERROR.type)
    // The list shows the error with the view it was for; the reducer writes the text.
    expect(failures[0].payload).toEqual({ error, view: all })
    expect(countedTelemetry().errors).toEqual({
      'ProgramProjectOverviewWebPart permission_denied 403': failures.length
    })
    expect(JSON.stringify(countedTelemetry())).not.toContain('hemmelig')
  })

  it('counts a view that is not there as a failed fetch of unknown cause', async () => {
    const { dataAdapter, fetched } = fetchWith({ defaultViewId: 99 })
    const failures = await fetched(DATA_FETCH_ERROR.type)
    expect(failures[0].payload.error.message).toBe(strings.ViewNotFoundMessage)
    expect(dataAdapter.fetchDataForView).not.toHaveBeenCalled()
    expect(countedTelemetry().errors).toEqual({
      'PortfolioOverviewWebPart unknown': failures.length
    })
  })

  it('shows a merged view without the hubs it could not read, names them, and counts each by what it failed with', async () => {
    const merged = {
      ...ROWS,
      failedPortfolios: [HUB_BYGG],
      failedPortfolioErrors: [httpError(403)]
    }
    const { dataAdapter, fetched } = fetchWith(
      {
        portfolios: [HUB_HELSE, HUB_BYGG],
        dataAdapter: { fetchMergedViewData: jest.fn(() => Promise.resolve(merged)) }
      },
      { isMergedView: true }
    )
    const shown = await fetched(DATA_FETCHED.type)
    expect(dataAdapter.fetchMergedViewData).toHaveBeenCalledWith(
      all,
      [HUB_HELSE, HUB_BYGG],
      expect.objectContaining({ hubSiteId: HUB_SITE_ID })
    )
    expect(dataAdapter.fetchDataForView).not.toHaveBeenCalled()
    expect(shown[0].payload).toMatchObject({ items: ROWS.items, failedPortfolios: [HUB_BYGG] })
    expect(countedTelemetry().errors).toEqual({
      'PortfolioOverviewWebPart permission_denied 403': shown.length
    })
  })
})
