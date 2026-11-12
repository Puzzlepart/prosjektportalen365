/**
 * What `resolveHubUrl` needs. The requests are passed in, so the order of the lookups can be
 * tested without SharePoint.
 */
export interface IResolveHubUrlParams {
  /**
   * Absolute URL of the current web.
   */
  webUrl: string

  /**
   * ID of the hub the current site is associated with (`legacyPageContext.hubSiteId`).
   */
  hubSiteId: string

  /**
   * Whether the current site is itself the hub.
   */
  isHubSite: boolean

  /**
   * The `fetch` to send the REST requests with.
   */
  fetch: (input: string, init?: RequestInit) => Promise<Response>

  /**
   * Finds the hub's URL with search, the last resort.
   */
  search: (hubSiteId: string) => Promise<string>

  /**
   * Receives a line about each lookup that gave no URL (optional).
   */
  log?: (message: string) => void
}

const JSON_HEADERS = { Accept: 'application/json;odata=nometadata' }

/**
 * Reads the JSON body of a REST response, or throws when the response is not JSON.
 */
async function readJson(response: Response): Promise<any> {
  if (!response.ok) {
    throw new Error(`responded with ${response.status} ${response.statusText}`)
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(`returned non-JSON content-type: ${contentType}`)
  }
  return await response.json()
}

/**
 * The hub's URL from the data the current site holds about its hub (`HubSiteData`), the data
 * SharePoint draws the hub navigation from. Everyone who can read the site can read it, also
 * without access to the hub itself.
 */
async function fromHubSiteData({ webUrl, fetch }: IResolveHubUrlParams): Promise<string> {
  const body = await readJson(
    await fetch(`${webUrl}/_api/web/HubSiteData(false)`, {
      method: 'GET',
      headers: JSON_HEADERS,
      credentials: 'include'
    })
  )
  // The function returns the data as a JSON string.
  const data = typeof body?.value === 'string' ? JSON.parse(body.value) : (body?.value ?? body)
  return data?.url ?? ''
}

/**
 * The hub's URL from `HubSites/GetById`, which answers only users who can read the hub.
 */
async function fromHubSitesById({ webUrl, hubSiteId, fetch }: IResolveHubUrlParams) {
  const hubSite = await readJson(
    await fetch(`${webUrl}/_api/HubSites/GetById('${encodeURIComponent(hubSiteId)}')`, {
      method: 'GET',
      headers: JSON_HEADERS,
      credentials: 'include'
    })
  )
  return hubSite?.SiteUrl ?? ''
}

/**
 * Finds the URL of the hub the current site is associated with. A site that is not itself the
 * hub reads its own hub data first, so a user with access to some of the hub's lists only (the
 * group «Minimum lesetilganger på hub») finds the hub too. Then `HubSites/GetById`, then search.
 *
 * @returns The hub's absolute URL
 *
 * @throws When no lookup gives a URL, so that no empty URL is stored for later page loads
 */
export async function resolveHubUrl(params: IResolveHubUrlParams): Promise<string> {
  const lookups: { name: string; lookup: () => Promise<string> }[] = []
  if (!params.isHubSite) {
    lookups.push({ name: 'HubSiteData', lookup: () => fromHubSiteData(params) })
  }
  lookups.push(
    { name: 'HubSites/GetById', lookup: () => fromHubSitesById(params) },
    { name: 'search', lookup: () => params.search(params.hubSiteId) }
  )
  for (const { name, lookup } of lookups) {
    try {
      const url = await lookup()
      if (url) return url
      params.log?.(`${name} gave no hub URL`)
    } catch (error) {
      params.log?.(`${name} failed: ${(error as Error)?.message ?? error}`)
    }
  }
  throw new Error(`No hub URL found for the hub site ID ${params.hubSiteId}`)
}
