import React, { FC } from 'react'
import { ProjectStatusContext, SummarySection, Header } from '../../ProjectStatus'
import { useProjectInformationContext } from '../context'
import styles from './ProjectStatusReport.module.scss'
import { useProjectStatusReport } from './useProjectStatusReport'

export const ProjectStatusReport: FC = () => {
  const context = useProjectInformationContext()
  const projectStatusContext = useProjectStatusReport()
  if (!projectStatusContext) return null
  return (
    <div className={styles.root}>
      <ProjectStatusContext.Provider value={projectStatusContext}>
        <Header />
        <SummarySection
          transparent
          noPadding
          noMargin
          iconsOnly={context.props.statusReportShowOnlyIcons}
          iconSize={18}
          truncateComment={context.props.statusReportTruncateComments}
        />
      </ProjectStatusContext.Provider>
    </div>
  )
}
