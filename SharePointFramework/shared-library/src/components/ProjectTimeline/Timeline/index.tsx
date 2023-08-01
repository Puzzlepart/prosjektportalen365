import { format, MessageBar } from '@fluentui/react'
import { ITimelineItem } from '../../../interfaces/ITimelineItem'
import moment from 'moment'
import * as strings from 'SharedLibraryStrings'
import React, { FC } from 'react'
import ReactTimeline, { TimelineMarkers, TodayMarker } from 'react-calendar-timeline'
import 'react-calendar-timeline/lib/Timeline.css'
import { FilterPanel } from '../../FilterPanel'
import { Commands } from '../Commands'
import { DetailsCallout } from '../DetailsCallout'
import styles from './Timeline.module.scss'
import { ITimelineProps } from './types'
import { useTimeline } from './useTimeline'

export const Timeline: FC<ITimelineProps> = (props) => {
  const {
    defaultTimeStart,
    defaultTimeEnd,
    sidebarWidth,
    showFilterPanel,
    setShowFilterPanel,
    showDetails,
    setShowDetails,
    itemRenderer,
    groupRenderer
  } = useTimeline(props)

  return (
    <div className={styles.root}>
      <div className={styles.commandBar}>
        <div>
          <Commands
            setShowFilterPanel={setShowFilterPanel}
            onGroupByChange={props.onGroupByChange}
            isGroupByEnabled={props.isGroupByEnabled}
            defaultGroupBy={props.defaultGroupBy}
          />
        </div>
      </div>
      {props.title && (
        <div className={styles.header}>
          <div className={styles.title}>{props.title}</div>
        </div>
      )}
      {props.showInfoText && props.infoText && (
        <div className={styles.infoText}>
          <MessageBar>
            <div
              dangerouslySetInnerHTML={{
                __html: format(props.infoText, encodeURIComponent(window.location.href))
              }}
            ></div>
          </MessageBar>
        </div>
      )}
      <div className={styles.timeline}>
        <ReactTimeline<ITimelineItem>
          defaultTimeStart={defaultTimeStart}
          defaultTimeEnd={defaultTimeEnd}
          groups={props.groups}
          items={props.items}
          stackItems={true}
          canMove={false}
          canChangeGroup={false}
          sidebarWidth={sidebarWidth}
          itemRenderer={itemRenderer}
          groupRenderer={groupRenderer}
        >
          <TimelineMarkers>
            <TodayMarker date={moment().toDate()} />
          </TimelineMarkers>
        </ReactTimeline>
      </div>
      <FilterPanel
        isOpen={showFilterPanel}
        headerText={strings.FilterText}
        filters={props.filters}
        onFilterChange={props.onFilterChange}
        isLightDismiss
        onDismiss={() => setShowFilterPanel(false)}
      />
      {showDetails && (
        <DetailsCallout timelineItem={showDetails} onDismiss={() => setShowDetails(null)} />
      )}
    </div>
  )
}

Timeline.defaultProps = {
  defaultTimeframe: [
    [-1, 'months'],
    [1, 'years']
  ],
  infoText: strings.ProjectTimelineInfoText,
  showInfoText: true
}

export * from './types'
