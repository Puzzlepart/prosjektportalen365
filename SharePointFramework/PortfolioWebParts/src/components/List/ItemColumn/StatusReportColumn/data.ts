import { IList } from '@pnp/sp/lists'
import { IWeb, Web } from '@pnp/sp/webs'
import _ from 'lodash'
import {
  getStatusShapes,
  IListColumn,
  IStatusShape,
  IStatusValueConfig,
  parseScopedSiteId,
  ProjectColumn
} from 'pp365-shared-library'
import { STATUS_REPORT_COLUMN_DEFAULT_PROPS } from './defaults'
import {
  IStatusColumnProps,
  IStatusReport,
  IStatusReportColumnData,
  IStatusSectionDefinition
} from './types'

/** Reports read per request: 50 `Id eq` clauses keep the request's address short. */
const REPORTS_PER_REQUEST = 50

/** The fields of the status sections that become tiles. */
const STATUS_FIELD_PREFIX = 'GtStatus'

/** The report's overall status: a text shown in the details, never a tile. */
const OVERALL_STATUS_FIELD = 'GtOverallStatus'

/** The colour and the shape of each value of one status field. */
interface IStatusFieldConfig {
  colors: Record<string, string>
  shapes: Record<string, IStatusShape>
}

/**
 * Whether a row is the configured hub's, whose `StatusReportId` names an item of that hub's
 * report list: every row outside a merged view (no `_hubId`), and the primary hub's rows in one
 * (`_isPrimaryHub`). Another hub's row names an item of its own hub's list.
 */
export function isConfiguredHubRow(item: Record<string, any>): boolean {
  return !item?._hubId || !!item?._isPrimaryHub
}

/** Whether an id can be a list item's: a whole number above zero. */
function isItemId(id: number): boolean {
  return Number.isInteger(id) && id > 0
}

/**
 * The report ids the configured hub's rows carry (`StatusReportId`, the latest published report
 * of the row's series, as search found it) for reports in the hub's list, each once, and only
 * whole numbers above zero. A report on a shielded project's own site (`StatusReportWebUrl`) is
 * read from there.
 */
function getReportIds(items: Record<string, any>[]): number[] {
  const hubRows = items.filter((item) => isConfiguredHubRow(item) && !item?.StatusReportWebUrl)
  const ids = hubRows.map((item) => Number(item?.StatusReportId))
  return _.uniq(ids.filter(isItemId))
}

/**
 * The report ids of the configured hub's rows whose report is on a shielded project's own site,
 * by that site (`StatusReportWebUrl`), each once. Another hub's rows show no report in a merged
 * view, shielded or not: a report is drawn with the configured hub's sections, which may not be
 * the other hub's.
 */
function getShieldedReportIds(items: Record<string, any>[]): Map<string, number[]> {
  const idsByWeb = new Map<string, number[]>()
  for (const item of items.filter(isConfiguredHubRow)) {
    const webUrl: string = item?.StatusReportWebUrl
    const id = Number(item?.StatusReportId)
    if (!webUrl || !isItemId(id)) continue
    idsByWeb.set(webUrl, _.uniq([...(idsByWeb.get(webUrl) ?? []), id]))
  }
  return idsByWeb
}

/** `Id eq 1 or Id eq 2 …`: a list item's id is indexed, so the filter holds past 5 000 items. */
function getIdFilter(ids: number[]): string {
  return ids.map((id) => `Id eq ${id}`).join(' or ')
}

/**
 * The reports by id, 50 to a request, all requests at once. Every field is read, so the hub's own
 * section fields come too, and none is filtered on publishing: search chose published reports.
 */
async function getReports(list: IList, ids: number[]): Promise<Record<string, any>[]> {
  const chunks = _.chunk(ids, REPORTS_PER_REQUEST)
  const results = await Promise.all(
    chunks.map((chunk) => list.items.filter(getIdFilter(chunk)).top(chunk.length)())
  )
  return _.flatten(results)
}

/**
 * The reports of shielded projects, read by id from the status report list on each project's own
 * site, which has the hub list's name and fields. Each site is read on its own: one the user may
 * not read, or that fails, gives no reports and leaves the other rows' reports in.
 *
 * @param web The hub's web, whose configuration the project sites are read with
 * @param listName The status report list's name
 * @param idsByWeb The report ids by project site
 */
async function getShieldedReports(
  web: IWeb,
  listName: string,
  idsByWeb: Map<string, number[]>
): Promise<{ item: Record<string, any>; webUrl: string }[]> {
  const results = await Promise.all(
    Array.from(idsByWeb, async ([webUrl, ids]) => {
      try {
        const items = await getReports(Web([web, webUrl]).lists.getByTitle(listName), ids)
        return items.map((item) => ({ item, webUrl }))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('(StatusReportColumn) Could not read the reports of a shielded project.', {
          webUrl,
          error
        })
        return []
      }
    })
  )
  return _.flatten(results)
}

/**
 * Each status field's values from `Prosjektkolonnekonfigurasjon`, read in the order they were
 * configured in: their colours, and the shapes `getStatusShapes` gives out in that order.
 */
function getFieldConfigs(configItems: Record<string, any>[]): Record<string, IStatusFieldConfig> {
  const itemsByField = _.groupBy(configItems, (item) => item.GtPortfolioColumn?.GtInternalName)
  return _.mapValues(itemsByField, (fieldItems) => {
    const values: IStatusValueConfig[] = fieldItems.map((item) => ({
      value: item.GtPortfolioColumnValue,
      color: item.GtPortfolioColumnColor,
      iconName: item.GtPortfolioColumnIconName
    }))
    return {
      colors: _.fromPairs(values.map(({ value, color }) => [value, color])),
      shapes: getStatusShapes(values)
    }
  })
}

