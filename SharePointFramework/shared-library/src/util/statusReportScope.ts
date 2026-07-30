/**
 * Utilities for working with status report scopes ("multirapportering"). A
 * project can report on multiple sub-projects ("delprosjekter") from the same
 * project status page. Each report series is identified by a scope key encoded
 * as a suffix on the existing `GtSiteId` value:
 *
 * - Default series ("hovedrapportering"): `GtSiteId = {siteId}` — exactly as
 *   before, which also covers all reports created before multi-reporting was
 *   supported.
 * - Scoped series: `GtSiteId = {siteId}-{scopeKey}`, e.g. `<guid>-DP1`.
 *
 * The site ID is always the project's existing site GUID (36 characters,
 * canonical 8-4-4-4-12 form) — parsing is positional, so the GUID's internal
 * hyphens are unambiguous.
 */

/**
 * Length of a canonical site GUID (8-4-4-4-12).
 */
export const PROJECT_SITE_ID_LENGTH = 36

/**
 * Delimiter between the site GUID and the scope key in `GtSiteId`.
 */
export const SCOPE_DELIMITER = '-'

const GUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

/**
 * Result of parsing a (potentially scoped) `GtSiteId` value.
 */
export interface IScopedSiteId {
  /**
   * The project's site ID (the base GUID, original casing).
   */
  siteId: string

  /**
   * The scope key suffix (display casing). Empty string for the default
   * series — which includes all reports created before multi-reporting.
   */
  scopeKey: string
}

/**
 * Parses a `GtSiteId` value into the project's site ID and the scope key.
 * Values that are not a scoped site ID (plain GUIDs, the legacy zero-GUID
 * default, malformed values) are returned as-is with an empty scope key,
 * degrading to the previous behavior.
 *
 * @param value `GtSiteId` (or `GtSiteIdOWSTEXT`) value
 */
export function parseScopedSiteId(value: string): IScopedSiteId {
  const trimmedValue = (value ?? '').trim()
  if (trimmedValue.length <= PROJECT_SITE_ID_LENGTH) {
    return { siteId: trimmedValue, scopeKey: '' }
  }
  const base = trimmedValue.slice(0, PROJECT_SITE_ID_LENGTH)
  if (GUID_PATTERN.test(base) && trimmedValue[PROJECT_SITE_ID_LENGTH] === SCOPE_DELIMITER) {
    return {
      siteId: base,
      scopeKey: trimmedValue.slice(PROJECT_SITE_ID_LENGTH + 1).trim()
    }
  }
  return { siteId: trimmedValue, scopeKey: '' }
}

/**
 * Normalizes a scope key for comparisons and map keys. `null`, `undefined`
 * and empty values all normalize to an empty string, which represents the
 * default report series. Scope keys are compared case-insensitively.
 *
 * @param scopeKey Scope key
 */
export function getScopeSeriesKey(scopeKey?: string): string {
  return (scopeKey ?? '').trim().toLowerCase()
}

/**
 * Builds the `GtSiteId` value for a report in the given scope. With an empty
 * scope key the project's existing site ID is returned unchanged (default
 * series) — no new site ID is ever generated, the scope key is appended to
 * the same site GUID all the project's reports already carry.
 *
 * @param siteId The project's site ID (existing site GUID)
 * @param scopeKey Scope key, or empty/`null` for the default series
 */
export function buildScopedSiteId(siteId: string, scopeKey?: string): string {
  const trimmedScopeKey = (scopeKey ?? '').trim()
  return trimmedScopeKey ? `${siteId}${SCOPE_DELIMITER}${trimmedScopeKey}` : siteId
}

/**
 * Returns an OData filter predicate matching status reports from ALL of the
 * project's report series (the default series and every scoped series). A
 * full 36-character GUID can never be a prefix of a different GUID, so the
 * `startswith` predicate is exact per project.
 *
 * @param siteId The project's site ID
 */
export function getAllScopesFilter(siteId: string): string {
  return `startswith(GtSiteId,'${siteId}')`
}

/**
 * The latest report per report series (scope) for a single project site.
 */
