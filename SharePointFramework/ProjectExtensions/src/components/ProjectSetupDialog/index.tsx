import { format } from '@fluentui/react'
import { Tab, TabList, Badge, Button } from '@fluentui/react-components'
import { PuzzlePieceRegular, DocumentBulletListRegular } from '@fluentui/react-icons'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC, useState } from 'react'
import { BaseDialog } from '../@BaseDialog'
import { ContentConfigSection } from './ContentConfigSection'
import { ProjectSetupDialogContext } from './context'
import { ExtensionsSection } from './ExtensionsSection'
import styles from './TemplateSelectDialog.module.scss'
import { TemplateSelector } from './TemplateSelector'
import { IProjectSetupDialogProps } from './types'
import { useProjectSetupDialog } from './useProjectSetupDialog'
import { getFluentIcon, UserMessage } from 'pp365-shared-library'

type ConfigTab = 'extensions' | 'contentConfig'

export const ProjectSetupDialog: FC<IProjectSetupDialogProps> = (props) => {
  const { state, dispatch, onSubmit, isConfigDisabled } = useProjectSetupDialog(props)
  const [activeTab, setActiveTab] = useState<ConfigTab>('extensions')

  const extensionsCount = state.selectedExtensions?.length ?? 0
  const contentConfigCount = state.selectedContentConfig?.length ?? 0
  const hasExtensions = !isConfigDisabled('extensions')
  const hasContentConfig = !isConfigDisabled('contentConfig')

  const footer = (
    <>
      {props.tasks && (
        <UserMessage
          title={strings.ConfiguredSpecifiedTaskTitle}
          text={format(strings.ConfiguredSpecifiedTaskMessage, props.tasks.join(', '))}
        />
      )}
      <section className={styles.actions}>
        <Button appearance='primary' disabled={!state.selectedTemplate} onClick={onSubmit}>
          {strings.ProjectSetupDialogSubmitButtonText}
        </Button>
        <Button appearance='secondary' onClick={props.onDismiss} style={{ marginLeft: 4 }}>
          {strings.CloseModalText}
        </Button>
      </section>
    </>
  )

  return (
    <ProjectSetupDialogContext.Provider value={{ props, state, dispatch }}>
      <BaseDialog
        version={props.version}
        title={strings.ProjectSetupDialogTitle}
        subText={strings.ProjectSetupDialogInfoText}
        containerClassName={styles.root}
        contentClassName={styles.content}
        isBlocking={true}
        onDismiss={props.onDismiss}
        footer={footer}
      >
        <div className={styles.templateHeader}>
          <TemplateSelector />
        </div>

        <div className={styles.configPane}>
          <TabList
            selectedValue={activeTab}
            onTabSelect={(_, data) => setActiveTab(data.value as ConfigTab)}
            className={styles.tabList}
          >
            <Tab value='extensions' disabled={!hasExtensions} icon={getFluentIcon('PuzzlePiece')}>
              <span className={styles.tabLabel}>
                {strings.ExtensionsSectionHeaderText}
                {hasExtensions && extensionsCount > 0 && (
                  <Badge appearance='filled' color='brand' size='small' className={styles.tabBadge}>
                    {extensionsCount}
                  </Badge>
                )}
              </span>
            </Tab>
            <Tab
              value='contentConfig'
              disabled={!hasContentConfig}
              icon={getFluentIcon('ListBar')}
            >
              <span className={styles.tabLabel}>
                {strings.ContentConfigSectionHeaderText}
                {hasContentConfig && contentConfigCount > 0 && (
                  <Badge appearance='filled' color='brand' size='small' className={styles.tabBadge}>
                    {contentConfigCount}
                  </Badge>
                )}
              </span>
            </Tab>
          </TabList>

          <div className={styles.tabContent}>
            {activeTab === 'extensions' && hasExtensions && <ExtensionsSection />}
            {activeTab === 'contentConfig' && hasContentConfig && <ContentConfigSection />}
            {activeTab === 'extensions' && !hasExtensions && (
              <div className={styles.emptyTabMessage}>
                <UserMessage text={strings.NoTemplateSelectedText} intent='info' />
              </div>
            )}
            {activeTab === 'contentConfig' && !hasContentConfig && (
              <div className={styles.emptyTabMessage}>
                <UserMessage text={strings.NoTemplateSelectedText} intent='info' />
              </div>
            )}
          </div>
        </div>

        <div className={styles.projectDataMessage} hidden={!props.data.projectData}>
          <UserMessage
            title={strings.ProjectDataFoundTitle}
            text={strings.ProjectDataFoundMessage}
            intent='success'
          />
        </div>
      </BaseDialog>
    </ProjectSetupDialogContext.Provider>
  )
}

export * from './types'
