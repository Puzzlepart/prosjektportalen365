import { OnOpenChangeData, OpenPopoverEvents } from '@fluentui/react-components'
import _ from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'
import { IStatusColumnProps } from './types'

/**
 * Hook for the status report column.
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
    ({ siteId }) => siteId === props.item.SiteId
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
