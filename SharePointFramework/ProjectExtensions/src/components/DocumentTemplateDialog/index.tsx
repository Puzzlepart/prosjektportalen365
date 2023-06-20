/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  DefaultButton,
  DialogFooter,
  format,
  MessageBarType,
  PrimaryButton,
  Selection
} from '@fluentui/react'
import { FileAddResult } from '@pnp/sp'
import * as strings from 'ProjectExtensionsStrings'
import React, { FC, useContext, useEffect, useReducer } from 'react'
import { TemplateSelectorContext } from 'templateSelector/context'
import { isEmpty } from 'underscore'
import { SPDataAdapter } from '../../data'
import { TemplateItem } from '../../models/index'
import { BaseDialog } from '../@BaseDialog/index'
import { InfoMessage } from '../InfoMessage'
import { DocumentTemplateDialogContext } from './context'
import { CopyProgressScreen } from './CopyProgressScreen'
import styles from './DocumentTemplateDialog.module.scss'
import { EditCopyScreen } from './EditCopyScreen'
import reducer, {
  COPY_DONE,
  COPY_PROGRESS,
  initState,
  SELECTION_CHANGED,
  SET_SCREEN,
  START_COPY
} from './reducer'
import { SelectScreen } from './SelectScreen'
import { TargetFolderScreen } from './TargetFolderScreen'
import {
  DocumentTemplateDialogScreen,
  IDocumentTemplateDialogProps
} from './types'

export const DocumentTemplateDialog: FC<IDocumentTemplateDialogProps> = (
  props
) => {
  const context = useContext(TemplateSelectorContext)
  const [state, dispatch] = useReducer(reducer, initState())
  const selection = new Selection({
    onSelectionChanged: () => dispatch(SELECTION_CHANGED({ selection }))
  })

  useEffect(() => {
    if (context.error) {
      dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.Error }))
    }
  }, [context.error])

  /**
   * On copy documents to the selected target URL
   *
   * @param templates Templates
   */
  async function onStartCopy(templates: TemplateItem[]): Promise<void> {
    dispatch(START_COPY())
    const folder = SPDataAdapter.sp.web.getFolderByServerRelativeUrl(
      state.targetFolder
    )
    const filesAdded: FileAddResult[] = []

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i]
      dispatch(
        COPY_PROGRESS({
          description: template.newName,
          percentComplete: i / templates.length,
          iconProps: template.getIconProps({ size: 48 })
        })
      )
      try {
        filesAdded.push(await template.copyTo(folder))
      } catch (error) {}
    }
    selection.setItems([], true)
    dispatch(COPY_DONE({ files: filesAdded }))
  }

  /**
   * On close dialog
   */
  function onClose() {
    props.onDismiss({
      reload: state.screen === DocumentTemplateDialogScreen.Summary
    })
  }

  /**
   * Render content in the dialog based on the current screen.
   *
   * The following screens are available:
   * - `Select` - Select templates to copy
   * - `TargetFolder` - Select target folder
   * - `EditCopy` - Edit copy settings
   * - `CopyProgress` - Copy progress
   * - `Summary` - Summary
   * - `Error` - Error
   */
  function onRenderContent() {
    return (
      {
        [DocumentTemplateDialogScreen.Select]: (
          <SelectScreen selection={selection} selectedItems={state.selected} />
        ),
        [DocumentTemplateDialogScreen.TargetFolder]: <TargetFolderScreen />,
        [DocumentTemplateDialogScreen.EditCopy]: (
          <EditCopyScreen onStartCopy={onStartCopy} />
        ),
        [DocumentTemplateDialogScreen.CopyProgress]: (
          <CopyProgressScreen {...state.progress} />
        ),
        [DocumentTemplateDialogScreen.Summary]: (
          <InfoMessage
            type={MessageBarType.success}
            text={format(
              strings.DocumentTemplateDialogSummaryText,
              state.uploaded.length
            )}
          />
        ),
        [DocumentTemplateDialogScreen.Error]: (
          <InfoMessage
            type={MessageBarType.error}
            text={format(
              strings.DocumentTemplateDialogErrorText,
              context.templateLibrary.title
            )}
          />
        )
      }[state.screen] || null
    )
  }

  /**
   * On render footer
   */
  function onRenderFooter() {
    return (
      {
        [DocumentTemplateDialogScreen.Select]: (
          <>
            <PrimaryButton
              text={strings.OnSubmitSelectionText}
              onClick={() =>
                dispatch(
                  SET_SCREEN({
                    screen: DocumentTemplateDialogScreen.TargetFolder
                  })
                )
              }
              disabled={isEmpty(state.selected)}
            />
          </>
        ),
        [DocumentTemplateDialogScreen.Summary]: (
          <>
            <PrimaryButton
              text={strings.GetMoreText}
              onClick={() =>
                dispatch(
                  SET_SCREEN({ screen: DocumentTemplateDialogScreen.Select })
                )
              }
            />
            <DefaultButton text={strings.CloseModalText} onClick={onClose} />
          </>
        )
      }[state.screen] ?? null
    )
  }

  return (
    <DocumentTemplateDialogContext.Provider value={{ state, dispatch }}>
      <BaseDialog
        dialogContentProps={{ title: props.title }}
        modalProps={{
          isBlocking: state.locked,
          isDarkOverlay: state.locked
        }}
        onDismiss={onClose}
        containerClassName={styles.root}
      >
        <div className={styles.container}>{onRenderContent()}</div>
        <DialogFooter>{onRenderFooter()}</DialogFooter>
      </BaseDialog>
    </DocumentTemplateDialogContext.Provider>
  )
}

export * from './types'
