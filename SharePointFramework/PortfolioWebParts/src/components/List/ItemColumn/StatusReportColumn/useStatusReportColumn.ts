import { OnOpenChangeData, OpenPopoverEvents } from '@fluentui/react-components'
import _ from 'lodash'
import { getScopeSeriesKey } from 'pp365-shared-library'
import { useCallback, useEffect, useRef, useState } from 'react'
import { IStatusColumnProps } from './types'

/**
 * Hook for the status report column. Matches the report on both site ID and
 * report scope key ("delprosjekt"), so that a row representing a scoped
 * report series shows that series' latest report. Rows without a `ScopeKey`
 * (the default series) match reports without a scope suffix on `GtSiteId` —
 * which includes all reports created before multi-reporting was supported.
 *
 * The popover open state is controlled here to add a show delay
 * (`props.openDelay`) - Fluent UI v9 `Popover` with `openOnHover`
 * opens instantly on `mouseenter`, which makes surfaces flash white
 * when sweeping the cursor across the list.
 *
 * @param props Props for the status report column
 */
export function useStatusReportColumn(props: IStatusColumnProps) {
  const status = _.get(props.column, 'data.$', []).find(
    ({ siteId, scopeKey }) =>
      siteId === props.item.SiteId &&
      getScopeSeriesKey(scopeKey) === getScopeSeriesKey(props.item.ScopeKey)
  )

  const [open, setOpen] = useState(false)
  const openTimeout = useRef<number>()

  const onOpenChange = useCallback(
    (_event: OpenPopoverEvents, data: OnOpenChangeData) => {
      window.clearTimeout(openTimeout.current)
      if (data.open) {
        openTimeout.current = window.setTimeout(() => setOpen(true), props.openDelay)
      } else {
        setOpen(false)
      }
    },
    [props.openDelay]
  )

  useEffect(() => () => window.clearTimeout(openTimeout.current), [])

  return {
    status,
    open,
    onOpenChange
  }
}
