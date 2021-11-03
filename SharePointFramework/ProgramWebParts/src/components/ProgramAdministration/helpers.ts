import { SPRest, sp } from '@pnp/sp'
import { ChildProject, ProjectChildListItem } from './types'
import * as cleanDeep from 'clean-deep'

/**
 * Fetches all projects associated with the current hubsite context
 * @param _sp SPRest
 * @returns SearchResults
 */
export async function getHubSiteProjects(_sp: SPRest) {
  const data = await _sp.site.select('HubSiteId').get()

  const searchData = await _sp.search({
    Querytext: `ContentTypeId:0x0100805E9E4FEAAB4F0EABAB2600D30DB70C* DepartmentId: ${data.HubSiteId} `,
    RowLimit: 500,
    StartRow: 0,
    ClientType: 'ContentSearchRegular',
    SelectProperties: ['GtSiteIdOWSTEXT', 'Title', 'GtSiteUrl']
  })

  console.log(searchData)
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
  const childrenSiteIds: ProjectChildListItem[] = await JSON.parse(data.GtChildProjects)
  const allProjects: any = await getHubSiteProjects(_sp)

  const enrichedProjects: ChildProject[] = allProjects.PrimarySearchResults.map(
    (project: any, idx: number) => {
      if (project?.GtSiteIdOWSTEXT == childrenSiteIds[idx]?.GtSiteIdOWSTEXT) {
        return {
          GtSiteIdOWSTEXT: project.GtSiteIdOWSTEXT,
          title: project.Title
        }
      }
    }
  )

  return enrichedProjects.filter((a) => a)
}

/**
 * Fetches projects which is not in the children array.
 * @param _sp SPRest
 * @returns ChildProject[]
 */
export async function fetchAvailableProjects(_sp: SPRest) {
  const [data] = await _sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const childrenSiteIds: ProjectChildListItem[] = await JSON.parse(data.GtChildProjects)
  const allProjects: any = await getHubSiteProjects(_sp)

  const enrichedProjects: ChildProject[] = childrenSiteIds.map((el) => {
    return allProjects.PrimarySearchResults.map((project) => {
      if (el.GtSiteIdOWSTEXT != project.GtSiteIdOWSTEXT) {
        return {
          GtSiteIdOWSTEXT: project.GtSiteIdOWSTEXT,
          title: project.Title
        }
      }
    })
  })

  return cleanDeep(enrichedProjects)
}

/**
 * Fetches additional data to the child projects
 */
async function enrichChildProjects(_sp: SPRest) {
  const data = await _sp.site.select('HubSiteId').get()

  const searchData = await _sp.search({
    Querytext: `ContentTypeId:0x0100805E9E4FEAAB4F0EABAB2600D30DB70C* DepartmentId: ${data.HubSiteId} `,
    RowLimit: 500,
    StartRow: 0,
    ClientType: 'ContentSearchRegular',
    SelectProperties: ['GtSiteIdOWSTEXT', 'Title', 'GtProjectOwner']
  })
}

/**
 * Add a child project
 */
export async function addChildProject(_sp: SPRest, project: ProjectChildListItem) {
  const [currentData] = await _sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const projects: ProjectChildListItem[] = JSON.parse(currentData.GtChildProjects)

  const updatedProjects = [...projects, project]
  const ans = await _sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.getById(1)
    .update({ GtChildProjects: JSON.stringify(updatedProjects) })
  console.log(ans)
}
