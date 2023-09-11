import _ from 'underscore'
import moment from 'moment'
import React, { useState } from 'react'
import { ITimelineItem, TimelineGroupType } from '../../../interfaces'
import { ITimelineProps } from './types'
import { useGroupRenderer } from './useGroupRenderer'
import { useItemRenderer } from './useItemRenderer'
import { useToolbarItems } from './ToolbarItems/useToolbarItems'

export function useTimeline(props: ITimelineProps) {
  const [showDetails, setShowDetails] = useState<{
    item: ITimelineItem
    element: HTMLElement
  }>(null)

  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>(props.defaultGroupBy)

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
  let sidebarWidth = 300

  if (props.isGroupByEnabled) {
    sidebarWidth = 120
    if (_.first(props.groups)?.type === TimelineGroupType.Project) sidebarWidth = 0
  }
  if (props.hideSidebar) {
    sidebarWidth = 0
  }

  const itemRenderer = useItemRenderer(onItemClick)
  const groupRenderer = useGroupRenderer()

  const menuItems = useToolbarItems(setShowFilterPanel, selectedGroupBy, setSelectedGroupBy, props)

  return {
    defaultTimeStart,
    defaultTimeEnd,
    sidebarWidth,
    showFilterPanel,
    showDetails,
    menuItems,
    setShowFilterPanel,
    setShowDetails,
    onItemClick,
    itemRenderer,
    groupRenderer
  } as const
}
