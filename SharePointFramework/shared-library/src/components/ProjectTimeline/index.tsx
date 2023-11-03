import React, { FC } from 'react'
import styles from './ProjectTimeline.module.scss'
import { Timeline } from './Timeline'
import { IProjectTimelineProps } from './types'
import { useProjectTimeline } from './useProjectTimeline'
import { UserMessage } from '../UserMessage'
import strings from 'SharedLibraryStrings'

export const ProjectTimeline: FC<IProjectTimelineProps> = (props) => {
  const { state, onFilterChange } = useProjectTimeline(props)
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {!state.isDataLoaded ? null : state.error ? (
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
            />
          </>
        )}
      </div>
    </div>
  )
}

export * from './Timeline'
export * from './types'
