// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Every `@pnp/*` import maps to the one PnP stub, so the mock of
// `@pnp/core` is all of them in this file: it keeps the stub and only lets `PnPClientStorage` keep
// the hub's URL in `stored`, as localStorage keeps it from one load of a page to the next.
const stored = new Map<string, string>()
jest.mock('@pnp/core', () => {
  const stub = jest.requireActual('@pnp/core')
  class PnPClientStorage {
    public local = {
      getOrPut: async (key: string, getter: () => Promise<string>) => {
        if (!stored.has(key)) stored.set(key, await getter())
        return stored.get(key)
      },
      delete: (key: string) => {
        stored.delete(key)
      }
    }
  }
  return new Proxy(stub, {
    get: (target, prop) => (prop === 'PnPClientStorage' ? PnPClientStorage : target[prop])
  })
})

import { PortalDataService } from './PortalDataService'
import { PortalDataServiceDefaultConfiguration } from './types'

const SITE = 'https://contoso.sharepoint.com/sites/prosjekt'
const SITE_ID = '{a1b2c3d4-0000-4000-8000-000000000002}'
const HUB = 'https://contoso.sharepoint.com/sites/portefolje'
const HUB_ID = 'a1b2c3d4-0000-4000-8000-000000000001'

/** What search answers an empty hub id with: any address, here a form of a list on another site. */
const ANY_ADDRESS =
  'https://contoso.sharepoint.com/sites/annet/Lists/Prosjekter/DispForm.aspx?ID=193'

/** The key an address was stored under, for a year, as the hub of every site without one. */
const NO_HUB_KEY = 'hubsite__url'

/** The key the address of the hub is stored under. */
const HUB_KEY = `hubsite_${HUB_ID.replace(/-/g, '')}_url`

/**
 * A service on a page of the site, or of the hub itself with `onHub`, with the hub id the page
 * gives it, initialised as `configure` initialises it. The site's own hub data answers with
 * `hubUrl`, `HubSites/GetById` with the hub's address on the hub itself and with nothing elsewhere,
 * and search with `ANY_ADDRESS`, whatever it is asked.
 */
async function initialised(hubSiteId: string, { hubUrl = '', onHub = false } = {}) {
  const search = jest.fn(() => Promise.resolve({ PrimarySearchResults: [{ Path: ANY_ADDRESS }] }))
  const answer = (url: string) => {
    if (url.includes('HubSiteData')) return { value: JSON.stringify(hubUrl ? { url: hubUrl } : {}) }
    return onHub ? { SiteUrl: HUB } : {}
  }
  const fetched = jest.fn((url: string) =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json;odata=nometadata' },
      json: () => Promise.resolve(answer(url))
    })
  )
  ;(globalThis as any).fetch = fetched
  const localWeb = { url: onHub ? HUB : SITE }
  const service = new PortalDataService()
  ;(service as any)._sp = { web: localWeb, search }
  ;(service as any)._configuration = {
    ...PortalDataServiceDefaultConfiguration,
    spfxContext: {
      pageContext: {
        web: { absoluteUrl: localWeb.url },
        legacyPageContext: { siteId: onHub ? `{${hubSiteId}}` : SITE_ID, hubSiteId }
      }
    }
  }
  await (service as any).onInit()
  const requests = fetched.mock.calls.map(([url]) => url)
  return { service, search, requests, localWeb }
}

const realFetch = (globalThis as any).fetch

beforeEach(() => stored.clear())

afterEach(() => {
  ;(globalThis as any).fetch = realFetch
})

describe('PortalDataService and the hub of the page', () => {
  it.each([[''], [undefined], ['00000000-0000-0000-0000-000000000000']])(
    'looks nothing up, and stores nothing, for a site without a hub (hub id %p)',
    async (hubSiteId) => {
      const { service, search, requests, localWeb } = await initialised(hubSiteId)
      expect(requests).toEqual([])
      expect(search).not.toHaveBeenCalled()
      expect(stored.size).toBe(0)
      expect(service.isAvailable).toBe(false)
      expect(service.unavailableStatus).toBeUndefined()
      expect(service.url).toBeUndefined()
      // The site's own web stays: a list of the hub is asked for there, and not found, rather
      // than on another site.
      expect(service.web).toBe(localWeb)
    }
  )

  it('forgets the address an earlier version stored as the hub of sites without one', async () => {
    stored.set(NO_HUB_KEY, ANY_ADDRESS)
    const { service } = await initialised('')
    expect(stored.has(NO_HUB_KEY)).toBe(false)
    expect(service.isAvailable).toBe(false)
    expect(service.url).toBeUndefined()
  })

  it("finds the hub of a site that has one, and stores its address under the hub's id", async () => {
    const { service, search, requests } = await initialised(HUB_ID, { hubUrl: HUB })
    expect(service.url).toBe(HUB)
    expect(service.isAvailable).toBe(true)
    expect(requests).toEqual([`${SITE}/_api/web/HubSiteData(false)`])
    expect(search).not.toHaveBeenCalled()
    expect(Array.from(stored.entries())).toEqual([[HUB_KEY, HUB]])
  })

  it('asks HubSites/GetById, and not for hub data, on the hub itself', async () => {
    const { service, search, requests } = await initialised(HUB_ID, { onHub: true })
    expect(service.url).toBe(HUB)
    expect(service.isAvailable).toBe(true)
    expect(requests).toEqual([`${HUB}/_api/HubSites/GetById('${HUB_ID}')`])
    expect(search).not.toHaveBeenCalled()
    expect(Array.from(stored.entries())).toEqual([[HUB_KEY, HUB]])
  })

  it('keeps a site with a hub from the address stored for sites without one', async () => {
    stored.set(NO_HUB_KEY, ANY_ADDRESS)
    const { service } = await initialised(HUB_ID, { hubUrl: HUB })
    expect(service.url).toBe(HUB)
    expect(stored.get(HUB_KEY)).toBe(HUB)
  })
})
