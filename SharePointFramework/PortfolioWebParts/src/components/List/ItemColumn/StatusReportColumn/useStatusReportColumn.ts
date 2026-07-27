import _ from 'lodash'
import { getScopeSeriesKey } from 'pp365-shared-library'
import { IStatusColumnProps } from './types'

/**
 * Hook for the status report column. Matches the report on both site ID and
 * report scope key ("delprosjekt"), so that a row representing a scoped
 * report series shows that series' latest report. Rows without a `ScopeKey`
 * (the default series) match reports without a scope suffix on `GtSiteId` —
 * which includes all reports created before multi-reporting was supported.
 *
 * @param props Props for the status report column
 */
export function useStatusReportColumn(props: IStatusColumnProps) {
  const status = _.get(props.column, 'data.$', []).find(
    ({ siteId, scopeKey }) =>
      siteId === props.item.SiteId &&
      getScopeSeriesKey(scopeKey) === getScopeSeriesKey(props.item.ScopeKey)
  )

  return {
    status
  }
}
