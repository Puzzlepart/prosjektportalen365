import { ProjectStatusContext } from 'components/ProjectStatus/context'
import { SummarySection } from 'components/ProjectStatus/Sections/SummarySection'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import _ from 'underscore'
import { ProjectInformationContext } from '../context'
import styles from './ProjectStatusReport.module.scss'

export const ProjectStatusReport: FC = () => {
  const context = useContext(ProjectInformationContext)
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span role='heading' aria-level={3}>
          {strings.ProjectStatusReportHeaderText}
        </span>
      </div>
      <ProjectStatusContext.Provider
        value={{
          props: null,
          state: { ...context.state, selectedReport: _.first(context.state.data.reports) }
        }}>
        <SummarySection transparent />
      </ProjectStatusContext.Provider>
    </div>
  )
}
