import { ITimelineItem, TimelineGroupType } from '../../../interfaces'
import React, { useState } from 'react'
import { ITimelineProps } from './types'
import moment from 'moment'
import { first } from 'underscore'

export function useTimeline(props: ITimelineProps) {
  const [showDetails, setShowDetails] = useState<{
    item: ITimelineItem
    element: HTMLElement
  }>(null)

  const [showFilterPanel, setShowFilterPanel] = useState(false)

  /**
   * On item click
   *
   * @param event Event
   * @param item Item
   */
  const onItemClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    item: ITimelineItem
  ) => {
    setShowDetails({ element: event.currentTarget, item })
  }

  const defaultTimeStart = moment().add(...props.defaultTimeframe[0])
  const defaultTimeEnd = moment().add(...props.defaultTimeframe[1])
  const sidebarWidth =
    first(props.groups)?.type === TimelineGroupType.Project && props.isGroupByEnabled
      ? 0
      : props.isGroupByEnabled
      ? 120
      : 300

  return {
    defaultTimeStart,
    defaultTimeEnd,
    sidebarWidth,
    showFilterPanel,
    setShowFilterPanel,
    showDetails,
    setShowDetails,
    onItemClick
  } as const
}
