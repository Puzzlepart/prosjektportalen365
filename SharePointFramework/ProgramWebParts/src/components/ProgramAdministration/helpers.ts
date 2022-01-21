import { SPRest } from '@pnp/sp'
import { ChildProject } from 'models'
import _ from 'underscore'

/**
 * Fetches all projects associated with the current hubsite context
 * @param _sp SPRest
 * @returns SearchResults
 */
export async function getHubSiteProjects(_sp: SPRest) {
  const data = await _sp.site.select('HubSiteId').get()
  const searchData = await _sp.search({
    Querytext: `DepartmentId:{${data.HubSiteId}} contentclass:STS_Site`,
    RowLimit: 500,
    StartRow: 0,
    ClientType: 'ContentSearchRegular',
    SelectProperties: ['SPWebURL', 'Title'],
    TrimDuplicates: false
  })
  return searchData
}

async function batchFetch(_sp, hubId, query) {
    const searchData = await _sp.search({
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
 * @param _sp SPRest
 * @returns ChildProject[]
 */
export async function getChildProjects(_sp: SPRest, dataAdapter: any): Promise<ChildProject[]> {
  const queryArray = dataAdapter.aggregatedQueryBuilder()
  const hubData = await _sp.site.select('HubSiteId').get()
  const searchPromises = []
  for (const query of queryArray) {
    searchPromises.push(batchFetch(_sp, hubData.HubSiteId, query))
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
 * @param _sp SPRest
 * @returns ChildProject[]
 */
export async function fetchAvailableProjects(_sp: SPRest) {
  const [currentProjects] = await _sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const childrenSiteIds: any[] = await JSON.parse(currentProjects.GtChildProjects)
  const allProjects: any = await getHubSiteProjects(_sp)
  let availableProjects = allProjects.PrimarySearchResults.filter((project) => {
    return !childrenSiteIds.some((el) => el.SiteId === project.SiteId)
  })
  availableProjects = availableProjects.filter((project) => project.SPWebURL)

  const mappedProjects = availableProjects.map(proj => {
    return {
      SiteId: proj.SiteId,
      Title: proj.Title,
      SPWebURL: proj.SPWebURL
    }
  })
  return mappedProjects
}

/**
 * Add a child project
 */
export async function addChildProject(_sp: SPRest, newProjects: ChildProject[]) {
  const [currentData] = await _sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const projects: ChildProject[] = JSON.parse(currentData.GtChildProjects)
  const updatedProjects = [...projects, ...newProjects]

  await _sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.getById(1)
    .update({ GtChildProjects: JSON.stringify(updatedProjects) })
}

/**
 * Remove child elements
 */
export async function removeChildProjects(_sp: SPRest, toDelete: ChildProject[]) {
  const [currentData] = await _sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const projects: ChildProject[] = JSON.parse(currentData.GtChildProjects)
  const updatedProjects = projects.filter((p) => !toDelete.some((el) => el.SiteId === p.SiteId))

  await _sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.getById(1)
    .update({ GtChildProjects: JSON.stringify(updatedProjects) })
}
