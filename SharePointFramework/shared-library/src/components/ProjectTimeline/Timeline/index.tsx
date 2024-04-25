import { format } from '@fluentui/react'
import { FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import { ITimelineItem } from '../../../interfaces/ITimelineItem'
import moment from 'moment'
import * as strings from 'SharedLibraryStrings'
import React, { FC } from 'react'
import ReactTimeline, { TimelineMarkers, TodayMarker } from 'react-calendar-timeline'
import 'react-calendar-timeline/lib/Timeline.css'
import { FilterPanel } from '../../FilterPanel'
import { DetailsPopover } from '../DetailsPopover'
import styles from './Timeline.module.scss'
import { ITimelineProps } from './types'
import { useTimeline } from './useTimeline'
import { WebPartTitle } from '../../WebPartTitle'
import { Toolbar } from '../../Toolbar'
import { customLightTheme } from '../../../util'

export const Timeline: FC<ITimelineProps> = (props) => {
  const fluentProviderId = useId('fp-timeline')
  const {
    defaultTimeStart,
    defaultTimeEnd,
    sidebarWidth,
    showFilterPanel,
    showDetails,
    menuItems,
    setShowFilterPanel,
    setShowDetails,
    itemRenderer,
    groupRenderer
  } = useTimeline(props)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider id={fluentProviderId} className={styles.root} theme={customLightTheme}>
        <div className={styles.header}>
          <WebPartTitle
            title={props.title}
            description={props.infoText}
          />
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
          <DetailsPopover timelineItem={showDetails} onDismiss={() => setShowDetails(null)} />
        )}
      </FluentProvider>
    </IdPrefixProvider>
  )
}

Timeline.defaultProps = {
  defaultTimeframe: [
    [-1, 'months'],
    [1, 'years']
  ],
  title: strings.ProjectTimelineTitle,
  infoText: strings.ProjectTimelineInfoText
}

export * from './types'
