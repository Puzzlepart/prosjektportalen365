import { Tab, TabList, Badge, Button, Tooltip } from '@fluentui/react-components'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { BaseDialog } from '../@BaseDialog'
import { ContentConfigSection } from './ContentConfigSection'
import { ProjectSetupDialogContext } from './context'
import { ExtensionsSection } from './ExtensionsSection'
import styles from './ProjectSetupDialog.module.scss'
import { TemplateSelector } from './TemplateSelector'
import { IProjectSetupDialogProps } from './types'
import { useProjectSetupDialog } from './useProjectSetupDialog'
import { getFluentIcon, UserMessage, format } from 'pp365-shared-library'
import resource from 'SharedResources'

/**
 * The project setup: the template, the extensions and the list content to set the project up with.
 */
export const ProjectSetupDialog: FC<IProjectSetupDialogProps> = (props) => {
  const {
    state,
    dispatch,
    onSubmit,
    extensionsCount,
    contentConfigCount,
    hasExtensions,
    hasContentConfig,
    activeTab,
    onTabSelect,
    tabIds,
    tabLabel,
    isSubmitDisabled
  } = useProjectSetupDialog(props)

  const footer = (
    <>
      {props.tasks && (
        <UserMessage
          title={strings.ConfiguredSpecifiedTaskTitle}
          text={format(strings.ConfiguredSpecifiedTaskMessage, props.tasks.join(', '))}
        />
      )}
      <section className={styles.actions}>
        <Button appearance='primary' disabled={isSubmitDisabled} onClick={onSubmit}>
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
        {props.data.hasHubWriteAccess === false && (
          <div className={styles.hubAccessMessage}>
            <UserMessage
              title={strings.NoHubWriteAccessTitle}
              text={format(strings.NoHubWriteAccessMessage, resource.Lists_Projects_Title)}
              intent='warning'
            />
          </div>
        )}
        <TemplateSelector />
        <div className={styles.configPane}>
          <TabList selectedValue={activeTab} onTabSelect={onTabSelect} className={styles.tabList}>
            <Tooltip
              content={
                hasExtensions
                  ? strings.ExtensionsSectionTooltip
                  : strings.ExtensionsSectionDisabledTooltip
              }
              relationship='description'
              positioning='above'
            >
              <Tab
                value='extensions'
                id={tabIds.extensions}
                aria-label={tabLabel(strings.ExtensionsSectionHeaderText, extensionsCount)}
                icon={getFluentIcon('PuzzlePiece')}
              >
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
                id={tabIds.contentConfig}
                aria-label={tabLabel(strings.ContentConfigSectionHeaderText, contentConfigCount)}
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

          <div className={styles.tabContent} role='tabpanel' aria-labelledby={tabIds[activeTab]}>
            {/* A section with nothing to choose says so in its panel: its tab was disabled,
                skipped by the keyboard, with why only in its tooltip (WCAG 2.1.1, 1.3.1). */}
            {activeTab === 'extensions' &&
              (hasExtensions ? (
                <ExtensionsSection />
              ) : (
                <UserMessage text={strings.ExtensionsSectionDisabledTooltip} />
              ))}
            {activeTab === 'contentConfig' &&
              (hasContentConfig ? (
                <ContentConfigSection />
              ) : (
                <UserMessage text={strings.ContentConfigSectionDisabledTooltip} />
              ))}
          </div>
        </div>

        {/* Rendered only with project data: a message bar announces itself when it mounts, so a
            hidden one was read out to a screen reader on every setup. */}
        {props.data.projectData && (
          <div className={styles.projectDataMessage}>
            <UserMessage
              title={strings.ProjectDataFoundTitle}
              text={strings.ProjectDataFoundMessage}
              intent='success'
            />
          </div>
        )}
      </BaseDialog>
    </ProjectSetupDialogContext.Provider>
  )
}
