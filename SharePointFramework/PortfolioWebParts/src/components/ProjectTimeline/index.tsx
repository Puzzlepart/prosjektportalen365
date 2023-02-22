import { format, MessageBarType, Spinner } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import React, { FC } from 'react'
import styles from './ProjectTimeline.module.scss'
import './ProjectTimeline.overrides.css'
import { Timeline } from './Timeline'
import { IProjectTimelineProps } from './types'
import { useProjectTimeline } from './useProjectTimeline'

export const ProjectTimeline: FC<IProjectTimelineProps> = (props) => {
  const { state, onFilterChange } = useProjectTimeline(props)
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {!state.isDataLoaded ? (
          <div className={styles.root}>
            <div className={styles.container}>
              <Spinner label={format(strings.LoadingText, props.title)} />
            </div>
          </div>
        ) : state.error ? (
          <UserMessage type={MessageBarType.severeWarning} text={state.error.message} />
        ) : (
          <>
            <Timeline
              title={props.title}
              groups={state.filteredData.groups}
              items={state.filteredData.items}
              filters={state.filters}
              onFilterChange={onFilterChange}
              showInfoText={props.showInfoText}
            />
          </>
        )}
      </div>
    </div>
  )
}

ProjectTimeline.defaultProps = {
  showInfoText: true
}

export * from './Timeline'
export * from './types'
