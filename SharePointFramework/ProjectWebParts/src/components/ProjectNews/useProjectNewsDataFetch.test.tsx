// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The helpers reach the data adapter for creating pages, which
// listing them never does, so it is an empty stand-in.
jest.mock('data', () => ({ __esModule: true, default: {} }))

import { render, renderHook, waitFor } from '@testing-library/react'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { useProjectNewsDataFetch } from './useProjectNewsDataFetch'

const SITE = 'https://contoso.sharepoint.com/sites/alfa'
const NEWS_SITE = 'https://contoso.sharepoint.com/sites/portefolje'
const context = { pageContext: { site: { id: { toString: () => 'site-1' } } } }

/** The news web part around the hook, as the base web part gives it. */
const webPart: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => (
  <TelemetryProvider component='ProjectNewsWebPart'>{children}</TelemetryProvider>
)

/**
 * Lists the project's news from the folder `newsFolderName`, with a stand-in SPHttpClient whose
 * answer holds `items`; returns the stand-in and the state the hook set.
 */
function listNews(newsFolderName: string, items: any[]) {
  const get = jest.fn((_url: string, _configuration?: any) =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ value: items }) })
  )
  const setState = jest.fn()
  /** Runs the news fetch against the supplied HTTP stand-in. */
  const Probe: React.FC = () => {
    useProjectNewsDataFetch(
      {
        siteUrl: SITE,
        newsFolderName,
        spHttpClient: { get },
        context: { pageContext: { site: { id: 'site-1' } } }
      } as any,
      0,
      setState
    )
    return null
  }
  render(<Probe />, { wrapper: webPart })
  return { get, setState }
}

/** A news site that answers every request with `status`, and no news when it answers. */
function newsSite(status: number) {
  return {
    get: jest.fn(() =>
      Promise.resolve({ ok: status === 200, status, json: () => Promise.resolve({ value: [] }) })
    )
  }
}

/** The props the hook reads, for the news site given. */
const props = (siteUrl: string, spHttpClient: any): any => ({
  siteUrl,
  newsFolderName: 'Prosjektnyheter',
  context,
  spHttpClient
})

const noAccess = expect.objectContaining({
  loading: false,
  error: expect.objectContaining({ message: strings.NewsNoAccessErrorText })
})

/**
 * The project's news list: the request for the pages in the news folder and the links to them,
 * the message about missing access for a news site the hub could not name or that refuses the
 * user, and a refetch that starts without the error an earlier one left. A fetch that fails is
 * counted once, for the news web part, by its error code.
 */
describe('useProjectNewsDataFetch', () => {
  beforeEach(() => startTestTelemetry())

  it('lists the news of a folder with # or % in its name, and links to them', async () => {
    // The # ended the request's URL, so the folder was never read, and the links ended at it.
    const { get, setState } = listNews('Nyheter #1 100%', [
      {
        Id: 4,
        File: {
          Name: 'Ny-bane.aspx',
          ServerRelativeUrl: '/sites/alfa/SitePages/Nyheter #1 100%/Ny-bane.aspx'
        }
      }
    ])
    const listed = () => setState.mock.calls.find(([state]) => state.data)?.[0]
    await waitFor(() => expect(listed()).toBeDefined(), { timeout: 5000 })
    const url = get.mock.calls[0][0]
    expect(url).toContain(
      "/_api/web/GetListUsingPath(DecodedUrl=@a1)/items?@a1='%2Fsites%2Falfa%2FSitePages'"
    )
    expect(url).toContain(
      "&$filter=FileDirRef eq '%2Fsites%2Falfa%2FSitePages%2FNyheter%20%231%20100%25' and GtSiteId eq 'site-1'"
    )
    expect(url).not.toContain('#')
    expect(listed().data.news[0].url).toBe(
      '/sites/alfa/SitePages/Nyheter%20%231%20100%25/Ny-bane.aspx'
    )
    expect(countedTelemetry().errors).toEqual({})
  })

  it('says access is missing when the news site refuses the request, and counts it once', async () => {
    const setState = jest.fn()
    renderHook(() => useProjectNewsDataFetch(props(NEWS_SITE, newsSite(403)), 1, setState), {
      wrapper: webPart
    })
    await waitFor(() => expect(setState).toHaveBeenCalledWith(noAccess))
    expect(countedTelemetry().errors).toEqual({ 'ProjectNewsWebPart permission_denied 403': 1 })
  })

  it('says access is missing when no news site is known, as when the hub cannot be read', async () => {
    const setState = jest.fn()
    const spHttpClient = newsSite(200)
    renderHook(() => useProjectNewsDataFetch(props('', spHttpClient), 1, setState), {
      wrapper: webPart
    })
    await waitFor(() => expect(setState).toHaveBeenCalledWith(noAccess))
    expect(spHttpClient.get).not.toHaveBeenCalled()
    // Counted as the message says it: no request was made, so the status is the error's own.
    expect(countedTelemetry().errors).toEqual({ 'ProjectNewsWebPart permission_denied 403': 1 })
  })

  it('shows the error of a request that got no answer, and counts it without a status', async () => {
    const setState = jest.fn()
    const failure = new TypeError('Failed to fetch')
    const spHttpClient = { get: jest.fn(() => Promise.reject(failure)) }
    renderHook(() => useProjectNewsDataFetch(props(NEWS_SITE, spHttpClient), 1, setState), {
      wrapper: webPart
    })
    await waitFor(() => expect(setState).toHaveBeenCalledWith({ loading: false, error: failure }))
    expect(countedTelemetry().errors).toEqual({ 'ProjectNewsWebPart unknown': 1 })
  })

  it('starts a refetch without the error an earlier one left', async () => {
    const setState = jest.fn()
    const spHttpClient = newsSite(200)
    const { rerender } = renderHook(
      ({ siteUrl }) => useProjectNewsDataFetch(props(siteUrl, spHttpClient), 1, setState),
      { initialProps: { siteUrl: '' }, wrapper: webPart }
    )
    await waitFor(() => expect(setState).toHaveBeenCalledWith(noAccess))
    setState.mockClear()
    rerender({ siteUrl: NEWS_SITE })
    await waitFor(() =>
      expect(setState).toHaveBeenCalledWith({ loading: false, data: { news: [] } })
    )
    expect(setState).toHaveBeenNthCalledWith(1, { loading: true, error: null })
  })
})
