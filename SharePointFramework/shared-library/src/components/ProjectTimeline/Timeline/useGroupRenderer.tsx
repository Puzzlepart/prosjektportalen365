import { ITimelineGroup } from '../../../interfaces'
import { ReactCalendarGroupRendererProps } from 'react-calendar-timeline'
import React from 'react'

/**
 * Timeline group renderer hook
 */
export function useGroupRenderer() {
  return ({ group }: ReactCalendarGroupRendererProps<ITimelineGroup>) => {
    const style: React.CSSProperties = { display: 'block', width: '100%' }
    return (
      <div>
        <span title={group.title} style={style}>
          {group.title}
        </span>
      </div>
    )
  }
}
