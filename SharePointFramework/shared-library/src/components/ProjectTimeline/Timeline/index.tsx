import { FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import { ITimelineItem } from '../../../interfaces/ITimelineItem'
import moment from 'moment'
import * as strings from 'SharedLibraryStrings'
import React, { FC } from 'react'
import ReactTimeline, {
  CustomMarker,
  DateHeader,
  TimelineHeaders,
  TimelineMarkers,
  TodayMarker
} from 'react-calendar-timeline'
import 'react-calendar-timeline/lib/Timeline.css'
import { FilterPanel } from '../../FilterPanel'
import { DetailsPopover } from '../DetailsPopover'
import { formatHeaderLabel } from './formatHeaderLabel'
import styles from './Timeline.module.scss'
import { ITimelineProps } from './types'
import { useTimeline } from './useTimeline'
import { WebPartTitle } from '../../WebPartTitle'
import { Toolbar } from '../../Toolbar'
import { customLightTheme, withDefaults } from '../../../util'

const TIMELINE_DEFAULT_PROPS: Partial<ITimelineProps> = {
  defaultTimeframe: [
    [-1, 'months'],
    [1, 'years']
  ],
  title: strings.ProjectTimelineTitle,
  infoText: strings.ProjectTimelineInfoText
}

/**
 * Displays timeline groups and items with filtering, navigation and details.
 */
export const Timeline: FC<ITimelineProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, TIMELINE_DEFAULT_PROPS)
  const fluentProviderId = useId('fp-timeline')
  const {
    defaultTimeStart,
    defaultTimeEnd,
    sidebarWidth,
    showFilterPanel,
    showDetails,
    menuItems,
    setShowFilterPanel,
    onDetailsDismiss,
    onTimelineKeyDown,
    scrollRef,
    itemRenderer,
    groupRenderer,
    timeLapseMarkerColor
  } = useTimeline(props)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider id={fluentProviderId} className={styles.root} theme={customLightTheme}>
        <div className={styles.header}>
          <div className={styles.commandBar}>
            <div className={styles.title}>
              <WebPartTitle title={props.title} description={props.infoText} />
            </div>
            <Toolbar items={menuItems} />
          </div>
        </div>

        {/* The scroll area and the items take Tab from each other here: SharePoint's own Tab
            handling skipped the items (WCAG 2.1.1, 2.4.3). */}
        <div className={styles.timeline} onKeyDown={onTimelineKeyDown}>
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
            scrollRef={scrollRef}
          >
            {/* The calendar's own headers, with the months and days in SharePoint's language. */}
            <TimelineHeaders>
              <DateHeader unit='primaryHeader' labelFormat={formatHeaderLabel} />
              <DateHeader labelFormat={formatHeaderLabel} />
            </TimelineHeaders>
            <TimelineMarkers>
              <CustomMarker date={props.timeLapseMarker}>
                {({ styles: markerStyles }) => (
                  <div style={{ ...markerStyles, backgroundColor: timeLapseMarkerColor }} />
                )}
              </CustomMarker>
              {/* Today is a line in colour; its label says what it is (WCAG 1.1.1, 1.4.1). */}
              <TodayMarker date={moment().toDate()}>
                {({ styles: markerStyles }) => (
                  <div style={markerStyles}>
                    <span className={styles.todayLabel}>{strings.TimelineTodayLabel}</span>
                  </div>
                )}
              </TodayMarker>
            </TimelineMarkers>
          </ReactTimeline>
        </div>
        <FilterPanel
          open={showFilterPanel}
          headerText={strings.FilterText}
          filters={props.filters}
          onFilterChange={props.onFilterChange}
          isLightDismiss
          onClose={() => setShowFilterPanel(false)}
        />
        {showDetails && <DetailsPopover timelineItem={showDetails} onDismiss={onDetailsDismiss} />}
      </FluentProvider>
    </IdPrefixProvider>
  )
}

export * from './types'
