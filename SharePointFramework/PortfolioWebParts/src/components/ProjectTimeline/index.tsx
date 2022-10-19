import * as strings from 'PortfolioWebPartsStrings'
import React, { FunctionComponent } from 'react'
import { Timeline } from './Timeline'
import styles from './ProjectTimeline.module.scss'
import { IProjectTimelineProps } from './types'
import './ProjectTimeline.overrides.css'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import { useProjectTimeline } from './useProjectTimeline'
import { ProjectTimelineContext } from './context'
import { Spinner, format, MessageBarType } from '@fluentui/react'

export const ProjectTimeline: FunctionComponent<IProjectTimelineProps> = (props) => {
  const { state, setState, onFilterChange, onGroupChange } = useProjectTimeline(props)
  return (
    <ProjectTimelineContext.Provider
      value={{ props, state, setState, onFilterChange, onGroupChange }}>
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
                onFilterChange={onFilterChange.bind(this)}
                onGroupChange={onGroupChange.bind(this)}
                title={props.title}
              />
            </>
          )}
        </div>
      </div>
    </ProjectTimelineContext.Provider>
  )
}

export * from './types'
