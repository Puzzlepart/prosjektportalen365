import { SPRest, sp } from '@pnp/sp'
import { ChildProject } from 'models'

/**
 * Fetches all projects associated with the current hubsite context
 * @param _sp SPRest
 * @returns SearchResults
 */
export async function getHubSiteProjects(_sp: SPRest) {
  const data = await _sp.site.select('HubSiteId').get()
  const searchData = await _sp.search({
    Querytext: `ContentTypeId:0x0100805E9E4FEAAB4F0EABAB2600D30DB70C* DepartmentId:{${data.HubSiteId}}`,
    RowLimit: 500,
    StartRow: 0,
    ClientType: 'ContentSearchRegular',
    SelectProperties: ['GtSiteIdOWSTEXT', 'Title', 'GtSiteUrlOWSTEXT']
  })

  return searchData
}

/**
 * Fetches current child projects
 * @param _sp SPRest
 * @returns ChildProject[]
 */
export async function fetchChildProjects(_sp: SPRest) {
  const [data] = await _sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const children: ChildProject[] = await JSON.parse(data.GtChildProjects)

  return children.filter((a) => a)
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
  const childrenSiteIds: ChildProject[] = await JSON.parse(currentProjects.GtChildProjects)
  const allProjects: any = await getHubSiteProjects(_sp)

  const availableProjects = allProjects.PrimarySearchResults.filter((project) => {
    return !childrenSiteIds.some((el) => el.SiteId === project.GtSiteIdOWSTEXT)
  })

  const mappedProjects = availableProjects.map(proj => {
    return {
      SiteId: proj.GtSiteIdOWSTEXT,
      Title: proj.Title,
      GtSiteUrlOWSTEXT: proj.GtSiteUrlOWSTEXT
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

  const ans = await _sp.web.lists
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
