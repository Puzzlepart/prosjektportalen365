import React, { FC } from 'react'
import { Header } from '../../ProjectStatus/Header'
import { SummarySection, ProjectStatusContext } from '../../ProjectStatus'
import styles from './ProjectStatusReport.module.scss'
import { useProjectStatusReport } from './useProjectStatusReport'

export const ProjectStatusReport: FC = () => {
  const projectStatusContext = useProjectStatusReport()
  return projectStatusContext ? (
    <div className={styles.root}>
      <ProjectStatusContext.Provider value={projectStatusContext}>
        <Header className={styles.header} />
        <SummarySection transparent noPadding noMargin iconSize={18} />
      </ProjectStatusContext.Provider>
    </div>
  ) : null
}
