/**
 * Utilities for working with status report series. A project can have multiple
 * project status pages, each with its own report series. A series is identified
 * by the pair `(GtSiteId, GtStatusPageId)` where an empty `GtStatusPageId`
 * means the project's default status page (this also covers all reports created
 * before multiple status pages were supported).
 */

/**
 * Normalizes a status page ID to a series key. `null`, `undefined` and empty
 * values all normalize to an empty string, which represents the default
 * status page series.
 *
 * @param statusPageId Status page ID (`GtStatusPageId` or `GtStatusPageIdOWSTEXT`)
 */
export const getStatusPageSeriesKey = (statusPageId?: string): string =>
  (statusPageId ?? '').trim().toLowerCase()

/**
 * Returns an OData filter predicate for scoping status reports to a status page
 * series. Legacy reports created before the `GtStatusPageId` field existed have
 * `null` values, while reports cleared through list forms may have empty strings —
 * the default series predicate matches both.
 *
 * @param statusPageId Status page ID, or `null`/`undefined` for the default series
 */
export const getStatusPageSeriesFilter = (statusPageId?: string | null): string =>
  statusPageId
    ? `GtStatusPageId eq '${statusPageId}'`
    : `(GtStatusPageId eq null or GtStatusPageId eq '')`

/**
 * The latest report per status page series for a single project site.
 */
export interface IStatusReportSeries<T> {
  /**
   * Latest report of the default series (`GtStatusPageId` empty). May be
   * `undefined` if the project only has reports in additional series.
   */
  defaultReport?: T

  /**
   * Latest report per additional status page series, in encounter order
   * (latest-first when the input was sorted latest-first).
   */
  additionalReports: T[]
}

/**
 * Extra row properties added by `expandRowsPerStatusSeries`.
 */
export interface IStatusSeriesRowProps {
  /**
   * Synthetic unique row key on the format `${SiteId}_${statusPageId}`. Used
   * for row identity when a project yields one row per status page series.
   */
  key?: string

  /**
   * Status page ID for the series the row represents. `undefined` for the
   * default series row.
   */
  StatusPageId?: string

  /**
   * Status page title for the series the row represents.
   */
  StatusPageTitle?: string

  /**
   * Site-relative status page URL for the series the row represents.
   */
  StatusPageUrl?: string
}

const getListItemId = (report: Record<string, any>): number => {
  const listItemId = Number(report?.ListItemId)
  return isNaN(listItemId) ? 0 : listItemId
}

/**
 * Sorts status report search results latest-first by numeric `ListItemId`
 * (hub list item IDs are creation-ordered). Returns a new array.
 *
 * @param reports Status report search results
 */
export function sortStatusReportsLatestFirst<T extends Record<string, any>>(reports: T[]): T[] {
  return [...reports].sort((a, b) => getListItemId(b) - getListItemId(a))
}

/**
 * Groups status report search results by `(siteId, statusPageId)` and picks the
 * latest report per series. The `reports` array must be pre-sorted latest-first
 * (see `sortStatusReportsLatestFirst`) — the function keeps the first occurrence
 * per series key, which is exactly what the previous `.find` per site did, so
 * with zero additional status pages the result degrades to the old behavior.
 *
 * @param reports Status report search results, sorted latest-first
 * @param siteIdProperty Property holding the project site ID (default `GtSiteIdOWSTEXT`)
 * @param statusPageIdProperty Property holding the status page ID (default `GtStatusPageIdOWSTEXT`)
 */
export function groupLatestReportBySeries<T extends Record<string, any>>(
  reports: T[],
  siteIdProperty = 'GtSiteIdOWSTEXT',
  statusPageIdProperty = 'GtStatusPageIdOWSTEXT'
): Map<string, IStatusReportSeries<T>> {
  const seriesBySite = new Map<string, IStatusReportSeries<T>>()
  const seenSeriesKeys = new Set<string>()
  for (const report of reports ?? []) {
    const siteId = report?.[siteIdProperty]
    if (!siteId) continue
    const pageKey = getStatusPageSeriesKey(report[statusPageIdProperty])
    const seriesKey = `${siteId}|${pageKey}`
    if (seenSeriesKeys.has(seriesKey)) continue
    seenSeriesKeys.add(seriesKey)
    if (!seriesBySite.has(siteId)) {
      seriesBySite.set(siteId, { additionalReports: [] })
    }
    const series = seriesBySite.get(siteId)
    if (pageKey) series.additionalReports.push(report)
    else series.defaultReport = report
  }
  return seriesBySite
}

/**
 * Builds the row set for one project: the base row exactly as before (with the
 * default series report merged in), plus one row per additional status page
 * series with `Title` set to `${baseTitle} – ${statusPageTitle}` and all
 * report-sourced fields taken from that series' latest report. With no
 * additional series the result is a single row identical to the old behavior
 * (apart from the added synthetic `key` property).
 *
 * @param buildRow Builds a row from a status report search result (or `undefined`)
 * @param series Latest report per series for the project (from `groupLatestReportBySeries`)
 * @param statusPageIdProperty Property holding the status page ID (default `GtStatusPageIdOWSTEXT`)
 * @param statusPageTitleProperty Property holding the status page title (default `GtStatusPageTitleOWSTEXT`)
 * @param statusPageUrlProperty Property holding the status page URL (default `GtStatusPageUrlOWSTEXT`)
 */
export function expandRowsPerStatusSeries<TRow extends Record<string, any>>(
  buildRow: (report: Record<string, any> | undefined) => TRow,
  series: IStatusReportSeries<Record<string, any>> | undefined,
  statusPageIdProperty = 'GtStatusPageIdOWSTEXT',
  statusPageTitleProperty = 'GtStatusPageTitleOWSTEXT',
  statusPageUrlProperty = 'GtStatusPageUrlOWSTEXT'
): Array<TRow & IStatusSeriesRowProps> {
  const baseRow = buildRow(series?.defaultReport)
  const rows: Array<TRow & IStatusSeriesRowProps> = [
    { ...baseRow, key: `${baseRow['SiteId'] ?? ''}_` }
  ]
  for (const report of series?.additionalReports ?? []) {
    const statusPageId = getStatusPageSeriesKey(report[statusPageIdProperty])
    const statusPageTitle = report[statusPageTitleProperty] ?? ''
    const row = buildRow(report)
    rows.push({
      ...row,
      Title: statusPageTitle ? `${baseRow['Title']} – ${statusPageTitle}` : baseRow['Title'],
      StatusPageId: statusPageId,
      StatusPageTitle: statusPageTitle,
      StatusPageUrl: report[statusPageUrlProperty] ?? '',
      key: `${row['SiteId'] ?? ''}_${statusPageId}`
    })
  }
  return rows
}
