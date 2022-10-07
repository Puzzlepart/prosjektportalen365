/* eslint-disable @typescript-eslint/no-unused-vars */
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPRest } from '@pnp/sp'
import { ChildProject } from 'models'
import _ from 'underscore'

/**
 * Fetches all projects associated with the current hubsite context
 *
 * @param _sp SPRest
 */
export async function getHubSiteProjects(_sp: SPRest) {
  const data = await _sp.site.select('HubSiteId').get()
  const { PrimarySearchResults } = await _sp.search({
    Querytext: `DepartmentId:{${data.HubSiteId}} contentclass:STS_Site`,
    RowLimit: 500,
    StartRow: 0,
    ClientType: 'ContentSearchRegular',
    SelectProperties: ['SPWebURL', 'Title'],
    TrimDuplicates: false
  })
  return PrimarySearchResults
}

async function batchFetch(sp: SPRest, hubId: string, query: string) {
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
 * Fetches current child projects
 *
 * @param sp SPRest instance
 */
export async function fetchChildProjects(sp: SPRest, dataAdapter: any): Promise<ChildProject[]> {
  const queryArray = dataAdapter.aggregatedQueryBuilder('SiteId')
  const hubData = await sp.site.select('HubSiteId').get()
  const searchPromises = []
  for (const query of queryArray) {
    searchPromises.push(batchFetch(sp, hubData.HubSiteId, query))
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
 * @param sp SPRest instance
 * @param context Web part context
 */
export async function fetchAvailableProjects(sp: SPRest, context: WebPartContext): Promise<any[]> {
  const [currentProject] = await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const childrenSiteIds: any[] = await JSON.parse(currentProject.GtChildProjects)
  const allProjects = await getHubSiteProjects(sp)
  const availableProjects: any[] = allProjects
    .filter(
      (project) =>
        !childrenSiteIds.some((el) => el.SiteId === project['SiteId']) &&
        project['SiteId'] !== context.pageContext.site.id.toString()
    )
    .filter((project) => project['SPWebURL'])
  const mappedProjects: any[] = availableProjects.map(({ Title, SiteId, SPWebURL }) => {
    return {
      SiteId,
      Title,
      SPWebURL
    }
  })
  return mappedProjects
}

/**
 * Add a child project
 */
export async function addChildProject(sp: SPRest, newProjects: ChildProject[]) {
  const [currentData] = await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const projects: ChildProject[] = JSON.parse(currentData.GtChildProjects)
  const updatedProjects = [...projects, ...newProjects]

  await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.getById(1)
    .update({ GtChildProjects: JSON.stringify(updatedProjects) })
}

/**
 * Remove child elements
 */
export async function removeChildProjects(sp: SPRest, toDelete: ChildProject[]) {
  const [currentData] = await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const projects: ChildProject[] = JSON.parse(currentData.GtChildProjects)
  const updatedProjects = projects.filter((p) => !toDelete.some((el) => el.SiteId === p.SiteId))
  await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.getById(1)
    .update({ GtChildProjects: JSON.stringify(updatedProjects) })
}
