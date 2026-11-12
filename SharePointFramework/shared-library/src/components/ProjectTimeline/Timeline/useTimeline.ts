import _ from 'underscore'
import moment from 'moment'
import React, { useCallback, useState } from 'react'
import strings from 'SharedLibraryStrings'
import { ITimelineItem, TimelineGroupType } from '../../../interfaces'
import { ITimelineProps } from './types'
import { useGroupRenderer } from './useGroupRenderer'
import { TIMELINE_ROW_BACKGROUND, useItemRenderer } from './useItemRenderer'
import { getContrastingShade } from '../../../util'
import { useTelemetry } from '../../../telemetry'
import { useToolbarItems } from './ToolbarItems/useToolbarItems'

/**
 * The time-lapse marker's red, darkened just until it reaches 3:1 against the grey rows: as
 * configured, #f35d69 had 2.85:1 (WCAG 1.4.11).
 */
const TIME_LAPSE_MARKER_COLOR = getContrastingShade('#f35d69', TIMELINE_ROW_BACKGROUND) ?? '#f35d69'

/** What Tab can stop at, before the checks of `getNextTabStop`. */
const TAB_STOPS = 'a[href], button, input, select, textarea, [tabindex]'

/**
 * The first element after `container` in the page that Tab stops at: shown, enabled, with no
 * negative tab index, and not one of Tabster's focus guards.
 *
 * @param container The element to go past
 */
function getNextTabStop(container: HTMLElement): HTMLElement | undefined {
  return Array.from(container.ownerDocument.querySelectorAll<HTMLElement>(TAB_STOPS)).find(
    (element) =>
      !container.contains(element) &&
      container.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING &&
      element.tabIndex >= 0 &&
      !element.matches(':disabled, [data-tabster-dummy]') &&
      !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden'
  )
}

/**
 * Manages timeline details, grouping, filters and calendar renderers.
 */
export function useTimeline(props: ITimelineProps) {
  const [showDetails, setShowDetails] = useState<{
    item: ITimelineItem
    element: HTMLElement
  }>(null)

  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>(props.defaultGroupBy)
  // The timeline is drawn by the project, portfolio and program timeline web parts (and the
  // resource allocation, which the contract counts nothing for): it counts for the one it is in.
  const telemetry = useTelemetry()

  /**
   * Opens an item's details, from a click or from the keyboard.
   */
  const onItemClick = (event: React.SyntheticEvent<HTMLDivElement>, item: ITimelineItem) => {
    setShowDetails({ element: event.currentTarget, item })
    telemetry.track('timelineItem.opened')
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
   * Moves the focus with Tab from the scroll area to the items and between them, in the order the
   * calendar draws them, from the last item on to what follows the timeline, and with Shift+Tab
   * back to the scroll area (WCAG 2.1.1, 2.4.3). SharePoint moves the focus on Tab itself (its own
   * Tabster, on the page): from the scroll area it went past the items, and from the last item and
   * with Shift+Tab from the first it went round them. Shift+Tab from the scroll area is the page's.
   *
   * @param event The key pressed inside the timeline
   */
  const onTimelineKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return
    const timeline = event.currentTarget
    const scroll = timeline.querySelector<HTMLElement>('.rct-scroll')
    if (!scroll) return
    const stops = [
      scroll,
      ...Array.from(scroll.querySelectorAll<HTMLElement>('.rc-item[tabindex="0"]'))
    ]
    const index = stops.indexOf(event.target as HTMLElement)
    if (index < 0) return
    const next = event.shiftKey
      ? stops[index - 1]
      : (stops[index + 1] ?? (index > 0 ? getNextTabStop(timeline) : undefined))
    if (!next) return
    event.preventDefault()
    event.stopPropagation()
    next.focus()
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
    onTimelineKeyDown,
    scrollRef,
    itemRenderer,
    groupRenderer,
    timeLapseMarkerColor: TIME_LAPSE_MARKER_COLOR
  } as const
}
