// util reaches the hub's project list through the data adapter, which is a stand-in registered
// before the imports because Heft runs Jest on CommonJS output without Babel: `hub.fields` are
// the project list's fields, `hub.rows` its rows, `hub.selected` what a query selected, and
// `hub.denied` whether the list refuses the user, as it does a member of «Minimum lesetilganger på hub»,
// and `hub.failure` another error the list fails with.
const hub: {
  fields: string[]
  rows: any[]
  selected?: string[]
  denied?: boolean
  failure?: Error
} = {
  fields: [],
  rows: []
}
jest.mock('data', () => ({
  __esModule: true,
  default: {
    portalDataService: {
      web: {
        lists: {
          getByTitle: () => ({
            fields: {
              select: () => ({
                filter: () => () =>
                  hub.denied
                    ? Promise.reject(Object.assign(new Error('403 FORBIDDEN'), { status: 403 }))
                    : hub.failure
                      ? Promise.reject(hub.failure)
                      : Promise.resolve(hub.fields.map((InternalName) => ({ InternalName })))
              })
            },
            items: {
              select: (...fields: string[]) => {
                hub.selected = fields
                return { filter: () => ({ top: () => () => Promise.resolve(hub.rows) }) }
              }
            }
          })
        }
      }
    }
  }
}))

import { format, isUnauthorizedError } from 'pp365-shared-library'
import strings from 'ProjectWebPartsStrings'
import {
  copyTemplatePage,
  doesSitePageExist,
  ensureProjectNewsFolder,
  getNewsEditUrl,
  getNewsSiteUrl,
  getNewsPageName,
  getServerRelativeUrl,
  getSitePageItemId,
  getTemplates,
  isNewsAccessDenied,
  newsNoAccessError,
  recycleSitePage,
  setOriginalSourceSiteId,
  validateSharePointFileName
} from './util'

/** A response from SharePoint's REST API, with `body` as its JSON. */
const response = (ok: boolean, body: any = {}, statusText = ok ? 'OK' : 'Error') => ({
  ok,
  status: ok ? 200 : 500,
  statusText,
  json: () => Promise.resolve(body)
})

/**
 * A stand-in for SPHttpClient in front of a hub, recording every URL asked for in `urls`. A GET
 * answers with the page library's `Gt` fields, but on an English hub, whose page library is
 * called Site Pages, a lookup of the library by the title Områdesider gets SharePoint's 404. A
 * POST answers with `post`.
 */
function httpClient(pageFields: string[], { post = response(true), english = false } = {}) {
  const urls: string[] = []
  return {
    urls,
    get: jest.fn((url: string) => {
      urls.push(url)
      if (english && url.includes("getByTitle('Områdesider')")) {
        return Promise.resolve(response(false, { error: { message: 'Listen finnes ikke.' } }))
      }
      return Promise.resolve(
        response(true, { value: pageFields.map((InternalName) => ({ InternalName })) })
      )
    }),
    post: jest.fn((url: string, _configuration?: any, _options?: any) => {
      urls.push(url)
      return Promise.resolve(post)
    })
  }
}

/**
 * A stand-in for SPHttpClient that answers every GET with `get` and every POST with `post`, and
 * records each URL asked for, with its method, in `calls`.
 */
function recordingClient(get = response(true), post = response(true)) {
  const calls: string[] = []
  return {
    calls,
    get: jest.fn((url: string) => {
      calls.push(`GET ${url}`)
      return Promise.resolve(get)
    }),
    post: jest.fn((url: string) => {
      calls.push(`POST ${url}`)
      return Promise.resolve(post)
    })
  }
}

/** The body of the update that ties a page to its project, the last POST `client` made. */
const updateBody = (client: ReturnType<typeof httpClient>) =>
  JSON.parse(client.post.mock.calls[client.post.mock.calls.length - 1][2].body)

/**
 * The news helpers: the page name a title becomes, the URLs a page lives at, SharePoint's rules
 * for a file name, finding a page's item, and tying a page to its project.
 */
