import _ from 'lodash'
import { IStatusColumnProps } from './types'

/**
 * Hook for the status report column.
 *
 * @param props Props for the status report column
 */
export function useStatusReportColumn(props: IStatusColumnProps) {
  const status = _.get(props.column, 'data.$', []).find(
    ({ siteId }) => siteId === props.item.SiteId
  )

  return {
    status
  }
}
