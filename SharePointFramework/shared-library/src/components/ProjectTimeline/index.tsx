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

export const ProjectTimeline: FC<IProjectTimelineProps> = (props) => {
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
ProjectTimeline.defaultProps = {
  showProjectDeliveries: false,
  dataSourceName: resource.Lists_DataSources_Category_ProjectDeliveries_All,
  configItemTitle: resource.TimelineConfiguration_ProjectDelivery_Title,
  defaultTimeframeStart: '1,months',
  defaultTimeframeEnd: '12,months'
}

export * from './Timeline'
export * from './types'
