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
import { FluentProvider, webLightTheme } from '@fluentui/react-components'


export const ProjectStatus: FC<IProjectStatusProps> = (props) => {
  const { fluentProviderId, context } = useProjectStatus(props)
  return (
    <ProjectStatusContext.Provider value={context}>
      <FluentProvider id={fluentProviderId} theme={webLightTheme}>
        <div className={styles.root}>
          <Commands />
          <div className={styles.container}>
            <UserMessages />
            <Header />
            <Sections />
          </div>
        </div>
        <EditStatusPanel />
      </FluentProvider>
    </ProjectStatusContext.Provider>
  )
}

ProjectStatus.displayName = 'ProjectStatus'
ProjectStatus.defaultProps = {
  persistSectionDataAttachmentFileName: 'PersistedSectionDataJson.json',
  snapshotAttachmentFileName: 'Snapshot.png',
  description: ''
}
