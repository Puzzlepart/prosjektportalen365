/* eslint-disable @typescript-eslint/no-use-before-define */
import { FileAddResult } from '@pnp/sp'
import { ActionButton } from 'office-ui-fabric-react/lib/Button'
import { Selection } from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'ProjectExtensionsStrings'
import React, { useReducer } from 'react'
import { isEmpty } from 'underscore'
import { SPDataAdapter } from '../../data'
import { TemplateItem } from '../../models/index'
import { BaseDialog } from '../@BaseDialog/index'
import { InfoMessage } from '../InfoMessage'
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
import { DocumentTemplateDialogScreen, IDocumentTemplateDialogProps } from './types'

export const DocumentTemplateDialog = (props: IDocumentTemplateDialogProps) => {
  const [state, dispatch] = useReducer(reducer, initState())
  const selection = new Selection({
    onSelectionChanged: () => dispatch(SELECTION_CHANGED({ selection }))
  })

  /**
   * On copy documents to web
   *
   * @param {TemplateItem[]} templates Templates
   * @param {string} folderServerRelativeUrl Folder URL
   */
  async function onStartCopy(
    templates: TemplateItem[],
    folderServerRelativeUrl: string
  ): Promise<void> {
    dispatch(START_COPY())
    const folder = SPDataAdapter.sp.web.getFolderByServerRelativeUrl(folderServerRelativeUrl)
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
    props.onDismiss({ reload: state.screen === DocumentTemplateDialogScreen.Summary })
  }

  function onRenderContent() {
    // eslint-disable-next-line default-case
    switch (state.screen) {
      case DocumentTemplateDialogScreen.Select: {
        return <SelectScreen selection={selection} selectedItems={state.selected} />
      }
      case DocumentTemplateDialogScreen.EditCopy: {
        return (
          <EditCopyScreen
            selectedTemplates={state.selected}
            onStartCopy={onStartCopy}
            onChangeScreen={(screen) => dispatch(SET_SCREEN({ screen }))}
          />
        )
      }
      case DocumentTemplateDialogScreen.CopyProgress: {
        return <CopyProgressScreen {...state.progress} />
      }
      case DocumentTemplateDialogScreen.Summary: {
        return (
          <InfoMessage
            type={MessageBarType.success}
            text={format(strings.SummaryText, state.uploaded.length)}
          />
        )
      }
    }
  }

  function onRenderFooter() {
    switch (state.screen) {
      case DocumentTemplateDialogScreen.Select: {
        return (
          <>
            <ActionButton
              text={strings.OnSubmitSelectionText}
              iconProps={{ iconName: 'CheckMark' }}
              onClick={() =>
                dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.EditCopy }))
              }
              disabled={isEmpty(state.selected)}
            />
          </>
        )
      }
      case DocumentTemplateDialogScreen.Summary: {
        return (
          <>
            <ActionButton
              text={strings.GetMoreText}
              iconProps={{ iconName: 'CirclePlus' }}
              onClick={() => dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.Select }))}
            />
            <ActionButton
              text={strings.CloseModalText}
              iconProps={{ iconName: 'ClosePane' }}
              onClick={onClose}
            />
          </>
        )
      }
      default: {
        return null
      }
    }
  }

  return (
    <BaseDialog
      dialogContentProps={{ title: props.title }}
      modalProps={{
        isBlocking: state.isBlocking,
        isDarkOverlay: state.isBlocking
      }}
      onRenderFooter={onRenderFooter}
      onDismiss={onClose}
      containerClassName={styles.root}>
      <div className={styles.container}>{onRenderContent()}</div>
    </BaseDialog>
  )
}

export * from './types'
export { IDocumentTemplateDialogProps }
