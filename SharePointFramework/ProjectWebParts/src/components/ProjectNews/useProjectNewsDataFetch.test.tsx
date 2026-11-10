// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The helpers reach the data adapter for creating pages, which
// listing them never does, so it is an empty stand-in.
jest.mock('data', () => ({ __esModule: true, default: {} }))

import { render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { useProjectNewsDataFetch } from './useProjectNewsDataFetch'

const SITE = 'https://contoso.sharepoint.com/sites/alfa'

/**
 * Lists the project's news from the folder `newsFolderName`, with a stand-in SPHttpClient whose
 * answer holds `items`; returns the stand-in and the state the hook set.
 */
function listNews(newsFolderName: string, items: any[]) {
  const get = jest.fn((_url: string, _configuration?: any) =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ value: items }) })
  )
  const setState = jest.fn()
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
  render(<Probe />)
  return { get, setState }
}

/**
 * The project's news list: the request for the pages in the news folder, and the links to them.
 */
describe('useProjectNewsDataFetch', () => {
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
  })
})
