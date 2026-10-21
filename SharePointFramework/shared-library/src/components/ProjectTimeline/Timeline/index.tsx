import { FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import { ITimelineItem } from '../../../interfaces/ITimelineItem'
import moment from 'moment'
import * as strings from 'SharedLibraryStrings'
import React, { FC } from 'react'
import ReactTimeline, { CustomMarker, TimelineMarkers, TodayMarker } from 'react-calendar-timeline'
import 'react-calendar-timeline/lib/Timeline.css'
import { FilterPanel } from '../../FilterPanel'
import { DetailsPopover } from '../DetailsPopover'
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
    scrollRef,
    itemRenderer,
    groupRenderer,
    timeLapseMarkerColor
  } = useTimeline(props)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider id={fluentProviderId} className={styles.root} theme={customLightTheme}>
        <div className={styles.header}>
          <WebPartTitle title={props.title} description={props.infoText} />
          <div className={styles.commandBar}>
            <div>
              <Toolbar items={menuItems} />
            </div>
          </div>
        </div>

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
            scrollRef={scrollRef}
          >
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
