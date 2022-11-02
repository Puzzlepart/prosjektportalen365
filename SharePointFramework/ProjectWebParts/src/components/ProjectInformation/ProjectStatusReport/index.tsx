import { ProjectStatusContext } from 'components/ProjectStatus/context'
import React, { FC } from 'react'
import { Header } from '../../ProjectStatus/Header'
import { SummarySection } from '../../ProjectStatus/Sections/SummarySection'
import styles from './ProjectStatusReport.module.scss'
import { useProjectStatusReport } from './useProjectStatusReport'

export const ProjectStatusReport: FC = () => {
  const { projectStatusContext } = useProjectStatusReport()
  return (
    <div className={styles.root}>
      <ProjectStatusContext.Provider value={projectStatusContext}>
        <Header className={styles.header} />
        <SummarySection transparent noPadding noMargin iconSize={18} />
      </ProjectStatusContext.Provider>
    </div>
  )
}
