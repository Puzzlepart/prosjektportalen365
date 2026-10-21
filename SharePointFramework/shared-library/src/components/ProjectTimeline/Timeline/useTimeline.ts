import _ from 'underscore'
import moment from 'moment'
import React, { useCallback, useState } from 'react'
import strings from 'SharedLibraryStrings'
import { ITimelineItem, TimelineGroupType } from '../../../interfaces'
import { ITimelineProps } from './types'
import { useGroupRenderer } from './useGroupRenderer'
import { TIMELINE_ROW_BACKGROUND, useItemRenderer } from './useItemRenderer'
import { getContrastingShade } from '../../../util'
import { useToolbarItems } from './ToolbarItems/useToolbarItems'

/**
 * The time-lapse marker's red, darkened just until it reaches 3:1 against the grey rows: as
 * configured, #f35d69 had 2.85:1 (WCAG 1.4.11).
 */
const TIME_LAPSE_MARKER_COLOR = getContrastingShade('#f35d69', TIMELINE_ROW_BACKGROUND) ?? '#f35d69'

export function useTimeline(props: ITimelineProps) {
  const [showDetails, setShowDetails] = useState<{
    item: ITimelineItem
    element: HTMLElement
  }>(null)

  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>(props.defaultGroupBy)

  /**
   * Opens an item's details, from a click or from the keyboard.
   *
   * @param event Event
   * @param item Item
   */
  const onItemClick = (event: React.SyntheticEvent<HTMLDivElement>, item: ITimelineItem) => {
    setShowDetails({ element: event.currentTarget, item })
  }

  /**
   * Closes the details. Closed with Escape, focus goes back to the item they belong to: the
   * popover has no trigger of Fluent's to return it to, so it would be lost to the page.
   *
   * @param event The event that closed them
   */
  const onDetailsDismiss = (event?: React.SyntheticEvent | Event) => {
    const element = showDetails?.element
    setShowDetails(null)
    if (event?.type === 'keydown') element?.focus()
  }

  /**
   * Makes the calendar's scroll area a named stop for the keyboard, so the timeline can be
   * scrolled in time with the arrow keys (WCAG 2.1.1). The calendar renders it and takes no props
   * for it, only this ref.
   */
  const scrollRef = useCallback((element: HTMLDivElement | null) => {
    if (!element) return
    element.tabIndex = 0
    element.setAttribute('role', 'group')
    element.setAttribute('aria-label', strings.Aria.TimelineScrollLabel)
  }, [])

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
    onDetailsDismiss,
    scrollRef,
    itemRenderer,
    groupRenderer,
    timeLapseMarkerColor: TIME_LAPSE_MARKER_COLOR
  } as const
}
