/* eslint-disable @typescript-eslint/no-unused-vars */
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPRest } from '@pnp/sp'
import { IChildProject } from 'types'
import _ from 'underscore'
import { IChildProjectListItem } from './types'

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

async function searchHubSite(sp: SPRest, hubId: string, query: string) {
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
 * @param sp SPRest instance
 */
export async function fetchChildProjects(sp: SPRest, dataAdapter: any): Promise<IChildProject[]> {
  const queryArray = dataAdapter.aggregatedQueryBuilder('SiteId')
  const hubData = await sp.site.select('HubSiteId').get()
  const searchPromises = []
  for (const query of queryArray) {
    searchPromises.push(searchHubSite(sp, hubData.HubSiteId, query))
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
export async function fetchAvailableProjects(sp: SPRest, context: WebPartContext): Promise<IChildProjectListItem[]> {
  const [{ GtChildProjects }] = await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items
    .select('GtChildProjects')
    .usingCaching()
    .get()
  const childProjects: any[] = await JSON.parse(GtChildProjects)
  const allProjects = await getHubSiteProjects(sp)
  const availableProjects: any[] = allProjects
    .filter(
      (project) =>
        !childProjects.some((el) => el.SiteId === project['SiteId']) &&
        project['SiteId'] !== context.pageContext.site.id.toString()
    )
    .filter((project) => project['SPWebURL'])
  const mappedProjects: IChildProjectListItem[] = availableProjects.map(({ Title, SiteId, SPWebURL }) => ({
    SiteId,
    Title,
    SPWebURL
  }))
  return mappedProjects
}

/**
 * Add child projects
 * 
 * @param sp SPRest instance
 * @param newProjects New projects to add
 */
export async function addChildProject(sp: SPRest, newProjects: IChildProject[]) {
  const [{ GtChildProjects }] = await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const projects: IChildProject[] = JSON.parse(GtChildProjects)
  const updatedProjects = [...projects, ...newProjects]
  await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.getById(1)
    .update({ GtChildProjects: JSON.stringify(updatedProjects) })
}

/**
 * Remove child elements
 */
export async function removeChildProjects(sp: SPRest, toDelete: IChildProject[]): Promise<IChildProject[]> {
  const [currentData] = await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const projects: IChildProject[] = JSON.parse(currentData.GtChildProjects)
  const updatedProjects = projects.filter((p) => !toDelete.some((el) => el.SiteId === p.SiteId))
  await sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.getById(1)
    .update({ GtChildProjects: JSON.stringify(updatedProjects) })
  return updatedProjects
}
