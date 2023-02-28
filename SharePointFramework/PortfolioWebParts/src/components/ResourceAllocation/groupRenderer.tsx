import { ITimelineGroup, TimelineResourceType } from 'interfaces'
import React from 'react'
import { ReactCalendarGroupRendererProps } from 'react-calendar-timeline'

/**
 * Timeline group renderer
 */
export function groupRenderer({ group }: ReactCalendarGroupRendererProps<ITimelineGroup>) {
  const style: React.CSSProperties = { display: 'block', width: '100%' }
  if (group.resourceType === TimelineResourceType.Role) {
    style.fontStyle = 'italic'
  }
  return (
    <div>
      <span style={style}>{group.title}</span>
    </div>
  )
}
