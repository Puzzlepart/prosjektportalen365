import { sp } from '@pnp/sp'
import { SPDataAdapter } from 'data'
import { IProgramAdministrationProject } from './types'
import { dateAdd, PnPClientStorage } from '@pnp/common'
import { SearchQueryInit, SearchResult } from '@pnp/sp/src/search'

/**
 * Fetch items with `sp.search` using the specified `{queryTemplate}` and `{selectProperties}`.
 * Uses a `while` loop to fetch all items in batches of `{batchSize}`.
 *
 * @param queryTemplate Query template
 * @param selectProperties Select properties
 * @param batchSize Batch size (default: 500)
 */
async function fetchItems(
  queryTemplate: string,
  selectProperties: string[],
  batchSize = 500
): Promise<SearchResult[]> {
  const query: SearchQueryInit = {
    QueryTemplate: `${queryTemplate}`,
    Querytext: '*',
    RowLimit: batchSize,
    TrimDuplicates: false,
    ClientType: 'ContentSearchRegular',
    SelectProperties: [...selectProperties, 'Path', 'SPWebURL', 'SiteTitle', 'UniqueID']
  }
  const { PrimarySearchResults, TotalRows } = await sp.search(query)
  const results = [...PrimarySearchResults]
  while (results.length < TotalRows) {
    const response = await sp.search({ ...query, StartRow: results.length })
    results.push(...response.PrimarySearchResults)
  }
  return results
}

/**
 * Fetches all projects associated with the current hubsite context. This is done by querying the
 * search index for all sites with the same DepartmentId as the current hubsite and all project items with
 * the same DepartmentId as the current hubsite. The sites are then matched with the items to
 * retrieve the SiteId and SPWebURL. The result are cached for 5 minutes.
 */
export async function getHubSiteProjects() {
  const { HubSiteId } = await sp.site.select('HubSiteId').usingCaching().get()
  return new PnPClientStorage().local.getOrPut(
    `hubsiteprojects_${HubSiteId}`,
    async () => {
      const [sites, items] = await Promise.all([
        fetchItems(
          `DepartmentId:{${HubSiteId}} contentclass:STS_Site NOT WebTemplate:TEAMCHANNEL`,
          ['Title', 'SiteId']
        ),
        fetchItems(
          `DepartmentId:{${HubSiteId}} ContentTypeId:0x0100805E9E4FEAAB4F0EABAB2600D30DB70C*`,
          ['GtSiteIdOWSTEXT', 'Title']
        )
      ])
      return items
        .filter(
          (item) =>
            item['GtSiteIdOWSTEXT'] &&
            item['GtSiteIdOWSTEXT'] !== '00000000-0000-0000-0000-000000000000'
        )
        .map<IProgramAdministrationProject>((item) => {
          const site = sites.find((site) => site['SiteId'] === item['GtSiteIdOWSTEXT'])
          return {
            SiteId: item['GtSiteIdOWSTEXT'],
            Title: site?.Title ?? item['Title'],
            SPWebURL: site && site['SPWebURL']
          }
        })
    },
    dateAdd(new Date(), 'minute', 5)
  )
}

/**
 * Fetches current child projects. Fetches all available projects and filters out the ones that are not
 * in the child projects project property `GtChildProjects`.
 *
 * @param dataAdapter Data adapter
 */
export async function fetchChildProjects(dataAdapter: SPDataAdapter): Promise<any[]> {
  const availableProjects = await getHubSiteProjects()
  const childProjectsSiteIds = dataAdapter.childProjects.map((p) => p.SiteId)
  return availableProjects.filter((p) => childProjectsSiteIds.indexOf(p.SiteId) !== -1)
}

/**
 * Add child projects.
 *
 * @param dataAdapter Data adapter
 * @param newProjects New projects to add
 */
export async function addChildProjects(
  dataAdapter: SPDataAdapter,
  newProjects: Array<Record<string, string>>
) {
  const [{ GtChildProjects }] = await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const projects = JSON.parse(GtChildProjects)
  const updatedProjects = [...projects, ...newProjects]
  const updateProperties = { GtChildProjects: JSON.stringify(updatedProjects) }
  await sp.web.lists.getByTitle('Prosjektegenskaper').items.getById(1).update(updateProperties)
  await dataAdapter.updateProjectInHub(updateProperties)
}

/**
 * Remove child projects.
 *
 * @param dataAdapter Data adapter
 * @param projectToRemove Projects to delete
 */
export async function removeChildProjects(
  dataAdapter: SPDataAdapter,
  projectToRemove: Array<Record<string, string>>
): Promise<Array<Record<string, string>>> {
  const [currentData] = await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const projects: Array<Record<string, string>> = JSON.parse(currentData.GtChildProjects)
  const updatedProjects = projects.filter(
    (p) => !projectToRemove.some((el) => el.SiteId === p.SiteId)
  )
  const updateProperties = { GtChildProjects: JSON.stringify(updatedProjects) }
  await sp.web.lists.getByTitle('Prosjektegenskaper').items.getById(1).update(updateProperties)
  await dataAdapter.updateProjectInHub(updateProperties)
  return updatedProjects
}
