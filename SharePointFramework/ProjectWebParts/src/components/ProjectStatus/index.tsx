import React, { FC } from 'react'
import { Commands } from './Commands'
import { ProjectStatusContext } from './context'
import { useProjectStatus } from './useProjectStatus'
import { Header } from './Header'
import styles from './ProjectStatus.module.scss'
import { Sections } from './Sections'
import { IProjectStatusProps } from './types'
import { UnpublishedStatusReportInfo } from './UnpublishedStatusReportInfo'

export const ProjectStatus: FC<IProjectStatusProps> = (props) => {
  const ctx = useProjectStatus(props)
  return (
    <ProjectStatusContext.Provider {...ctx}>
      <div className={styles.root}>
        <Commands />
        <div className={styles.container}>
          <UnpublishedStatusReportInfo />
          <Header />
          <Sections />
        </div>
      </div>
    </ProjectStatusContext.Provider>
  )
}

export * from './types'
export * from './context'
export * from './Sections'
