/* eslint-disable @typescript-eslint/no-unused-vars */
import { flatten } from '@microsoft/sp-lodash-subset'
import { sp } from '@pnp/sp'
import { SPDataAdapter } from 'data'
import { IProgramAdministrationProject } from './types'

/**
 * Fetches all projects associated with the current hubsite context. This is done by querying the
 * search index for all sites with the same DepartmentId as the current hubsite and all project items with
 * the same DepartmentId as the current hubsite. The sites are then matched with the items to
 * retrieve the SiteId and SPWebURL.
 */
export async function getHubSiteProjects() {
  const { HubSiteId } = await sp.site.select('HubSiteId').get()
  const [{ PrimarySearchResults: sts_sites }, { PrimarySearchResults: items }] = await Promise.all([
    sp.search({
      Querytext: `DepartmentId:{${HubSiteId}} contentclass:STS_Site NOT WebTemplate:TEAMCHANNEL`,
      RowLimit: 500,
      StartRow: 0,
      ClientType: 'ContentSearchRegular',
      SelectProperties: ['SPWebURL', 'Title', 'SiteId'],
      TrimDuplicates: false
    }),
    sp.search({
      Querytext: `DepartmentId:{${HubSiteId}} ContentTypeId:0x0100805E9E4FEAAB4F0EABAB2600D30DB70C*`,
      RowLimit: 500,
      StartRow: 0,
      ClientType: 'ContentSearchRegular',
      SelectProperties: ['GtSiteIdOWSTEXT', 'Title'],
      TrimDuplicates: false
    })
  ])
  return items
    .filter((item) => item['GtSiteIdOWSTEXT'] && item['GtSiteIdOWSTEXT'] !== '00000000-0000-0000-0000-000000000000')
    .map<IProgramAdministrationProject>((item) => {
      const site = sts_sites.find((site) => site['SiteId'] === item['GtSiteIdOWSTEXT'])
      return {
        SiteId: item['GtSiteIdOWSTEXT'],
        Title: site?.Title ?? item['Title'],
        SPWebURL: site && site['SPWebURL'],
      }
    })
}

/**
 * Searches the search index for items with the same DepartmentId as the current hubsite using
 * the specified query text.
 * 
 * @param hubSiteId Hub site id
 * @param queryText Query text
 */
async function searchHubSite(hubSiteId: string, queryText: string) {
  const searchData = await sp.search({
    Querytext: `${queryText} DepartmentId:{${hubSiteId}} contentclass:STS_Site NOT WebTemplate:TEAMCHANNEL`,
    RowLimit: 500,
    StartRow: 0,
    ClientType: 'ContentSearchRegular',
    SelectProperties: ['GtSiteIdOWSTEXT', 'SPWebURL', 'Title'],
    TrimDuplicates: false
  })
  return searchData
}

/**
 * Fetches current child projects using default caching.
 *
 * @param dataAdapter Data adapter
 */
export async function fetchChildProjects(
  dataAdapter: SPDataAdapter
): Promise<Array<Record<string, string>>> {
  const queryArray = dataAdapter.aggregatedQueryBuilder('SiteId')
  const hubData = await sp.site.select('HubSiteId').get()
  const searchPromises = []
  for (const query of queryArray) {
    searchPromises.push(searchHubSite(hubData.HubSiteId, query))
  }
  const responses: any[] = await Promise.all(searchPromises)
  const searchResults = []
  responses.forEach((response) => {
    searchResults.push(response.PrimarySearchResults)
  })
  return flatten(searchResults)
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
