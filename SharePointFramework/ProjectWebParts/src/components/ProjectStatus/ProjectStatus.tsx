import React, { FC } from 'react'
import { Commands } from './Commands/Commands'
import { EditStatusPanel } from './EditStatusPanel'
import { Header } from './Header/Header'
import styles from './ProjectStatus.module.scss'
import { Sections } from './Sections/Sections'
import { ProjectStatusContext } from './context'
import { IProjectStatusProps } from './types'
import { useProjectStatus } from './useProjectStatus'
import { Fluent } from 'pp365-shared-library'
import { PublishedStatus } from './PublishedStatus'
import { UserMessages } from './UserMessages/UserMessages'
import { SectionTabs } from './SectionTabs'
import { ScrollablePane } from '@fluentui/react'
import { Toaster } from '@fluentui/react-components'

export const ProjectStatus: FC<IProjectStatusProps> = (props) => {
  const { context, toasterId } = useProjectStatus(props)

  return (
    <ProjectStatusContext.Provider value={context}>
      <Fluent>
        <div className={styles.root}>
          <ScrollablePane>
            <div className={styles.header}>
              <Header />
              <PublishedStatus />
            </div>
            <Commands />
            <SectionTabs />
            <UserMessages />
            <div className={styles.container}>
              <Sections />
            </div>
          </ScrollablePane>
        </div>
        <EditStatusPanel />
        <Toaster id={toasterId} />
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
