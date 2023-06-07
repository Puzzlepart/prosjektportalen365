import { CommandBar, format, MessageBar, MessageBarType } from '@fluentui/react'
import moment from 'moment'
import * as strings from 'PortfolioWebPartsStrings'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import Timeline, { TimelineMarkers, TodayMarker } from 'react-calendar-timeline'
import 'react-calendar-timeline/lib/Timeline.css'
import { DetailsCallout } from './DetailsCallout'
import { groupRenderer } from './groupRenderer'
import { itemRenderer } from './itemRenderer'
import styles from './ResourceAllocation.module.scss'
import './Timeline.overrides.css'
import { IResourceAllocationProps } from './types'
import { useResourceAllocation } from './useResourceAllocation'
import { FilterPanel } from 'pp365-shared-library/lib/components'

export const ResourceAllocation: FC<IResourceAllocationProps> = (props) => {
  const {
    state,
    setState,
    commandBar,
    filters,
    onFilterChange,
    items,
    groups
  } = useResourceAllocation(props)

  if (!state.isDataLoaded) return null

  if (state.error) {
    return (
      <div className={styles.root}>
        <div className={styles.container}>
          <UserMessage text={state.error} type={MessageBarType.success} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.commandBar}>
          <CommandBar {...commandBar} />
        </div>
        <div className={styles.header}>
          <div className={styles.title}>{props.title}</div>
        </div>
        <div className={styles.infoText}>
          <MessageBar>
            <div
              dangerouslySetInnerHTML={{
                __html: format(
                  strings.ResourceAllocationInfoText,
                  encodeURIComponent(window.location.href)
                )
              }}></div>
          </MessageBar>
        </div>
        <div className={styles.timeline}>
          <Timeline<any>
            groups={groups}
            items={items}
            stackItems={true}
            canMove={false}
            canChangeGroup={false}
            sidebarWidth={250}
            itemRenderer={(props) =>
              itemRenderer(props, (showDetails) => setState({ ...state, showDetails }))
            }
            groupRenderer={groupRenderer}
            defaultTimeStart={moment().add(...props.defaultTimeStart)}
            defaultTimeEnd={moment().add(...props.defaultTimeEnd)}>
            <TimelineMarkers>
              <TodayMarker date={moment().toDate()} />
            </TimelineMarkers>
          </Timeline>
        </div>
      </div>
      <FilterPanel
        isOpen={state.showFilterPanel}
        headerText={strings.FilterText}
        filters={filters}
        onFilterChange={onFilterChange}
        onDismiss={() => setState({ ...state, showFilterPanel: false })}
      />
      {state.showDetails && (
        <DetailsCallout
          viewItem={state.showDetails}
          onDismiss={() => setState({ ...state, showDetails: null })}
        />
      )}
    </div>
  )
}

ResourceAllocation.defaultProps = {
  itemBgColor: '51,153,51',
  itemAbsenceBgColor: '26,111,179',
  defaultTimeStart: [-1, 'months'],
  defaultTimeEnd: [1, 'years'],
  selectProperties: [
    'Path',
    'SPWebUrl',
    'ContentTypeId',
    'SiteTitle',
    'SiteName',
    'RefinableString71',
    'RefinableString72',
    'GtResourceLoadOWSNMBR',
    'GtResourceAbsenceOWSCHCS',
    'GtStartDateOWSDATE',
    'GtEndDateOWSDATE',
    'GtAllocationStatusOWSCHCS',
    'GtAllocationCommentOWSMTXT'
  ]
}

export * from './types'
