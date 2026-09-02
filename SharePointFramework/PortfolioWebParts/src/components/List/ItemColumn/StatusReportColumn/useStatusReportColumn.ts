import { OnOpenChangeData, OpenPopoverEvents } from '@fluentui/react-components'
import _ from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'
import { IStatusColumnProps } from './types'

/**
 * Hook for the status report column.
 *
 * The popover open state is controlled here to add a show delay
 * (`props.openDelay`), as v9 `Popover` with `openOnHover` opens instantly on
 * `mouseenter`. `cancelPendingOpen` must be wired to the trigger's own
 * `pointerleave` — Fluent delays the close notification by `mouseLeaveDelay`,
 * so a pending open could otherwise fire after the pointer has left the cell.
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

  const cancelPendingOpen = useCallback(() => {
    window.clearTimeout(openTimeout.current)
  }, [])

  useEffect(() => () => window.clearTimeout(openTimeout.current), [])

  return {
    status,
    open,
    onOpenChange,
    cancelPendingOpen
  }
}
