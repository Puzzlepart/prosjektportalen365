import { ITimelineGroup, TimelineGroupType } from '../../../interfaces'
import { ReactCalendarGroupRendererProps } from 'react-calendar-timeline'
import React from 'react'
import { Link, Tooltip } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'

/**
 * Timeline group renderer hook
 */
export function useGroupRenderer() {
  return ({ group }: ReactCalendarGroupRendererProps<ITimelineGroup>) => {
    const style: React.CSSProperties = { display: 'block', width: '100%' }
    const page = group.isProgram ? 'Programtidslinje' : 'Prosjekttidslinje'

    return (
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {group.type === TimelineGroupType.Project ? (
          <Tooltip content={strings.TimelineGroupDescription} relationship='description' withArrow>
            <Link
              href={`${group.path}/SitePages/${page}.aspx`}
              target='_blank'
              title={group.title}
            >
              {group.title}
            </Link>
          </Tooltip>
        ) : (
          <span title={group.title} style={style}>
            {group.title}
          </span>
        )}
      </div>
    )
  }
}
