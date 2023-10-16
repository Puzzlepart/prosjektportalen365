import React, { FC } from 'react'
import { Commands } from './Commands'
import { EditStatusPanel } from './EditStatusPanel'
import { Header } from './Header/Header'
import styles from './ProjectStatus.module.scss'
import { Sections } from './Sections/Sections'
import { UserMessages } from './UserMessages'
import { ProjectStatusContext } from './context'
import { IProjectStatusProps } from './types'
import { useProjectStatus } from './useProjectStatus'
import { Fluent } from 'pp365-shared-library'

export const ProjectStatus: FC<IProjectStatusProps> = (props) => {
  const { context } = useProjectStatus(props)
  return (
    <ProjectStatusContext.Provider value={context}>
      <Fluent>
        <div className={styles.root}>
          <Commands />
          <div className={styles.container}>
            <UserMessages />
            <Header />
            <Sections />
          </div>
        </div>
        <EditStatusPanel />
      </Fluent>
    </ProjectStatusContext.Provider>
  )
}

ProjectStatus.displayName = 'ProjectStatus'
ProjectStatus.defaultProps = {
  persistSectionDataAttachmentFileName: 'PersistedSectionDataJson.json',
  snapshotAttachmentFileName: 'Snapshot.png',
  description: ''
}
