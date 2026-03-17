import { ScrollablePane } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import { Fluent, UserMessage } from 'pp365-shared-library'
import React, { FC } from 'react'
import SPDataAdapter from '../../data'
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
  const showNoHubAccessMessage =
    !context.state.selectedReport && SPDataAdapter.portalDataService?.isAvailable === false

  return (
    <ProjectStatusContext.Provider value={context}>
      <Fluent>
        <div className={styles.root}>
          <ScrollablePane>
            <div className={styles.header}>
              <Header />
              <PublishedStatus />
            </div>
            <UserMessages />
            {context.state.error || showNoHubAccessMessage ? (
              <div className={styles.messageContainer}>
                <UserMessage
                  title={strings.ErrorTitle}
                  text={
                    context.state.error?.message ?? strings.ProjectStatusNoHubAccessErrorText
                  }
                  intent='warning'
                />
              </div>
            ) : (
              <>
                <Commands />
                <SectionTabs />
                <div className={styles.container}>
                  <Sections />
                </div>
              </>
            )}
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
