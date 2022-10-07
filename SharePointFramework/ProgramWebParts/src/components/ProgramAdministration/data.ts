/* eslint-disable @typescript-eslint/no-unused-vars */
import { sp } from '@pnp/sp'
import { DataAdapter } from 'data'
import { IChildProject } from 'types'
import _ from 'underscore'

/**
 * Fetches all projects associated with the current hubsite context
 */
export async function getHubSiteProjects() {
  const data = await sp.site.select('HubSiteId').get()
  const { PrimarySearchResults } = await sp.search({
    Querytext: `DepartmentId:{${data.HubSiteId}} contentclass:STS_Site`,
    RowLimit: 500,
    StartRow: 0,
    ClientType: 'ContentSearchRegular',
    SelectProperties: ['SPWebURL', 'Title'],
    TrimDuplicates: false
  })
  return PrimarySearchResults
}

async function searchHubSite(hubId: string, query: string) {
  const searchData = await sp.search({
    Querytext: `${query} DepartmentId:{${hubId}} contentclass:STS_Site`,
    RowLimit: 500,
    StartRow: 0,
    ClientType: 'ContentSearchRegular',
    SelectProperties: ['GtSiteIdOWSTEXT', 'SPWebURL', 'Title'],
    TrimDuplicates: false
  })
  return searchData
}

/**
 * Fetches current child projects using default caching
 *
 * @param dataAdapter Data adapter
 */
export async function fetchChildProjects(dataAdapter: DataAdapter): Promise<IChildProject[]> {
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
  return _.flatten(searchResults)
}

/**
 * Fetches projects which is not in the children array.
 *
 * @param siteId Site ID
 */
export async function fetchAvailableProjects(siteId: string): Promise<any[]> {
  const [{ GtChildProjects }] = await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items
    .select('GtChildProjects')
    .usingCaching()
    .get()
  const childProjects: any[] = await JSON.parse(GtChildProjects)
  const allProjects = await getHubSiteProjects()
  const availableProjects: any[] = allProjects
    .filter(
      (project) =>
        !childProjects.some((el) => el.SiteId === project['SiteId']) && project['SiteId'] !== siteId
    )
    .filter((project) => project['SPWebURL'])
  return availableProjects.map(({ Title, SiteId, SPWebURL }) => ({
    SiteId,
    Title,
    SPWebURL
  }))
}

/**
 * Add child projects
 *
 * @param newProjects New projects to add
 */
export async function addChildProject(newProjects: IChildProject[]) {
  const [{ GtChildProjects }] = await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items
    .select('GtChildProjects')
    .get()
  const projects: IChildProject[] = JSON.parse(GtChildProjects)
  const updatedProjects = [...projects, ...newProjects]
  await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.getById(1)
    .update({ GtChildProjects: JSON.stringify(updatedProjects) })
}

/**
 * Remove child projects
 *
 * @param projectToRemove Projects to delete
 */
export async function removeChildProjects(
  projectToRemove: IChildProject[]
): Promise<IChildProject[]> {
  const [currentData] = await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const projects: IChildProject[] = JSON.parse(currentData.GtChildProjects)
  const updatedProjects = projects.filter(
    (p) => !projectToRemove.some((el) => el.SiteId === p.SiteId)
  )
  await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.getById(1)
    .update({ GtChildProjects: JSON.stringify(updatedProjects) })
  return updatedProjects
}
