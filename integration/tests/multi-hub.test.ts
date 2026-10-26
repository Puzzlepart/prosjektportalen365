import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ISearchResult } from '@pnp/sp/search/index.js'
import { env, skipReason } from '../src/env.ts'
import { portalDataService } from '../src/library.ts'
import { connect } from '../src/sites.ts'

/**
 * What the program administration and the portfolio overview read across hubs, against the test
 * tenant: the hubs the global setting `AvailableProgramHubs` names resolve; a second hub is read
 * as the merged view reads one (a portal service configured against its URL, its own views and
 * columns, its own sites by `DepartmentId`); and one search finds the sites of every hub the
 * setting names, as the program administration's does. Read-only.
 */
const normalize = (url: string) => url.replace(/\/+$/, '').toLowerCase()
const guid = (value: unknown) =>
  String(value ?? '')
    .replace(/[{}]/g, '')
    .toLowerCase()

/** The hubs `AvailableProgramHubs` names on the hub, as the program administration reads them. */
async function availableProgramHubs(portal: { getGlobalSettings(): Promise<Map<string, string>> }) {
  const settings = await portal.getGlobalSettings()
  return (settings.get('AvailableProgramHubs') ?? '')
    .split(';')
    .map((url) => url.trim())
    .filter(Boolean)
}

describe('several hubs', { skip: skipReason('hubUrl', 'secondHubUrl') }, () => {
  it('resolves every hub AvailableProgramHubs names to a hub site, the second hub among them', async () => {
    const hub = await connect(env.hubUrl!)
    const { PortalDataService } = portalDataService()
    const portal = await new PortalDataService().configure({
      spfxContext: hub.context,
      url: hub.url
    })
    const urls = await availableProgramHubs(portal)
    assert.ok(urls.length > 0, 'AvailableProgramHubs is empty or disabled on the test hub')
    for (const url of urls) {
      assert.match(url, /^https:\/\//i, `${url} is not an absolute URL`)
      const resolved = await portal.resolveHubSiteFromUrl(url)
      assert.ok(resolved.hubSiteId, `${url} did not resolve to a hub site`)
      assert.ok(resolved.title, `${url} has no title`)
    }
    assert.ok(
      urls.map(normalize).includes(normalize(env.secondHubUrl!)),
      `INTEGRATION_SECOND_HUB_URL is not among the hubs the setting names: ${urls.join('; ')}`
    )
  })

  it('reads a second hub as the merged view does: its own views and columns, and its own sites', async () => {
    const hub = await connect(env.hubUrl!)
    const { PortalDataService } = portalDataService()
    const [primary, other] = await Promise.all([
      new PortalDataService().configure({ spfxContext: hub.context, url: hub.url }),
      // As `fetchMergedViewData` configures an adapter for another portfolio: the page's context,
      // the other hub's URL.
      new PortalDataService().configure({ spfxContext: hub.context, url: env.secondHubUrl! })
    ])
    assert.ok(other.isAvailable, 'the second hub is not available to the service')
    assert.ok(other.hubSiteId, 'the second hub has no hub site id')
    assert.notEqual(
      guid(other.hubSiteId),
      guid(primary.hubSiteId),
      'the second hub resolves to the primary hub'
    )
    const [views, columns] = await Promise.all([
      other.getPortfolioOverviewViews(),
      other.getProjectColumns()
    ])
    assert.ok(views.length > 0, 'the second hub has no portfolio views')
    assert.ok(columns.length > 0, 'the second hub has no project columns')
    // Its sites by DepartmentId, as `fetchDataForView` scopes the sites of a view.
    const results = await hub.sp.search({
      Querytext: `DepartmentId:{${other.hubSiteId}} contentclass:STS_Site`,
      RowLimit: 50,
      SelectProperties: ['SiteId', 'DepartmentId', 'Title'],
      TrimDuplicates: false
    })
    const sites = results.PrimarySearchResults as Array<ISearchResult & { DepartmentId?: string }>
    assert.ok(sites.length > 0, 'the index has no sites in the second hub')
    for (const site of sites) {
      assert.equal(
        guid(site.DepartmentId),
        guid(other.hubSiteId),
        `${site.Title} is in another hub`
      )
    }
  })

  it("finds the sites of every hub the setting names with one search, as the program administration's does", async () => {
    const hub = await connect(env.hubUrl!)
    const { PortalDataService } = portalDataService()
    const portal = await new PortalDataService().configure({
      spfxContext: hub.context,
      url: hub.url
    })
    const urls = await availableProgramHubs(portal)
    const hubSiteIds = (
      await Promise.all(urls.map((url) => portal.resolveHubSiteFromUrl(url)))
    ).map((resolved) => guid(resolved.hubSiteId))
    assert.ok(hubSiteIds.every(Boolean), 'a hub did not resolve')
    const results = await hub.sp.search({
      Querytext: `(${hubSiteIds.map((id) => `DepartmentId:{${id}}`).join(' OR ')}) contentclass:STS_Site NOT WebTemplate:TEAMCHANNEL`,
      RowLimit: 500,
      SelectProperties: ['SiteId', 'DepartmentId'],
      TrimDuplicates: false
    })
    const sites = results.PrimarySearchResults as Array<ISearchResult & { DepartmentId?: string }>
    const found = new Set(sites.map((site) => guid(site.DepartmentId)))
    for (const id of found) assert.ok(hubSiteIds.includes(id), `a site of hub ${id} was found`)
    // Every hub the setting names has sites in the index: a hub with none is a hub the
    // administration shows nothing from.
    for (const id of hubSiteIds) assert.ok(found.has(id), `no site of hub ${id} was found`)
  })
})
