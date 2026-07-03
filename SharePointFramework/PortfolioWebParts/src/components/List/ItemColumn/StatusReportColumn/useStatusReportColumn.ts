import _ from 'lodash'
import { getStatusPageSeriesKey } from 'pp365-shared-library'
import { IStatusColumnProps } from './types'

/**
 * Hook for the status report column. Matches the report on both site ID and
 * status page series key, so that a row representing an additional status page
 * series shows that series' latest report. Rows without a `StatusPageId` (the
 * default series) match reports without a `GtStatusPageId` — which includes
 * all reports created before multiple status pages were supported.
 *
 * @param props Props for the status report column
 */
export function useStatusReportColumn(props: IStatusColumnProps) {
  const status = _.get(props.column, 'data.$', []).find(
    ({ siteId, statusPageId }) =>
      siteId === props.item.SiteId &&
      statusPageId === getStatusPageSeriesKey(props.item.StatusPageId)
  )

  return {
    status
  }
}
