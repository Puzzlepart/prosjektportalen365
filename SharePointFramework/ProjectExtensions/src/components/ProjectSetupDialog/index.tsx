import {
  DefaultButton,
  DialogFooter,
  format,
  MessageBar,
  Pivot,
  PivotItem,
  PrimaryButton
} from '@fluentui/react'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { BaseDialog } from '../@BaseDialog'
import { ContentConfigSection } from './ContentConfigSection'
import { ProjectSetupDialogContext } from './context'
import { ExtensionsSection } from './ExtensionsSection'
import styles from './TemplateSelectDialog.module.scss'
import { TemplateSelector } from './TemplateSelector'
import { IProjectSetupDialogProps } from './types'
import { useProjectSetupDialog } from './useProjectSetupDialog'

export const ProjectSetupDialog: FC<IProjectSetupDialogProps> = (props) => {
  const { state, dispatch, onSubmit, isConfigDisabled } = useProjectSetupDialog(props)

  return (
    <ProjectSetupDialogContext.Provider value={{ props, state, dispatch }}>
      <BaseDialog
        version={props.version}
        dialogContentProps={{
          title: strings.TemplateSelectDialogTitle,
          subText: strings.TemplateSelectDialogInfoText,
          className: styles.content
        }}
        modalProps={{ containerClassName: styles.root, isBlocking: true, isDarkOverlay: true }}
        onDismiss={props.onDismiss}
      >
        <Pivot style={{ minHeight: 450 }}>
          <PivotItem headerText={strings.TemplateSelectorTitle} itemIcon='ViewListGroup'>
            <TemplateSelector />
          </PivotItem>
          <PivotItem
            headerText={strings.ExtensionsSectionHeaderText}
            itemIcon='ArrangeBringForward'
            headerButtonProps={
              isConfigDisabled('extensions') && {
                disabled: true,
                style: { opacity: 0.3, cursor: 'default' }
              }
            }
          >
            <ExtensionsSection style={{ height: 400 }} />
          </PivotItem>
          <PivotItem
            headerText={strings.ContentConfigSectionHeaderText}
            itemIcon='ViewList'
            headerButtonProps={
              isConfigDisabled('contentConfig') && {
                disabled: true,
                style: { opacity: 0.3, cursor: 'default' }
              }
            }
          >
            <ContentConfigSection style={{ height: 400 }} />
          </PivotItem>
          <PivotItem
            headerText={strings.ProjectIdeasSectionHeaderText}
            itemIcon='Lightbulb'
          >

          </PivotItem>
        </Pivot>
        <DialogFooter>
          {props.tasks && (
            <MessageBar>
              {format(strings.ConfiguredSpecifiedTaskMessage, props.tasks.join(', '))}
            </MessageBar>
          )}
          <PrimaryButton
            disabled={!state.selectedTemplate}
            text={strings.TemplateSelectDialogSubmitButtonText}
            onClick={onSubmit}
          />
          <DefaultButton text={strings.CloseModalText} onClick={props.onDismiss} />
        </DialogFooter>
      </BaseDialog>
    </ProjectSetupDialogContext.Provider>
  )
}

export * from './types'
