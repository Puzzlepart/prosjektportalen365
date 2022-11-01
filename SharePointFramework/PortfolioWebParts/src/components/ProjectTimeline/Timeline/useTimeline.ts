import { ITimelineItem } from '../../../interfaces'
import React, { useState } from 'react'
import { ITimelineProps } from './types'
import moment from 'moment'

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

  const defaultTimeStart = moment().add(...props.defaultVisibleTime[0])
  const defaultTimeEnd = moment().add(...props.defaultVisibleTime[1])

  return { defaultTimeStart, defaultTimeEnd, showFilterPanel, setShowFilterPanel, showDetails, setShowDetails, onItemClick } as const
}
