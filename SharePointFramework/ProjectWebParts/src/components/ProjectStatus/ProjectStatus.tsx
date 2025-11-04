import { ScrollablePane } from '@fluentui/react'
import { Fluent } from 'pp365-shared-library'
import React, { FC } from 'react'
import { Commands } from './Commands/Commands'
import { EditStatusPanel } from './EditStatusPanel'
import { Header } from './Header/Header'
import styles from './ProjectStatus.module.scss'
import { PublishedStatus } from './PublishedStatus'
import { SectionTabs } from './SectionTabs'
import { Sections } from './Sections/Sections'
import { UserMessages } from './UserMessages/UserMessages'
import { ProjectStatusContext } from './context'
import { IProjectStatusProps } from './types'
import { useProjectStatus } from './useProjectStatus'
import resource from 'SharedResources'

export const ProjectStatus: FC<IProjectStatusProps> = (props) => {
  const { context } = useProjectStatus(props)

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
      </Fluent>
    </ProjectStatusContext.Provider>
  )
}

ProjectStatus.displayName = 'ProjectStatus'
ProjectStatus.defaultProps = {
  title: resource.WebParts_ProjectStatus_Title,
  fieldWidth: 250,
  persistSectionDataAttachmentFileName: 'PersistedSectionDataJson.json',
  snapshotAttachmentFileName: 'Snapshot.png',
  description: ''
}
