import { format, MessageBarType, Spinner } from 'office-ui-fabric-react'
import { Timeline } from 'pp365-portfoliowebparts/lib/components/ProjectTimeline/Timeline'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import * as strings from 'ProjectWebPartsStrings'
import React, { FunctionComponent } from 'react'
import { ProjectTimelineContext } from './context'
import styles from './ProjectTimeline.module.scss'
import { TimelineList } from './TimelineList'
import { IProjectTimelineProps } from './types'
import { useProjectTimeline } from './useProjectTimeline'

/**
 * @component ProjectTimeline (Project webpart)
 * @extends Component
 */
export const ProjectTimeline: FunctionComponent<IProjectTimelineProps> = (props) => {
  const { state, setState, onFilterChange, onGroupChange } = useProjectTimeline(props)

  return (
    <ProjectTimelineContext.Provider value={{ props, state, setState, onGroupChange }}>
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
              {props.showTimeline && (
                <Timeline
                  defaultTimeStart={[-1, 'years']}
                  defaultTimeEnd={[1, 'years']}
                  groups={state.filteredData.groups}
                  items={state.filteredData.items}
                  filters={state.filters}
                  onFilterChange={onFilterChange.bind(this)}
                  onGroupChange={onGroupChange.bind(this)}
                  isGroupByEnabled
                  infoText={strings.ProjectTimelineListInfoText}
                  title={props.title}
                />
              )}
              {props.showTimelineList && <TimelineList />}
            </>
          )}
        </div>
      </div>
    </ProjectTimelineContext.Provider>
  )
}

export * from './types'
