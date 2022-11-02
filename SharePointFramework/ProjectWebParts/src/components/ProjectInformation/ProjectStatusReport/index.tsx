import React, { FC, useContext } from 'react'
import { Header } from '../../ProjectStatus/Header'
import { SummarySection, ProjectStatusContext } from '../../ProjectStatus'
import styles from './ProjectStatusReport.module.scss'
import { useProjectStatusReport } from './useProjectStatusReport'
import { ProjectInformationContext } from '../context'

export const ProjectStatusReport: FC = () => {
  const context = useContext(ProjectInformationContext)
  const projectStatusContext = useProjectStatusReport()
  return projectStatusContext ? (
    <div className={styles.root}>
      <ProjectStatusContext.Provider value={projectStatusContext}>
        <Header className={styles.header} />
        <SummarySection
          transparent
          noPadding
          noMargin
          iconSize={18}
          truncateComment={context.props.statusReportTruncateComments}
        />
      </ProjectStatusContext.Provider>
    </div>
  ) : null
}
