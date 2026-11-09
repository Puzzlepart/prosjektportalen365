import { IResolveHubUrlParams, resolveHubUrl } from './resolveHubUrl'

const WEB = 'https://contoso.sharepoint.com/sites/prosjekt'
const HUB = 'https://contoso.sharepoint.com/sites/portefolje'
const HUB_ID = '11111111-2222-3333-4444-555555555555'

/** A JSON response, or a failed one when `status` is not 200. */
function response(body: any, status = 200): Response {
  return {
    ok: status === 200,
    status,
    statusText: status === 200 ? 'OK' : 'Forbidden',
    headers: { get: () => 'application/json;odata=nometadata;charset=utf-8' },
    json: async () => body
  } as unknown as Response
}

/**
 * Parameters with REST answers per endpoint (`HubSiteData`, `GetById`) and a search answer;
 * `requests` records the endpoints in the order they were asked.
 */
function params(
  answers: { hubSiteData?: Response; getById?: Response; search?: string },
  overrides: Partial<IResolveHubUrlParams> = {}
) {
  const requests: string[] = []
  const value: IResolveHubUrlParams = {
    webUrl: WEB,
    hubSiteId: HUB_ID,
    isHubSite: false,
    fetch: async (input: string) => {
      const endpoint = input.includes('HubSiteData') ? 'hubSiteData' : 'getById'
      requests.push(endpoint)
      return answers[endpoint] ?? response(null, 403)
    },
    search: async () => {
      requests.push('search')
      return answers.search ?? ''
    },
    ...overrides
  }
  return { value, requests }
}

describe('resolveHubUrl', () => {
  it("reads the hub's URL from the site's own hub data first", async () => {
    const { value, requests } = params({
      hubSiteData: response({ value: JSON.stringify({ name: 'Portefølje', url: HUB }) })
    })
    expect(await resolveHubUrl(value)).toBe(HUB)
    expect(requests).toEqual(['hubSiteData'])
  })

  it('asks HubSites/GetById when the hub data has no URL', async () => {
    const { value, requests } = params({
      hubSiteData: response({ value: JSON.stringify({}) }),
      getById: response({ SiteUrl: HUB })
    })
    expect(await resolveHubUrl(value)).toBe(HUB)
    expect(requests).toEqual(['hubSiteData', 'getById'])
  })

  it('searches when both requests are denied', async () => {
    const { value, requests } = params({ search: HUB })
    expect(await resolveHubUrl(value)).toBe(HUB)
    expect(requests).toEqual(['hubSiteData', 'getById', 'search'])
  })

  it('does not read the hub data on the hub itself', async () => {
    const { value, requests } = params(
      { getById: response({ SiteUrl: HUB }) },
      { isHubSite: true, webUrl: HUB }
    )
    expect(await resolveHubUrl(value)).toBe(HUB)
    expect(requests).toEqual(['getById'])
  })

  it('throws, so that no empty URL is stored, when no lookup gives one', async () => {
    const lines: string[] = []
    const { value } = params({}, { log: (message) => lines.push(message) })
    await expect(resolveHubUrl(value)).rejects.toThrow(HUB_ID)
    expect(lines).toHaveLength(3)
  })

  it('reads hub data given as an object too', async () => {
    const { value } = params({ hubSiteData: response({ value: { url: HUB } }) })
    expect(await resolveHubUrl(value)).toBe(HUB)
  })
})
