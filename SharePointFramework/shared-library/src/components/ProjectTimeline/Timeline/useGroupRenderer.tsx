import { ITimelineGroup, TimelineGroupType } from '../../../interfaces'
import { ReactCalendarGroupRendererProps } from 'react-calendar-timeline'
import React from 'react'
import { Link } from '@fluentui/react-components'

/**
 * Timeline group renderer hook
 */
export function useGroupRenderer() {
  return ({ group }: ReactCalendarGroupRendererProps<ITimelineGroup>) => {
    const style: React.CSSProperties = { display: 'block', width: '100%' }

    return (
      <div>
        {group.type === TimelineGroupType.Project
          ? <Link href={group.path} target='_blank' title={group.title}>
            {group.title}
          </Link>
          : <span title={group.title} style={style}>
            {group.title}
          </span>
        }
      </div>
    )
  }
}
