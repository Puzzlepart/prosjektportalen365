import { DefaultButton, DialogFooter, Pivot, PivotItem, PrimaryButton } from '@fluentui/react'
import * as strings from 'ProjectExtensionsStrings'
import React, { FunctionComponent } from 'react'
import { isEmpty } from 'underscore'
import { BaseDialog } from '../@BaseDialog'
import { TemplateSelectDialogContext } from './context'
import { ExtensionsSection } from './ExtensionsSection'
import { ListContentSection } from './ListContentSection'
import { TemplateListContentConfigMessage } from './TemplateListContentConfigMessage'
import styles from './TemplateSelectDialog.module.scss'
import { TemplateSelector } from './TemplateSelector'
import { ITemplateSelectDialogProps } from './types'
import { useTemplateSelectDialog } from './useTemplateSelectDialog'

export const TemplateSelectDialog: FunctionComponent<ITemplateSelectDialogProps> = (props) => {
  const { state, setState, onSubmit } = useTemplateSelectDialog(props)

  return (
    <TemplateSelectDialogContext.Provider value={{ props, state, setState }}>
      <BaseDialog
        version={props.version}
        dialogContentProps={{
          title: strings.TemplateSelectDialogTitle,
          subText: strings.TemplateSelectDialogInfoText,
          className: styles.content
        }}
        modalProps={{ containerClassName: styles.root, isBlocking: true, isDarkOverlay: true }}
        onDismiss={props.onDismiss}
        containerClassName={styles.root}>
        <Pivot style={{ minHeight: 350, height: state.flexibleHeight }}>
          <PivotItem headerText={strings.TemplateSelectorTitle} itemIcon='ViewListGroup'>
            <TemplateSelector />
            {(state.selectedTemplate?.listContentConfigIds ||
              state.selectedTemplate?.listExtensionIds) && (
                <TemplateListContentConfigMessage selectedTemplate={state.selectedTemplate} />
              )}
          </PivotItem>
          {!isEmpty(props.data.extensions) && (
            <PivotItem headerText={strings.ExtensionsTitle} itemIcon='ArrangeBringForward'>
              {state.selectedTemplate?.listExtensionIds && (
                <TemplateListContentConfigMessage selectedTemplate={state.selectedTemplate} />
              )}
              <ExtensionsSection />
            </PivotItem>
          )}
          {!isEmpty(props.data.listContentConfig) && (
            <PivotItem headerText={strings.ListContentTitle} itemIcon='ViewList'>
              {state.selectedTemplate?.listContentConfigIds && (
                <TemplateListContentConfigMessage selectedTemplate={state.selectedTemplate} />
              )}
              <ListContentSection />
            </PivotItem>
          )}
        </Pivot>
        <DialogFooter>
          <PrimaryButton
            disabled={!state.selectedTemplate}
            text={strings.TemplateSelectDialogSubmitButtonText}
            onClick={onSubmit}
          />
          <DefaultButton text={strings.CloseModalText} onClick={props.onDismiss} />
        </DialogFooter>
      </BaseDialog>
    </TemplateSelectDialogContext.Provider>
  )
}

export * from './types'
