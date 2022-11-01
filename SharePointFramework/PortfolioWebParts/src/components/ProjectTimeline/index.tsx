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
  const { state, onFilterChange, onGroupChange } = useProjectTimeline(props)
  return (
      <div className={styles.root}>
        <div className={styles.container}>
          {state.loading ? (
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
                defaultTimeStart={[-1, 'months']}
                defaultTimeEnd={[1, 'years']}
                groups={state.filteredData.groups}
                items={state.filteredData.items}
                infoText={strings.ProjectTimelineInfoText}
                filters={state.filters}
                onFilterChange={onFilterChange}
                onGroupChange={onGroupChange}
                title={props.title}
              />
            </>
          )}
        </div>
      </div>
  )
}

export * from './types'