/**
 * The status sections that become tiles, in the order the status page shows them (`GtSortOrder`,
 * compared as the status page compares it): the `GtStatus*` fields shown in the status section.
 * The overall status is no tile: its section's title heads it in the details.
 */
function getSectionDefinitions(
  sectionItems: Record<string, any>[],
  configs: Record<string, IStatusFieldConfig>
): IStatusSectionDefinition[] {
  const sorted = [...sectionItems].sort((a, b) => (a.GtSortOrder < b.GtSortOrder ? -1 : 1))
  const shown = sorted.filter((item) => item.GtSecShowInStatusSection && isStatusField(item))
  return shown.map((item) => ({
    fieldName: item.GtSecFieldName,
    name: item.Title,
    iconName: item.GtSecIcon || undefined,
    colors: configs[item.GtSecFieldName]?.colors ?? {},
    shapes: configs[item.GtSecFieldName]?.shapes ?? {}
  }))
}

/** Whether a section shows a status field (`GtStatus*`), which becomes a tile. */
function isStatusField(sectionItem: Record<string, any>): boolean {
  return _.startsWith(sectionItem.GtSecFieldName, STATUS_FIELD_PREFIX)
}

/** The shape of a section's value: `empty` without a value, `unknown` for one not configured. */
function getShape(section: IStatusSectionDefinition, value?: string): IStatusShape {
  if (!value) return { shape: 'empty' }
  return section.shapes[value] ?? { shape: 'unknown' }
}

/**
 * A report as the cells show it: its sections in the hub's order, each with its value's shape.
 *
 * @param item The report's list item
 * @param sections The sections that become tiles
 * @param webUrl The shielded project's site whose list holds the report; none for the hub's
 */
function toStatusReport(
  item: Record<string, any>,
  sections: IStatusSectionDefinition[],
  webUrl?: string
): IStatusReport {
  const { siteId, scopeKey } = parseScopedSiteId(item.GtSiteId)
  return {
    id: item.Id,
    ...(webUrl ? { webUrl } : {}),
    siteId,
    scopeKey,
    publishedDate: item.GtLastReportDate ?? item.Created,
    overallStatus: item[OVERALL_STATUS_FIELD] || undefined,
    sections: sections.map((section) => {
      const value: string = item[section.fieldName] || undefined
      return {
        fieldName: section.fieldName,
        name: section.name,
        iconName: section.iconName,
        value,
        comment: item[`${section.fieldName}Comment`] || undefined,
        color: value ? section.colors[value] : undefined,
        shape: getShape(section, value)
      }
    })
  }
}

/**
 * Reads what the status report cells show: the sections that become tiles, in the hub's order,
 * with the colour and the shape of each value, the title of the overall status section, and the
 * reports the configured hub's rows point to (`StatusReportId`; in a merged view another hub's
 * rows name items of that hub's list, which is not read here). Search found each series' latest
 * published report already, so the reports are read by id, 50 to a request; with no report id
 * among those rows, no report is read. The report of a shielded project among those rows is read
 * from the list on its own site (`StatusReportWebUrl`), with the sections and their configuration
 * still the hub's.
 *
 * @param web The hub's web
 * @param column The column, whose settings may name other lists
 * @param items The view's rows
 */
export async function fetchData(
  web: IWeb,
  column?: ProjectColumn,
  items: Record<string, any>[] = []
): Promise<IStatusReportColumnData> {
  // A fresh object: `_.merge` writes into its first argument, which must not be the defaults.
  const props: Partial<IStatusColumnProps> = _.merge(
    {},
    STATUS_REPORT_COLUMN_DEFAULT_PROPS,
    column?.data?.dataTypeProperties
  )
  const sectionList = web.lists.getByTitle(props.statusSectionsListName)
  const configList = web.lists.getByTitle(props.columnConfigListName)
  const reportList = web.lists.getByTitle(props.statusReportListName)
  const [sectionItems, configItems, reportItems, shieldedReports] = await Promise.all([
    sectionList.items
      .select('Title', 'GtSecFieldName', 'GtSecIcon', 'GtSortOrder', 'GtSecShowInStatusSection')
      .top(500)(),
    configList.items
      .select(
        'GtPortfolioColumnColor',
        'GtPortfolioColumnIconName',
        'GtPortfolioColumnValue',
        'GtPortfolioColumn/Title',
        'GtPortfolioColumn/GtInternalName'
      )
      .expand('GtPortfolioColumn')
      .filter("startswith(GtPortfolioColumn/GtInternalName,'GtStatus')")
      .orderBy('ID', true)
      .top(500)(),
    getReports(reportList, getReportIds(items)),
    getShieldedReports(web, props.statusReportListName, getShieldedReportIds(items))
  ])
  const sections = getSectionDefinitions(sectionItems, getFieldConfigs(configItems))
  const overall = sectionItems.find((item) => item.GtSecFieldName === OVERALL_STATUS_FIELD)
  return {
    sections,
    overallStatusName: overall?.Title || undefined,
    reports: [
      ...reportItems.map((item) => toStatusReport(item, sections)),
      ...shieldedReports.map(({ item, webUrl }) => toStatusReport(item, sections, webUrl))
    ]
  }
}

/**
 * The column's data as `fetchData` gave it (`column.data.$`), or `undefined` where it has none:
 * in the program's views and the hub's aggregations, before the data is in, and when the fetch
 * failed.
 */
export function getStatusReportColumnData(
  column?: IListColumn
): IStatusReportColumnData | undefined {
  const data = column?.data?.$
  return Array.isArray(data?.reports) && Array.isArray(data?.sections) ? data : undefined
}
