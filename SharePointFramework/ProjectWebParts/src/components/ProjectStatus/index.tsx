import React, { FC } from 'react'
import { Commands } from './Commands'
import { ProjectStatusContext } from './context'
import { Header } from './Header'
import styles from './ProjectStatus.module.scss'
import { Sections } from './Sections'
import { IProjectStatusProps } from './types'
import { UnpublishedStatusReportInfo } from './UnpublishedStatusReportInfo'
import {  useProjectStatusContext } from './useProjectStatusContext'

export const ProjectStatus: FC<IProjectStatusProps> = (props) => {
  const ctxValue = useProjectStatusContext(props)
  return (
    <ProjectStatusContext.Provider value={ctxValue}>
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