describe('ProjectNews util', () => {
  it('turns a title into a page name and an edit URL', () => {
    expect(getNewsPageName('Ny bane  åpnet')).toBe('Ny-bane-åpnet.aspx')
    expect(
      getNewsEditUrl('https://contoso.sharepoint.com/sites/alfa', 'Prosjektnyheter', 'Ny-bane.aspx')
    ).toBe(
      'https://contoso.sharepoint.com/sites/alfa/SitePages/Prosjektnyheter/Ny-bane.aspx?Mode=Edit'
    )
  })

  it('builds server-relative URLs without doubled slashes', () => {
    expect(
      getServerRelativeUrl('https://contoso.sharepoint.com/sites/alfa/', 'SitePages', 'Nyheter')
    ).toBe('/sites/alfa/SitePages/Nyheter')
  })

  it('takes the news site from the web part, then the setting, then the hub', () => {
    const hub = { isAvailable: true, url: 'https://contoso.sharepoint.com/sites/hub' }
    const news = 'https://contoso.sharepoint.com/sites/nyheter'
    expect(getNewsSiteUrl('https://contoso.sharepoint.com/sites/egen', news, hub)).toBe(
      'https://contoso.sharepoint.com/sites/egen'
    )
    expect(getNewsSiteUrl('', news, hub)).toBe(news)
    // A hub whose setting is turned off or blank: its news, not a message about missing access.
    expect(getNewsSiteUrl('', undefined, hub)).toBe(hub.url)
    expect(getNewsSiteUrl(undefined, '', { ...hub, isAvailable: false })).toBe('')
  })

  it('tells a refused news site from other answers', () => {
    expect(isNewsAccessDenied({ status: 403 } as any)).toBe(true)
    expect(isNewsAccessDenied({ status: 401 } as any)).toBe(true)
    expect(isNewsAccessDenied({ status: 404 } as any)).toBe(false)
    const error = newsNoAccessError()
    expect(error.message).toBe(strings.NewsNoAccessErrorText)
    expect(isUnauthorizedError(error)).toBe(true)
  })

  it('says access is missing when the news site refuses the folder', async () => {
    const spHttpClient = { get: jest.fn(() => Promise.resolve({ ok: false, status: 403 })) }
    await expect(
      ensureProjectNewsFolder(
        'https://contoso.sharepoint.com/sites/portefolje',
        spHttpClient as any,
        'Prosjektnyheter'
      )
    ).rejects.toThrow(strings.NewsNoAccessErrorText)
  })

  it('validates a file name the way SharePoint does', () => {
    expect(validateSharePointFileName('Ny bane')).toBe(true)
    expect(validateSharePointFileName('')).toBe(strings.FileNameRequired)
    expect(validateSharePointFileName('x'.repeat(101))).toBe(strings.FileNameTooLong)
    expect(validateSharePointFileName('a/b')).toBe(strings.FileNameInvalid)
    expect(validateSharePointFileName('.skjult')).toBe(strings.FileNameNoLeadingTrailingSpaces)
    expect(validateSharePointFileName('CON')).toBe(strings.FileNameReserved)
  })

  it('names a page without what a file name cannot have, so # and % never reach a REST URL', () => {
    // The name kept them, and a title with # cut the URLs short.
    expect(getNewsPageName('Sak #12: 100% klar?')).toBe('Sak-12-100-klar.aspx')
    for (const title of [
      'Sak #12: 100% klar?',
      'Hva nå? / Del 2',
      '"Stor" <dag> | 1*2;3',
      ' .Ny. '
    ]) {
      expect(validateSharePointFileName(getNewsPageName(title).replace(/\.aspx$/, ''))).toBe(true)
    }
    expect(getNewsPageName('x'.repeat(150))).toBe(`${'x'.repeat(100)}.aspx`)
    // A title of nothing but such characters leaves no name, which the dialog refuses.
    expect(validateSharePointFileName(getNewsPageName('?#%').replace(/\.aspx$/, ''))).toBe(
      strings.FileNameRequired
    )
  })

  it("doubles a ' in every REST literal, so a page named after «Prosjektets 'kick-off'» can be made", async () => {
    // The ' ended the literal early: the copy, the lookup and the recycling failed.
    const site = 'https://contoso.sharepoint.com/sites/hub-c'
    const name = getNewsPageName("Prosjektets 'kick-off'")
    expect(name).toBe("Prosjektets-'kick-off'.aspx")
    expect(validateSharePointFileName(name.replace(/\.aspx$/, ''))).toBe(true)
    const page = getServerRelativeUrl(site, 'SitePages', 'Prosjektnyheter', name)
    const urls: string[] = []
    const client = {
      get: jest.fn((url: string) => {
        urls.push(url)
        return Promise.resolve(response(true, { Id: 14 }))
      }),
      post: jest.fn((url: string) => {
        urls.push(url)
        return Promise.resolve(response(true))
      })
    }
    await doesSitePageExist(site, client as any, 'Prosjektnyheter', name)
    await copyTemplatePage(site, client as any, '/sites/hub-c/SitePages/Maler/Nyhet.aspx', page)
    await getSitePageItemId(site, client as any, page)
    await recycleSitePage(site, client as any, page)
    const literal =
      "'%2Fsites%2Fhub-c%2FSitePages%2FProsjektnyheter%2FProsjektets-''kick-off''.aspx'"
    expect(urls).toEqual([
      `${site}/_api/web/GetFileByServerRelativePath(decodedurl=${literal})?$select=Exists`,
      `${site}/_api/web/GetFileByServerRelativePath(decodedurl='%2Fsites%2Fhub-c%2FSitePages%2FMaler%2FNyhet.aspx')/copyToUsingPath(DecodedUrl=${literal},bOverWrite=false)`,
      `${site}/_api/web/GetFileByServerRelativePath(decodedurl=${literal})/ListItemAllFields?$select=Id`,
      `${site}/_api/web/GetFileByServerRelativePath(decodedurl=${literal})/recycle`
    ])
  })

  it('reaches a news folder and a template with # or % in their names, through the path APIs', async () => {
    // The URL-based calls cut such a name short at the # and read the % as an escape.
    const site = 'https://contoso.sharepoint.com/sites/hub-g'
    const folder = 'Nyheter #1 100%'
    const page = getServerRelativeUrl(site, 'SitePages', folder, 'Ny-bane.aspx')
    const template = '/sites/hub-g/SitePages/Maler/Mal #2.aspx'
    const client = recordingClient(response(true, { Exists: false, Id: 15 }))
    await ensureProjectNewsFolder(site, client as any, folder)
    await doesSitePageExist(site, client as any, folder, 'Ny-bane.aspx')
    await copyTemplatePage(site, client as any, template, page)
    await getSitePageItemId(site, client as any, page)
    await recycleSitePage(site, client as any, page)
    const folderLiteral = "'%2Fsites%2Fhub-g%2FSitePages%2FNyheter%20%231%20100%25'"
    const pageLiteral = "'%2Fsites%2Fhub-g%2FSitePages%2FNyheter%20%231%20100%25%2FNy-bane.aspx'"
    const api = `${site}/_api/web`
    expect(client.calls).toEqual([
      `GET ${api}/GetFolderByServerRelativePath(decodedurl=${folderLiteral})?$select=Exists`,
      `POST ${api}/folders/addUsingPath(DecodedUrl=${folderLiteral},overwrite=false)`,
      `GET ${api}/GetFileByServerRelativePath(decodedurl=${pageLiteral})?$select=Exists`,
      `POST ${api}/GetFileByServerRelativePath(decodedurl='%2Fsites%2Fhub-g%2FSitePages%2FMaler%2FMal%20%232.aspx')/copyToUsingPath(DecodedUrl=${pageLiteral},bOverWrite=false)`,
      `GET ${api}/GetFileByServerRelativePath(decodedurl=${pageLiteral})/ListItemAllFields?$select=Id`,
      `POST ${api}/GetFileByServerRelativePath(decodedurl=${pageLiteral})/recycle`
    ])
    expect(getNewsEditUrl(site, folder, 'Ny-bane.aspx')).toBe(
      'https://contoso.sharepoint.com/sites/hub-g/SitePages/Nyheter%20%231%20100%25/Ny-bane.aspx?Mode=Edit'
    )
  })

  it('makes the news folder only when SharePoint says it is not there', async () => {
    const site = 'https://contoso.sharepoint.com/sites/hub-h'
    const posts = async (get: ReturnType<typeof response>, post = response(true)) => {
      const client = recordingClient(get, post)
      await ensureProjectNewsFolder(site, client as any, 'Prosjektnyheter')
      return client.post.mock.calls.length
    }
    expect(await posts(response(true, { Exists: true }))).toBe(0)
    expect(await posts(response(true, { Exists: false }))).toBe(1)
    expect(await posts({ ...response(false), status: 404 })).toBe(1)
    await expect(posts(response(false))).rejects.toThrow(strings.NewsFolderError)
    await expect(
      posts(
        response(true, { Exists: false }),
        response(false, { error: { message: 'Tilgang nektet.' } })
      )
    ).rejects.toThrow(`${strings.NewsFolderError}Tilgang nektet.`)
  })

  it('finds a page only when SharePoint says it exists', async () => {
    const site = 'https://contoso.sharepoint.com/sites/hub-h'
    const exists = (get: ReturnType<typeof response>) =>
      doesSitePageExist(site, recordingClient(get) as any, 'Prosjektnyheter', 'Ny-bane.aspx')
    expect(await exists(response(true, { Exists: true }))).toBe(true)
    expect(await exists(response(true, { Exists: false }))).toBe(false)
    expect(await exists({ ...response(false), status: 404 })).toBe(false)
  })

  it('lists the templates through the path API, from Maler or else Templates', async () => {
    const site = 'https://contoso.sharepoint.com/sites/hub-i'
    const template = {
      Name: 'Nyhet.aspx',
      Title: '',
      ServerRelativeUrl: '/sites/hub-i/SitePages/Templates/Nyhet.aspx'
    }
    const client = recordingClient()
    client.get
      .mockImplementationOnce((url: string) => {
        client.calls.push(`GET ${url}`)
        return Promise.resolve(response(true, { value: [] }))
      })
      .mockImplementationOnce((url: string) => {
        client.calls.push(`GET ${url}`)
        return Promise.resolve(response(true, { value: [template] }))
      })
    expect(await getTemplates(site, client as any)).toEqual([{ ...template, Title: 'Nyhet' }])
    const files = (folder: string) =>
      `GET ${site}/_api/web/GetFolderByServerRelativePath(decodedurl='%2Fsites%2Fhub-i%2FSitePages%2F${folder}')/Files?$select=Name,Title,ServerRelativeUrl`
    expect(client.calls).toEqual([files('Maler'), files('Templates')])
  })

  it("finds a page's item through the page itself, and asks again when SharePoint does not answer", async () => {
    const site = 'https://contoso.sharepoint.com/sites/hub-e'
    const page = '/sites/hub-e/SitePages/Prosjektnyheter/Ny-bane.aspx'
    const get = jest
      .fn()
      .mockResolvedValueOnce(response(false, {}, 'Service Unavailable'))
      .mockResolvedValueOnce(response(true, { Id: 12 }))
    expect(await getSitePageItemId(site, { get } as any, page, 3, 0)).toEqual({
      itemId: 12,
      sitePagesServerRelativeUrl: '/sites/hub-e/SitePages'
    })
    expect(get).toHaveBeenCalledTimes(2)
    expect(get.mock.calls[0][0]).toBe(
      `${site}/_api/web/GetFileByServerRelativePath(decodedurl='%2Fsites%2Fhub-e%2FSitePages%2FProsjektnyheter%2FNy-bane.aspx')/ListItemAllFields?$select=Id`
    )
  })

  it("fails when a page's item cannot be found, with SharePoint's message when it gave one", async () => {
    // A filter on the file name came back empty when its request failed, and the page was left
    // without its project link.
    const site = 'https://contoso.sharepoint.com/sites/hub-e'
    const page = '/sites/hub-e/SitePages/Prosjektnyheter/Ny-bane.aspx'
    const failing = jest
      .fn()
      .mockResolvedValue(
        response(false, { error: { message: 'Terskelen for listevisningen er overskredet.' } })
      )
    await expect(getSitePageItemId(site, { get: failing } as any, page, 3, 0)).rejects.toThrow(
      'Terskelen for listevisningen er overskredet.'
    )
    expect(failing).toHaveBeenCalledTimes(3)
    const withoutItem = jest.fn().mockResolvedValue(response(true, {}))
    await expect(getSitePageItemId(site, { get: withoutItem } as any, page, 2, 0)).rejects.toThrow(
      format(strings.NewsPageItemNotFoundError, 'Ny-bane.aspx')
    )
  })

  it("copies only the project's fields that the page library and the project list both have", async () => {
    // The test hub's page library has GtHubUrl, which the project list lacks: selecting it failed
    // the query (400) after the page was copied.
    hub.fields = ['GtSiteId', 'GtProjectPhase', 'GtProjectNumber']
    hub.rows = [{ GtProjectPhase: 'Gjennomføring', GtSiteId: 'site-1' }]
    const client = httpClient(['GtSiteId', 'GtHubSiteId', 'GtHubUrl', 'GtProjectPhase'])
    await setOriginalSourceSiteId(
      'https://contoso.sharepoint.com/sites/hub-a',
      client as any,
      '/sites/hub-a/SitePages',
      7,
      'site-1',
      'hub-1',
      'Ny bane'
    )
    expect(hub.selected).toEqual(['GtProjectPhase'])
    const [url] = client.post.mock.calls[0] as any[]
    expect(url).toBe(
      "https://contoso.sharepoint.com/sites/hub-a/_api/web/GetListUsingPath(DecodedUrl='%2Fsites%2Fhub-a%2FSitePages')/items(7)"
    )
    expect(updateBody(client)).toEqual({
      GtSiteId: 'site-1',
      GtHubSiteId: 'hub-1',
      Title: 'Ny bane',
      GtProjectPhase: 'Gjennomføring'
    })
  })

  it('ties the page to the project without reading the project list when there is nothing to copy', async () => {
    hub.selected = undefined
    const client = httpClient(['GtSiteId', 'GtHubSiteId'])
    await setOriginalSourceSiteId(
      'https://contoso.sharepoint.com/sites/hub-b',
      client as any,
      '/sites/hub-b/SitePages',
      8,
      'site-2',
      'hub-1',
      'Åpning'
    )
    expect(hub.selected).toBeUndefined()
    expect(updateBody(client)).toEqual({
      GtSiteId: 'site-2',
      GtHubSiteId: 'hub-1',
      Title: 'Åpning'
    })
  })

  it('ties the page to the project with the site and hub ids when the project list refuses the user', async () => {
    // The page was made, then the news article failed on reading `Prosjekter` (403).
    hub.denied = true
    try {
      const client = httpClient(['GtSiteId', 'GtHubSiteId', 'GtProjectPhase'])
      await setOriginalSourceSiteId(
        'https://contoso.sharepoint.com/sites/hub-g',
        client as any,
        '/sites/hub-g/SitePages',
        14,
        'site-6',
        'hub-1',
        'Ekstern sak'
      )
      expect(updateBody(client)).toEqual({
        GtSiteId: 'site-6',
        GtHubSiteId: 'hub-1',
        Title: 'Ekstern sak'
      })
    } finally {
      hub.denied = false
    }
  })

  it('fails, rather than leaving the project out, when the project list fails for another reason', async () => {
    // A full-access user's article lost the project's values on a passing hub error.
    hub.failure = Object.assign(new Error('503 Service Unavailable'), { status: 503 })
    try {
      const client = httpClient(['GtSiteId', 'GtHubSiteId', 'GtProjectPhase'])
      await expect(
        setOriginalSourceSiteId(
          'https://contoso.sharepoint.com/sites/hub-h',
          client as any,
          '/sites/hub-h/SitePages',
          15,
          'site-7',
          'hub-1',
          'Driftsmelding'
        )
      ).rejects.toThrow('503 Service Unavailable')
      expect(client.post).not.toHaveBeenCalled()
    } finally {
      hub.failure = undefined
    }
  })

  it('says access is missing when the news site refuses the update that ties the page to the project', async () => {
    const refused = {
      ...response(false, { 'odata.error': { message: { value: 'Tilgang nektet.' } } }),
      status: 403
    }
    const client = httpClient([], { post: refused as any })
    const update = setOriginalSourceSiteId(
      'https://contoso.sharepoint.com/sites/hub-i',
      client as any,
      '/sites/hub-i/SitePages',
      16,
      'site-8',
      'hub-1',
      'Ekstern sak'
    )
    const error = await update.catch((thrown) => thrown)
    expect(error.message).toBe('Tilgang nektet.')
    expect(isUnauthorizedError(error)).toBe(true)
  })

  it('gives the page the title written in the dialog, in the update that ties it to the project', async () => {
    // The page kept the template's title (TestMal123 on the test hub).
    const client = httpClient(['GtSiteId', 'GtHubSiteId'])
    const tie = (itemId: number, title: string) =>
      setOriginalSourceSiteId(
        'https://contoso.sharepoint.com/sites/hub-d',
        client as any,
        '/sites/hub-d/SitePages',
        itemId,
        'site-3',
        'hub-1',
        title
      )
    await tie(9, "  Prosjektets 'kick-off'  ")
    expect(updateBody(client).Title).toBe("Prosjektets 'kick-off'")
    // No longer than a single line of text holds.
    await tie(10, 'x'.repeat(300))
    expect(updateBody(client).Title).toBe('x'.repeat(255))
  })

  it("finds the page library's fields on an English hub, where the library is not called Områdesider", async () => {
    // Looked up by title, an English hub's fields were never found, and no project field copied.
    hub.fields = ['GtSiteId', 'GtProjectPhase']
    hub.rows = [{ GtProjectPhase: 'Konsept' }]
    const client = httpClient(['GtSiteId', 'GtHubSiteId', 'GtProjectPhase'], { english: true })
    await setOriginalSourceSiteId(
      'https://contoso.sharepoint.com/sites/hub-en',
      client as any,
      '/sites/hub-en/SitePages',
      11,
      'site-4',
      'hub-1',
      'New track'
    )
    expect(updateBody(client)).toEqual({
      GtSiteId: 'site-4',
      GtHubSiteId: 'hub-1',
      Title: 'New track',
      GtProjectPhase: 'Konsept'
    })
  })

  it("asks again for the page library's fields after a request for them failed", async () => {
    // A failed request was kept for the page's lifetime, as if the library had only the link.
    hub.fields = ['GtSiteId', 'GtProjectPhase']
    hub.rows = [{ GtProjectPhase: 'Avslutning' }]
    const site = 'https://contoso.sharepoint.com/sites/hub-f'
    const client = httpClient(['GtSiteId', 'GtHubSiteId', 'GtProjectPhase'])
    client.get.mockImplementationOnce(() => Promise.resolve(response(false)))
    const tie = (itemId: number) =>
      setOriginalSourceSiteId(
        site,
        client as any,
        '/sites/hub-f/SitePages',
        itemId,
        'site-5',
        'hub-1',
        'Sak'
      )
    await tie(12)
    expect(updateBody(client).GtProjectPhase).toBeUndefined()
    await tie(13)
    expect(updateBody(client).GtProjectPhase).toBe('Avslutning')
  })

  it("moves a page to the recycle bin, and fails with SharePoint's message when it does not", async () => {
    const client = httpClient([])
    await recycleSitePage(
      'https://contoso.sharepoint.com/sites/hub-a',
      client as any,
      '/sites/hub-a/SitePages/Nyheter/Ny-bane.aspx'
    )
    expect((client.post.mock.calls[0] as any[])[0]).toBe(
      "https://contoso.sharepoint.com/sites/hub-a/_api/web/GetFileByServerRelativePath(decodedurl='%2Fsites%2Fhub-a%2FSitePages%2FNyheter%2FNy-bane.aspx')/recycle"
    )
    await expect(
      recycleSitePage(
        'https://contoso.sharepoint.com/sites/hub-a',
        httpClient([], {
          post: response(false, { error: { message: 'Tilgang nektet.' } }, 'Forbidden')
        }) as any,
        '/sites/hub-a/SitePages/Nyheter/Ny-bane.aspx'
      )
    ).rejects.toThrow('Tilgang nektet.')
    await expect(
      recycleSitePage(
        'https://contoso.sharepoint.com/sites/hub-a',
        httpClient([], { post: response(false, {}, 'Forbidden') }) as any,
        '/sites/hub-a/SitePages/Nyheter/Ny-bane.aspx'
      )
    ).rejects.toThrow('Forbidden')
  })
})