export interface IStatusReportSeries<T> {
  /**
   * Latest report of the default series (no scope key). May be `undefined`
   * if the project only has reports in scoped series.
   */
  defaultReport?: T

  /**
   * Latest report per scoped series, in encounter order (latest-first when
   * the input was sorted latest-first).
   */
  additionalReports: T[]
}

/**
 * Extra row properties added by `expandRowsPerStatusSeries`.
 */
export interface IStatusScopeRowProps {
  /**
   * Synthetic unique row key on the format `${SiteId}_${scopeKey}`. Used for
   * row identity when a project yields one row per report series.
   */
  key?: string

  /**
   * Scope key for the report series the row represents (display casing).
   * `undefined` for the default series row.
   */
  ScopeKey?: string
}

function getListItemId(report: Record<string, any>): number {
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
 * Groups status report search results by parsed `(siteId, scopeKey)` and picks
 * the latest report per series. The map is keyed on the parsed BASE site ID,
 * so lookups with the pure site GUID (as carried by project/site search items)
 * keep working. The `reports` array must be pre-sorted latest-first (see
 * `sortStatusReportsLatestFirst`) — the function keeps the first occurrence
 * per series key, which is exactly what the previous `.find` per site did, so
 * with zero scoped series the result degrades to the old behavior.
 *
 * @param reports Status report search results, sorted latest-first
 * @param siteIdProperty Property holding the (potentially scoped) site ID (default `GtSiteIdOWSTEXT`)
 */
export function groupLatestReportBySeries<T extends Record<string, any>>(
  reports: T[],
  siteIdProperty = 'GtSiteIdOWSTEXT'
): Map<string, IStatusReportSeries<T>> {
  const seriesBySite = new Map<string, IStatusReportSeries<T>>()
  const seenSeriesKeys = new Set<string>()
  for (const report of reports ?? []) {
    const { siteId, scopeKey } = parseScopedSiteId(report?.[siteIdProperty])
    if (!siteId) continue
    const seriesKey = `${siteId}|${getScopeSeriesKey(scopeKey)}`
    if (seenSeriesKeys.has(seriesKey)) continue
    seenSeriesKeys.add(seriesKey)
    if (!seriesBySite.has(siteId)) {
      seriesBySite.set(siteId, { additionalReports: [] })
    }
    const series = seriesBySite.get(siteId)
    if (scopeKey) series.additionalReports.push(report)
    else series.defaultReport = report
  }
  return seriesBySite
}

/**
 * Builds the row set for one project: the base row exactly as before (with the
 * default series report merged in), plus one row per scoped report series with
 * `Title` set to `${baseTitle} – ${scopeKey}` and all report-sourced fields
 * taken from that series' latest report. With no scoped series the result is a
 * single row identical to the old behavior (apart from the added synthetic
 * `key` property).
 *
 * @param buildRow Builds a row from a status report search result (or `undefined`)
 * @param series Latest report per series for the project (from `groupLatestReportBySeries`)
 * @param siteIdProperty Property holding the (potentially scoped) site ID (default `GtSiteIdOWSTEXT`)
 */
export function expandRowsPerStatusSeries<TRow extends Record<string, any>>(
  buildRow: (report: Record<string, any> | undefined) => TRow,
  series: IStatusReportSeries<Record<string, any>> | undefined,
  siteIdProperty = 'GtSiteIdOWSTEXT'
): Array<TRow & IStatusScopeRowProps> {
  const baseRow = buildRow(series?.defaultReport)
  const rows: Array<TRow & IStatusScopeRowProps> = [
    { ...baseRow, key: `${baseRow['SiteId'] ?? ''}_` }
  ]
  for (const report of series?.additionalReports ?? []) {
    const { scopeKey } = parseScopedSiteId(report[siteIdProperty])
    const row = buildRow(report)
    rows.push({
      ...row,
      Title: scopeKey ? `${baseRow['Title']} – ${scopeKey}` : baseRow['Title'],
      ScopeKey: scopeKey,
      key: `${row['SiteId'] ?? ''}_${getScopeSeriesKey(scopeKey)}`
    })
  }
  return rows
}
