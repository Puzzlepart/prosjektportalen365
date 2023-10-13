import React, { FC } from 'react'
import { Commands } from './Commands'
import { Header } from './Header'
import styles from './ProjectStatus.module.scss'
import { Sections } from './Sections'
import { UserMessages } from './UserMessages'
import { ProjectStatusContext } from './context'
import { IProjectStatusProps } from './types'
import { useProjectStatus } from './useProjectStatus'
import { EditStatusPanel } from './EditStatusPanel'

export const ProjectStatus: FC<IProjectStatusProps> = (props) => {
  const { context } = useProjectStatus(props)
  return (
    <ProjectStatusContext.Provider value={context}>
      <div className={styles.root}>
        <Commands />
        <div className={styles.container}>
          <UserMessages />
          <Header />
          <Sections />
        </div>
      </div>
      <EditStatusPanel />
    </ProjectStatusContext.Provider>
  )
}

ProjectStatus.defaultProps = {
  persistSectionDataAttachmentFileName: 'PersistedSectionDataJson.json',
  snapshotAttachmentFileName: 'Snapshot.png',
  description: ''
}

export * from './Sections'
export * from './context'
export * from './types'
export * from './Header'
