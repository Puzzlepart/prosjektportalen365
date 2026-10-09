import { IProgramAdministrationProject } from 'components/ProgramAdministration/types'
import { IProgramHub } from './types'

/**
 * The site id search gives a project item that has no site.
 */
const EMPTY_SITE_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Fields a project row carries for the lists to show, and which `GtChildProjects` does not store.
 */
const DISPLAY_FIELDS = ['Created', 'Phase']

/**
 * Properties read from the hubs' project sites (`contentclass:STS_Site`); `Created` is the date
 * the site was created.
 */
export const HUB_SITE_PROJECT_SITE_PROPERTIES = [
  'SPWebURL',
  'Title',
  'SiteId',
  'Path',
  'DepartmentId',
  'Created'
]

/**
 * Properties read from the hubs' project items; the phase as the portfolio overview's phase column
 * reads it.
 */
export const HUB_SITE_PROJECT_ITEM_PROPERTIES = [
  'GtSiteIdOWSTEXT',
  'Title',
  'GtProjectPhaseTextOWSTEXT'
]

/**
 * Key of the hubs' projects in the browser's cache. The version keeps rows cached before the
 * creation date and the phase were read from being shown without them.
 *
 * @param hubSiteIds Ids of the hubs, in any order
 */
export function hubSiteProjectsCacheKey(hubSiteIds: string[]): string {
  return `HubSiteProjects_v2_${[...hubSiteIds].sort().join('_')}`
}

/**
 * Joins the project items search found in the program's hubs with their sites: one row per project
 * whose site search found, with its hub, the date the site was created and the project's phase.
 *
 * @param items Project items from search (`HUB_SITE_PROJECT_ITEM_PROPERTIES`)
 * @param sites Project sites from search (`HUB_SITE_PROJECT_SITE_PROPERTIES`)
 * @param hubs The program's hubs
 */
export function toHubSiteProjects(
  items: Record<string, any>[],
  sites: Record<string, any>[],
  hubs: IProgramHub[]
): IProgramAdministrationProject[] {
  return items
    .filter((item) => item.GtSiteIdOWSTEXT && item.GtSiteIdOWSTEXT !== EMPTY_SITE_ID)
    .map((item) => ({ item, site: sites.find((site) => site.SiteId === item.GtSiteIdOWSTEXT) }))
    .filter(({ site }) => !!site)
    .map(({ item, site }) => {
      const hubSiteId = site.DepartmentId
        ? site.DepartmentId.replace(/[{}]/g, '').toLowerCase()
        : site.DepartmentId
      const hub = hubs?.find((h) => h.hubSiteId === hubSiteId)
      return {
        SiteId: item.GtSiteIdOWSTEXT,
        Title: site.Title ?? item.Title,
        SPWebURL: site.SPWebUrl,
        Path: site.Path,
        HubSiteId: hubSiteId,
        HubSiteUrl: hub?.url,
        HubSiteTitle: hub?.title,
        Created: site.Created || undefined,
        Phase: item.GtProjectPhaseTextOWSTEXT || undefined
      }
    })
}

/**
 * A child project as `GtChildProjects` stores it: the row without the fields only shown.
 *
 * @param project A project row
 */
export function toStoredChildProject(project: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(project).filter(([field]) => !DISPLAY_FIELDS.includes(field))
  )
}
