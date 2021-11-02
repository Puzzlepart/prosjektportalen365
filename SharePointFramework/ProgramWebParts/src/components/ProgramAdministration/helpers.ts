import { SPRest, sp } from '@pnp/sp'
import { IChildProject } from './types'

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
    SelectProperties: ['GtSiteIdOWSTEXT', 'Title', 'GtProjectOwner']
  })

  console.log(searchData)
  return searchData
}

/**
 * Fetches current child projects
 */
export async function fetchChildProjects(_sp: SPRest) {
  const [data] = await _sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const children = await JSON.parse(data.GtChildProjects)

  return children
}

/**
 * Add a child project
 */
export async function addChildProject(_sp: SPRest, project: IChildProject) {
  const [currentData] = await _sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.select('GtChildProjects')
    .get()
  const projects: IChildProject[] = JSON.parse(currentData.GtChildProjects)

  const updatedProjects = [...projects, project]
  const ans = await _sp.web.lists
    .getByTitle('Prosjektegenskaper')
    .items.getById(1)
    .update({ GtChildProjects: JSON.stringify(updatedProjects) })
  console.log(ans)
}
