import React, { FC } from 'react'
import { Commands } from './Commands'
import { ProjectStatusContext } from './context'
import { Header } from './Header'
import styles from './ProjectStatus.module.scss'
import { Sections } from './Sections'
import { IProjectStatusProps } from './types'
import { useProjectStatus } from './useProjectStatus'

export const ProjectStatus: FC<IProjectStatusProps> = (props) => {
  const { state, setState } = useProjectStatus(props)
  return (
    <ProjectStatusContext.Provider value={{ props, state, setState }}>
      <div className={styles.root}>
        <Commands />
        <div className={styles.container}>
          <Header />
          <Sections />
        </div>
      </div>
    </ProjectStatusContext.Provider>
  )
}

export * from './types'
