import { TimelineGroupType } from '../../../interfaces'
import ReactTimeline, { TimelineMarkers, TodayMarker } from 'react-calendar-timeline'
import 'react-calendar-timeline/lib/Timeline.css'
import * as strings from 'PortfolioWebPartsStrings'
import styles from './Timeline.module.scss'
import './Timeline.overrides.css'
import moment from 'moment'
import React, { FC } from 'react'
import { format, MessageBar } from '@fluentui/react'
import { Commands } from '../Commands'
import { DetailsCallout } from '../DetailsCallout'
import { FilterPanel } from '../../FilterPanel'
import { ITimelineProps } from './types'
import { useTimeline } from './useTimeline'
import { useItemRenderer } from './useItemRenderer'
import { useGroupRenderer } from './useGroupRenderer'

export const Timeline: FC<ITimelineProps> = (props) => {
  const {
    defaultTimeStart,
    defaultTimeEnd,
    showFilterPanel,
    setShowFilterPanel,
    showDetails,
    setShowDetails,
    onItemClick
  } = useTimeline(props)
  const itemRenderer = useItemRenderer(onItemClick)
  const groupRenderer = useGroupRenderer()

  return (
    <>
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
      {props.infoText && (
        <div className={styles.infoText}>
          <MessageBar>
            <div
              dangerouslySetInnerHTML={{
                __html: format(props.infoText, encodeURIComponent(window.location.href))
              }}></div>
          </MessageBar>
        </div>
      )}
      <div className={styles.timeline}>
        <ReactTimeline<any>
          defaultTimeStart={defaultTimeStart}
          defaultTimeEnd={defaultTimeEnd}
          groups={props.groups}
          items={props.items}
          stackItems={true}
          canMove={false}
          canChangeGroup={false}
          sidebarWidth={
            props.groups[0].type === TimelineGroupType.Project && props.isGroupByEnabled
              ? 0
              : props.isGroupByEnabled
              ? 120
              : 300
          }
          itemRenderer={itemRenderer}
          groupRenderer={groupRenderer}>
          <TimelineMarkers>
            <TodayMarker date={moment().toDate()} />
          </TimelineMarkers>
        </ReactTimeline>
      </div>
      <FilterPanel
        isOpen={showFilterPanel}
        headerText={strings.FilterText}
        filters={props.filters}
        onFilterChange={props.onFilterChange.bind(this)}
        isLightDismiss
        onDismiss={() => setShowFilterPanel(false)}
      />
      {showDetails && (
        <DetailsCallout timelineItem={showDetails} onDismiss={() => setShowDetails(null)} />
      )}
    </>
  )
}
