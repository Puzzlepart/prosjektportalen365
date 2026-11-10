// util pulls the data adapter in for the page operations; it is not under test here, so it is a
// stand-in, registered before the imports because Heft runs Jest on CommonJS output without Babel.
jest.mock('data', () => ({ __esModule: true, default: {} }))

import { renderHook, waitFor } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import { useProjectNewsDataFetch } from './useProjectNewsDataFetch'

const NEWS_SITE = 'https://contoso.sharepoint.com/sites/portefolje'
const context = { pageContext: { site: { id: { toString: () => 'site-1' } } } }

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
 * The news fetch: the message about missing access for a news site the hub could not name or that
 * refuses the user, and a refetch that starts without the error an earlier one left.
 */
describe('useProjectNewsDataFetch', () => {
  it('says access is missing when the news site refuses the request', async () => {
    const setState = jest.fn()
    renderHook(() => useProjectNewsDataFetch(props(NEWS_SITE, newsSite(403)), 1, setState))
    await waitFor(() => expect(setState).toHaveBeenCalledWith(noAccess))
  })

  it('says access is missing when no news site is known, as when the hub cannot be read', async () => {
    const setState = jest.fn()
    const spHttpClient = newsSite(200)
    renderHook(() => useProjectNewsDataFetch(props('', spHttpClient), 1, setState))
    await waitFor(() => expect(setState).toHaveBeenCalledWith(noAccess))
    expect(spHttpClient.get).not.toHaveBeenCalled()
  })

  it('starts a refetch without the error an earlier one left', async () => {
    const setState = jest.fn()
    const spHttpClient = newsSite(200)
    const { rerender } = renderHook(
      ({ siteUrl }) => useProjectNewsDataFetch(props(siteUrl, spHttpClient), 1, setState),
      { initialProps: { siteUrl: '' } }
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
