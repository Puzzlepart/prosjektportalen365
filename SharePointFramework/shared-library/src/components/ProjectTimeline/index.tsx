import React, { FC } from 'react'
import styles from './ProjectTimeline.module.scss'
import { Timeline } from './Timeline'
import { IProjectTimelineProps } from './types'
import { useProjectTimeline } from './useProjectTimeline'
import { Alert } from '@fluentui/react-components/unstable'

export const ProjectTimeline: FC<IProjectTimelineProps> = (props) => {
  const { state, onFilterChange } = useProjectTimeline(props)
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {!state.isDataLoaded ? null : state.error ?
          (
            <Alert intent='error'>{state.error.message}</Alert>
          ) : (
            <>
              <Timeline
                title={props.title}
                groups={state.filteredData.groups}
                items={state.filteredData.items}
                filters={state.filters}
                onFilterChange={onFilterChange}
                infoText={props.infoText}
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
