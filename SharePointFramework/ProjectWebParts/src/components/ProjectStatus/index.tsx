import { WebPartTitle } from 'pp365-shared-library'
import React, { FC } from 'react'
import { Commands } from './Commands'
import styles from './ProjectStatus.module.scss'
import { Sections } from './Sections'
import { UserMessages } from './UserMessages'
import { ProjectStatusContext } from './context'
import { IProjectStatusProps } from './types'
import { useProjectStatus } from './useProjectStatus'

export const ProjectStatus: FC<IProjectStatusProps> = (props) => {
  const {context, title} = useProjectStatus(props)
  return (
    <ProjectStatusContext.Provider value={context}>
      <div className={styles.root}>
        <Commands />
        <div className={styles.container}>
          <UserMessages />
          <WebPartTitle title={title} />
          <Sections />
        </div>
      </div>
    </ProjectStatusContext.Provider>
  )
}

ProjectStatus.defaultProps = {
  persistSectionDataAttachmentFileName: 'PersistedSectionDataJson.json',
  snapshotAttachmentFileName: 'Snapshot.png'
}

export * from './Sections'
export * from './context'
export * from './types'
