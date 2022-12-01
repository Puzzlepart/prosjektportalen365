/* eslint-disable @typescript-eslint/no-unused-vars */
import { flatten } from '@microsoft/sp-lodash-subset'
import { SPFI } from '@pnp/sp'
import '@pnp/sp/sites'
import { IProgramAdministrationContext } from './context'

/**
 * Fetches all projects associated with the current hubsite context
 * 
 * @param sp SPFI
 */
export async function getHubSiteProjects(sp: SPFI): Promise<any[]> {
  const data = await sp.site.select('HubSiteId')()
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

/**
 * Search hub site
 *
 * @param sp SPFI
 * @param hubSiteId Hub site ID
 * @param queryText Query text
 */
async function searchHubSite(sp: SPFI, hubSiteId: string, queryText: string) {
  const searchData = await sp.search({
    Querytext: `${queryText} DepartmentId:{${hubSiteId}} contentclass:STS_Site`,
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
 * @param context Context object
 */
export async function fetchChildProjects(context: IProgramAdministrationContext): Promise<Array<Record<string, string>>> {
  const queryArray = context.props.dataAdapter.aggregatedQueryBuilder('SiteId')
  const hubData = await context.props.sp.site.select('HubSiteId')()
  const searchPromises = []
  for (const query of queryArray) {
    searchPromises.push(searchHubSite(context.props.sp, hubData.HubSiteId, query))
  }
  const responses: any[] = await Promise.all(searchPromises)
  const searchResults = []
  responses.forEach((response) => {
    searchResults.push(response.PrimarySearchResults)
  })
  return flatten(searchResults)
}

/**
 * Add child projects
 *
 * @param context Context object
 */
export async function addChildProject(context: IProgramAdministrationContext) {
  const [{ GtChildProjects }] = await context.props.sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')()
  const projects = JSON.parse(GtChildProjects)
  const updatedProjects = [...projects, ...context.state.selectedProjectsToAdd]
  const updateProperties = { GtChildProjects: JSON.stringify(updatedProjects) }
  await context.props.sp.web.lists.getByTitle('Prosjektegenskaper').items.getById(1).update(updateProperties)
  await context.props.dataAdapter.updateProjectInHub(updateProperties)
}

/**
 * Remove child projects
 *
 * @param context Context object
 */
export async function removeChildProjects(context: IProgramAdministrationContext): Promise<Array<Record<string, string>>> {
  const [currentData] = await context.props.sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')()
  const projects: Array<Record<string, string>> = JSON.parse(currentData.GtChildProjects)
  const updatedProjects = projects.filter(
    (p) => !context.state.selectedProjectsToDelete.some((el) => el.SiteId === p.SiteId)
  )
  const updateProperties = { GtChildProjects: JSON.stringify(updatedProjects) }
  await context.props.sp.web.lists.getByTitle('Prosjektegenskaper').items.getById(1).update(updateProperties)
  await context.props.dataAdapter.updateProjectInHub(updateProperties)
  return updatedProjects
}
