import { ITimelineItem, ITimelineGroup, TimelineGroupType } from 'interfaces'
import ReactTimeline, {
  ReactCalendarGroupRendererProps,
  ReactCalendarItemRendererProps,
  TimelineMarkers,
  TodayMarker
} from 'react-calendar-timeline'
import 'react-calendar-timeline/lib/Timeline.css'
import * as strings from 'PortfolioWebPartsStrings'
import styles from './Timeline.module.scss'
import './Timeline.overrides.css'
import moment from 'moment'
import React, { FunctionComponent, useState } from 'react'
import { format, MessageBar } from 'office-ui-fabric-react'
import { Commands } from '../Commands'
import { DetailsCallout } from '../DetailsCallout'
import { FilterPanel, IFilterProps } from '../../FilterPanel'

export interface ITimelineProps {
  defaultTimeStart?: [number, moment.unitOfTime.DurationConstructor]
  defaultTimeEnd?: [number, moment.unitOfTime.DurationConstructor]
  groups: ITimelineGroup[]
  items: ITimelineItem[]
  filters: IFilterProps[]
  onFilterChange: (filter: string) => void
  onGroupChange: (group: string) => void
  isGroupByEnabled?: boolean
  infoText?: string
  title?: string
}

/**
 * @component Timeline
 */
export const Timeline: FunctionComponent<ITimelineProps> = (props) => {
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

  /**
   * Timeline item renderer
   */
  const itemRenderer = (calProps: ReactCalendarItemRendererProps<any>) => {
    const htmlProps = calProps.getItemProps(calProps.item.itemProps)

    switch (calProps.item.data.elementType) {
      case strings.DiamondLabel: {
        return (
          <div
            {...htmlProps}
            className={`${styles.timelineItem} rc-item`}
            onClick={(event) => onItemClick(event, calProps.item)}>
            <div
              className={`${styles.itemContent} rc-milestoneitem-content`}
              style={{
                maxHeight: `${calProps.itemContext.dimensions.height}`,
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                width: '22px',
                height: '24px',
                backgroundColor: calProps.item.data.hexColor || '#ffc800',
                marginTop: '-2px'
              }}
            />
          </div>
        )
      }
      case strings.TriangleLabel: {
        return (
          <div
            {...htmlProps}
            className={`${styles.timelineItem} rc-item`}
            onClick={(event) => onItemClick(event, calProps.item)}>
            <div
              className={`${styles.itemContent} rc-milestoneitem-content`}
              style={{
                maxHeight: `${calProps.itemContext.dimensions.height}`,
                width: '0',
                height: '0',
                borderLeft: '11px solid transparent',
                borderRight: '11px solid transparent',
                borderBottom: `22px solid ${calProps.item.data.hexColor || 'lightblue'}`,
                marginTop: '-3px'
              }}
            />
          </div>
        )
      }
      default: {
        return (
          <div
            {...htmlProps}
            className={`${styles.timelineItem} rc-item`}
            onClick={(event) => onItemClick(event, calProps.item)}>
            <div
              className={`${styles.itemContent} rc-item-content`}
              style={{
                maxHeight: `${calProps.itemContext.dimensions.height}`,
                paddingLeft: '8px'
              }}>
              {calProps.item.title}
            </div>
          </div>
        )
      }
    }
  }

  /**
   * Timeline group renderer
   */
  const groupRenderer = ({ group }: ReactCalendarGroupRendererProps<ITimelineGroup>) => {
    const style: React.CSSProperties = { display: 'block', width: '100%' }
    return (
      <div>
        <span title={group.title} style={style}>{group.title}</span>
      </div>
    )
  }

  return (
    <>
      <div className={styles.commandBar}>
        <div>
          <Commands
            setShowFilterPanel={setShowFilterPanel}
            onGroupChange={props.onGroupChange.bind(this)}
            isGroupByEnabled={props.isGroupByEnabled}
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
          groups={props.groups}
          items={props.items}
          stackItems={true}
          canMove={false}
          canChangeGroup={false}
          sidebarWidth={props.groups[0].type === TimelineGroupType.Project && props.isGroupByEnabled ? 0 : props.isGroupByEnabled ? 120 : 300}
          itemRenderer={itemRenderer.bind(this)}
          groupRenderer={groupRenderer.bind(this)}
          defaultTimeStart={moment().add(...props.defaultTimeStart)}
          defaultTimeEnd={moment().add(...props.defaultTimeEnd)}>
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
