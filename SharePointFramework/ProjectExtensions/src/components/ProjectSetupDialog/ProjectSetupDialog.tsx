import { Button } from '@fluentui/react-components'
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
import { UserMessage, format } from 'pp365-shared-library'
import resource from 'SharedResources'

/**
 * The project setup: the template, the extensions and the list content to set the project up
 * with, under each other in one scrolling area above the actions.
 */
export const ProjectSetupDialog: FC<IProjectSetupDialogProps> = (props) => {
  const { state, dispatch, onSubmit, summaryText, isSubmitDisabled } = useProjectSetupDialog(props)

  const footer = (
    <div className={styles.footer}>
      {props.tasks && (
        <UserMessage
          title={strings.ConfiguredSpecifiedTaskTitle}
          text={format(strings.ConfiguredSpecifiedTaskMessage, props.tasks.join(', '))}
        />
      )}
      <div className={styles.actions}>
        <span className={styles.summary}>{summaryText}</span>
        <Button appearance='primary' disabled={isSubmitDisabled} onClick={onSubmit}>
          {strings.ProjectSetupDialogSubmitButtonText}
        </Button>
        <Button appearance='secondary' onClick={props.onDismiss}>
          {strings.CloseModalText}
        </Button>
      </div>
    </div>
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
          <UserMessage
            title={strings.NoHubWriteAccessTitle}
            text={format(strings.NoHubWriteAccessMessage, resource.Lists_Projects_Title)}
            intent='warning'
          />
        )}
        {/* A hidden message bar still announces itself, so mount it only when applicable. */}
        {props.data.projectData && (
          <UserMessage
            title={strings.ProjectDataFoundTitle}
            text={strings.ProjectDataFoundMessage}
            intent='success'
          />
        )}
        <TemplateSelector />
        <ExtensionsSection />
        <ContentConfigSection />
      </BaseDialog>
    </ProjectSetupDialogContext.Provider>
  )
}
