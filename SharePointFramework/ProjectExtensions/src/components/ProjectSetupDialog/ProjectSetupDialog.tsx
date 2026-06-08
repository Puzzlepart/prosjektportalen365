import { format } from '@fluentui/react'
import { Tab, TabList, Badge, Button, Tooltip } from '@fluentui/react-components'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC, useEffect, useState } from 'react'
import { BaseDialog } from '../@BaseDialog'
import { ContentConfigSection } from './ContentConfigSection'
import { ProjectSetupDialogContext } from './context'
import { ExtensionsSection } from './ExtensionsSection'
import styles from './ProjectSetupDialog.module.scss'
import { TemplateSelector } from './TemplateSelector'
import { IProjectSetupDialogProps } from './types'
import { useProjectSetupDialog } from './useProjectSetupDialog'
import { getFluentIcon, UserMessage } from 'pp365-shared-library'

type ConfigTab = 'extensions' | 'contentConfig'

export const ProjectSetupDialog: FC<IProjectSetupDialogProps> = (props) => {
  const { state, dispatch, onSubmit, isConfigDisabled } = useProjectSetupDialog(props)

  const extensionsCount = state.selectedExtensions?.length ?? 0
  const contentConfigCount = state.selectedContentConfig?.length ?? 0
  const hasExtensions = !isConfigDisabled('extensions')
  const hasContentConfig = !isConfigDisabled('contentConfig')

  const defaultTab: ConfigTab = hasExtensions ? 'extensions' : 'contentConfig'
  const [activeTab, setActiveTab] = useState<ConfigTab>(defaultTab)

  useEffect(() => {
    if (hasExtensions) {
      setActiveTab('extensions')
    } else if (hasContentConfig) {
      setActiveTab('contentConfig')
    }
  }, [hasExtensions, hasContentConfig])

  const footer = (
    <>
      {props.tasks && (
        <UserMessage
          title={strings.ConfiguredSpecifiedTaskTitle}
          text={format(strings.ConfiguredSpecifiedTaskMessage, props.tasks.join(', '))}
        />
      )}
      <section className={styles.actions}>
        <Button
          appearance='primary'
          disabled={
            !state.selectedTemplate ||
            state.isResolvingCloudTemplate ||
            // A skymal can only be submitted once its .pppkg has resolved.
            (state.selectedTemplate.isCloudTemplate && !state.resolvedCloudTemplate)
          }
          onClick={onSubmit}
        >
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
        versionTooltip={
          DEBUG ? props.version : format(strings.ProjectSetupDialogVersionTooltip, props.version)
        }
        title={strings.ProjectSetupDialogTitle}
        containerClassName={styles.root}
        contentClassName={styles.content}
        isBlocking={true}
        onDismiss={props.onDismiss}
        footer={footer}
      >
        <p className={styles.subText}>{strings.ProjectSetupDialogInfoText}</p>
        <TemplateSelector />
        <div className={styles.configPane}>
          <TabList
            selectedValue={activeTab}
            onTabSelect={(_, data) => setActiveTab(data.value as ConfigTab)}
            className={styles.tabList}
          >
            <Tooltip
              content={
                hasExtensions
                  ? strings.ExtensionsSectionTooltip
                  : strings.ExtensionsSectionDisabledTooltip
              }
              relationship='description'
              positioning='above'
            >
              <Tab value='extensions' disabled={!hasExtensions} icon={getFluentIcon('PuzzlePiece')}>
                <span className={styles.tabLabel}>
                  {strings.ExtensionsSectionHeaderText}
                  {hasExtensions && extensionsCount > 0 && (
                    <Badge
                      appearance='filled'
                      color='brand'
                      size='small'
                      className={styles.tabBadge}
                    >
                      {extensionsCount}
                    </Badge>
                  )}
                </span>
              </Tab>
            </Tooltip>
            <Tooltip
              content={
                hasContentConfig
                  ? strings.ContentConfigSectionTooltip
                  : strings.ContentConfigSectionDisabledTooltip
              }
              relationship='description'
              positioning='above'
            >
              <Tab
                value='contentConfig'
                disabled={!hasContentConfig}
                icon={getFluentIcon('ListBar')}
              >
                <span className={styles.tabLabel}>
                  {strings.ContentConfigSectionHeaderText}
                  {hasContentConfig && contentConfigCount > 0 && (
                    <Badge
                      appearance='filled'
                      color='brand'
                      size='small'
                      className={styles.tabBadge}
                    >
                      {contentConfigCount}
                    </Badge>
                  )}
                </span>
              </Tab>
            </Tooltip>
          </TabList>

          <div className={styles.tabContent}>
            {activeTab === 'extensions' && hasExtensions && <ExtensionsSection />}
            {activeTab === 'contentConfig' && hasContentConfig && <ContentConfigSection />}
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
