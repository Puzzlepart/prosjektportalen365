import { format, Spinner } from '@fluentui/react'
import { ItemFieldValues } from 'pp365-shared-library'
import { CustomEditPanel, Timeline, UserMessage } from 'pp365-shared-library/lib/components'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import SPDataAdapter from '../../data'
import { ProjectTimelineContext } from './context'
import styles from './ProjectTimeline.module.scss'
import { TimelineList } from './TimelineList/TimelineList'
import { IProjectTimelineProps } from './types'
import { useProjectTimeline } from './useProjectTimeline'

export const ProjectTimeline: FC<IProjectTimelineProps> = (props) => {
  const { state, setState, onFilterChange, onGroupByChange, defaultTimeframe } =
    useProjectTimeline(props)

  return (
    <ProjectTimelineContext.Provider value={{ props, state, setState }}>
      <div className={styles.root}>
        <div className={styles.container}>
          {!state.isDataLoaded ? (
            <div className={styles.root}>
              <div className={styles.container}>
                <Spinner label={format(strings.LoadingText, props.title)} />
              </div>
            </div>
          ) : state.error ? (
            <UserMessage intent='warning' text={state.error.message} />
          ) : (
            <div>
              {props.showTimeline && (
                <Timeline
                  title={props.title}
                  infoText={strings.ProjectTimelineListInfoText}
                  defaultTimeframe={defaultTimeframe}
                  groups={state.filteredData.groups}
                  items={state.filteredData.items}
                  filters={state.filters}
                  onFilterChange={onFilterChange}
                  onGroupByChange={onGroupByChange}
                  defaultGroupBy={props.defaultGroupBy}
                  isGroupByEnabled
                />
              )}
              {props.showTimelineList && <TimelineList />}
            </div>
          )}
        </div>
      </div>
      <CustomEditPanel
        {...state.panel}
        fields={state.data?.fields}
        fieldValues={new ItemFieldValues()}
        dataAdapter={SPDataAdapter}
      />
    </ProjectTimelineContext.Provider>
  )
}

ProjectTimeline.displayName = 'ProjectTimeline'
ProjectTimeline.defaultProps = {
  showTimeline: true,
  showTimelineList: true,
  showTimelineListCommands: true,
  defaultTimeframeStart: '4,months',
  defaultTimeframeEnd: '4,months',
  defaultGroupBy: strings.TypeLabel,
  showProjectDeliveries: false,
  projectDeliveriesListName: 'Prosjektleveranser',
  configItemTitle: 'Prosjektleveranse',
  defaultCategory: 'Styring'
}