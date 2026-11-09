import moment from 'moment'
import React, { FC } from 'react'
import styles from './ProjectTimeline.module.scss'
import { Timeline, TimelineTimeframe } from './Timeline'
import { IProjectTimelineProps } from './types'
import { useProjectTimeline } from './useProjectTimeline'
import { UserMessage } from '../UserMessage'
import strings from 'SharedLibraryStrings'
import { LoadingSkeleton } from '../LoadingSkeleton'
import resource from 'SharedResources'
import { withDefaults } from '../../util'

/** Read by PortfolioWebParts' timeline web part too, for its property pane. */
export const PROJECT_TIMELINE_DEFAULT_PROPS: Partial<IProjectTimelineProps> = {
  showProjectDeliveries: false,
  dataSourceName: resource.Lists_DataSources_Category_ProjectDeliveries_All,
  configItemTitle: resource.TimelineConfiguration_ProjectDelivery_Title,
  defaultTimeframeStart: '1,months',
  defaultTimeframeEnd: '12,months'
}

export const ProjectTimeline: FC<IProjectTimelineProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, PROJECT_TIMELINE_DEFAULT_PROPS)
  const { state, onFilterChange } = useProjectTimeline(props)
  const [sAmount, sDuration] = props.defaultTimeframeStart.split(',')
  const [eAmount, eDuration] = props.defaultTimeframeEnd.split(',')
  const defaultTimeframe: TimelineTimeframe = [
    [-parseInt(sAmount), sDuration as moment.unitOfTime.DurationConstructor],
    [parseInt(eAmount), eDuration as moment.unitOfTime.DurationConstructor]
  ]
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {state.loading ? (
          <LoadingSkeleton />
        ) : state.error ? (
          <UserMessage title={strings.ErrorTitle} text={state.error.message} intent='error' />
        ) : (
          <>
            <Timeline
              title={props.title}
              groups={state.filteredData.groups}
              items={state.filteredData.items}
              filters={state.filters}
              onFilterChange={onFilterChange}
              infoText={props.infoText}
              defaultTimeframe={defaultTimeframe}
            />
          </>
        )}
      </div>
    </div>
  )
}

ProjectTimeline.displayName = 'ProjectTimeline'

export * from './Timeline'
export * from './types'
