import { IProgramHub } from 'data/types'
import { sortItems } from 'pp365-portfoliowebparts/lib/components/List/sortItems'
import { IListGroup } from 'pp365-portfoliowebparts/lib/components/List/types'

/**
 * Groups with fewer projects than this start expanded.
 */
export const AUTO_EXPAND_BELOW = 10

/**
 * The type of data in each sortable column, for `sortItems`; a column not named here sorts as text.
 */
const DATA_TYPES: Record<string, string> = { Created: 'date' }

/**
 * The column the rows are sorted by, and in which direction.
 */
export interface IProjectListSort {
  fieldName: string
  ascending: boolean
}

/** Search, sorting, hub labels and initial group-expansion settings for project rows. */
export interface IProjectRowsOptions {
  /**
   * Shows only the projects whose title contains it, ignoring case.
   */
  searchTerm?: string

  /**
   * The column to sort by.
   */
  sort: IProjectListSort

  /**
   * The program's hubs, which name the groups.
   */
  programHubs?: IProgramHub[]

  /**
   * Start every group expanded, whatever its size.
   */
  defaultGroupsExpanded?: boolean
}

/**
 * The rows to show and, when the projects come from more than one hub, their groups.
 */
export interface IProjectRows {
  rows: Record<string, any>[]
  groups?: IListGroup[]
}

/**
 * Names a hub's group: by the program's own name for the hub, else as the row knows it.
 */
function hubName(project: Record<string, any>, programHubs: IProgramHub[] = []) {
  const hub = programHubs.find((h) => h.hubSiteId === project.HubSiteId)
  return (
    hub?.title || hub?.url || project.HubSiteTitle || project.HubSiteUrl || project.HubSiteId || ''
  )
}

/**
 * Filters and sorts project rows, grouping by hub when the unfiltered list spans multiple hubs.
 * Groups expand during search, when requested, or below `AUTO_EXPAND_BELOW`.
 */
export function createProjectRows(
  projects: Record<string, any>[],
  { searchTerm = '', sort, programHubs, defaultGroupsExpanded }: IProjectRowsOptions
): IProjectRows {
  const term = searchTerm.toLowerCase()
  const found = projects.filter((project) => (project.Title ?? '').toLowerCase().includes(term))
  const sorted = sortItems(
    found,
    { fieldName: sort.fieldName, dataType: DATA_TYPES[sort.fieldName] },
    sort.ascending
  )
  const hubCount = new Set(projects.map((project) => project.HubSiteId).filter(Boolean)).size
  if (hubCount < 2) return { rows: sorted }

  const byHub = new Map<string, Record<string, any>[]>()
  sorted.forEach((project) => {
    const key = project.HubSiteId ?? ''
    byHub.set(key, [...(byHub.get(key) ?? []), project])
  })
  const hubs = Array.from(byHub.entries())
    .map(([key, rows]) => ({ key, name: hubName(rows[0], programHubs), rows }))
    .sort((a, b) => a.name.localeCompare(b.name, 'nb'))

  let startIndex = 0
  const groups = hubs.map<IListGroup>(({ key, name, rows }) => {
    const group = {
      key,
      name,
      startIndex,
      count: rows.length,
      isCollapsed: !defaultGroupsExpanded && !term && rows.length >= AUTO_EXPAND_BELOW
    }
    startIndex += rows.length
    return group
  })
  return { rows: hubs.flatMap(({ rows }) => rows), groups }
}
