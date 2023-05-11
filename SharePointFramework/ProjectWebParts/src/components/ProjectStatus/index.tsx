import React, { FC } from 'react'
import { Commands } from './Commands'
import { ProjectStatusContext } from './context'
import { useProjectStatus } from './useProjectStatus'
import { Header } from './Header'
import styles from './ProjectStatus.module.scss'
import { Sections } from './Sections'
import { IProjectStatusProps } from './types'
import { UserMessages } from './UserMessages'

export const ProjectStatus: FC<IProjectStatusProps> = (props) => {
  const ctx = useProjectStatus(props)
  return (
    <ProjectStatusContext.Provider {...ctx}>
      <div className={styles.root}>
        <Commands />
        <div className={styles.container}>
          <UserMessages />
          <Header />
          <Sections />
        </div>
      </div>
    </ProjectStatusContext.Provider>
  )
}

ProjectStatus.defaultProps = {
  persistSectionDataAttachmentFileName: 'PersistedSectionData.json',
  snapshotAttachmentFileName: 'Snapshot.png'
}

export * from './types'
export * from './context'
export * from './Sections'
