import React, { FC } from 'react'
import { ProjectStatusContext, SummarySection } from '../../ProjectStatus'
import { useProjectInformationContext } from '../context'
import styles from './ProjectStatusReport.module.scss'
import { useProjectStatusReport } from './useProjectStatusReport'

export const ProjectStatusReport: FC = () => {
  const context = useProjectInformationContext()
  const projectStatusContext = useProjectStatusReport()
  return projectStatusContext ? (
    <div className={styles.root}>
      <ProjectStatusContext.Provider value={projectStatusContext}>
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
  ) : null
}
