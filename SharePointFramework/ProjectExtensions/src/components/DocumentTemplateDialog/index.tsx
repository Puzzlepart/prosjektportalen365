/* eslint-disable @typescript-eslint/no-use-before-define */
import { format, Selection } from '@fluentui/react'
import { Button } from '@fluentui/react-components'
import * as strings from 'ProjectExtensionsStrings'
import React, { useReducer } from 'react'
import { isEmpty } from 'underscore'
import { SPDataAdapter } from '../../data'
import { TemplateItem } from '../../models/index'
import { BaseDialog } from '../@BaseDialog/index'
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
import { DocumentTemplateDialogScreen, IDocumentTemplateDialogProps } from './types'
import { IFileAddResult } from '@pnp/sp/files'
import { UserMessage } from 'pp365-shared-library'

export const DocumentTemplateDialog = (props: IDocumentTemplateDialogProps) => {
  const [state, dispatch] = useReducer(reducer, initState())
  const selection = new Selection({
    onSelectionChanged: () => dispatch(SELECTION_CHANGED({ selection }))
  })

  /**
   * On copy documents to the selected target URL
   *
   * @param templates Templates
   */
  async function onStartCopy(templates: TemplateItem[]): Promise<void> {
    dispatch(START_COPY())
    const folder = SPDataAdapter.sp.web.getFolderByServerRelativePath(state.targetFolder)
    const filesAdded: IFileAddResult[] = []

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
        const result = await template.copyTo(folder)
        if (result) {
          filesAdded.push(result)
        }
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

  /**
   * On render content
   */
  function onRenderContent() {
    return (
      {
        [DocumentTemplateDialogScreen.Select]: (
          <SelectScreen selection={selection} selectedItems={state.selected} />
        ),
        [DocumentTemplateDialogScreen.TargetFolder]: <TargetFolderScreen />,
        [DocumentTemplateDialogScreen.EditCopy]: <EditCopyScreen onStartCopy={onStartCopy} />,
        [DocumentTemplateDialogScreen.CopyProgress]: <CopyProgressScreen {...state.progress} />,
        [DocumentTemplateDialogScreen.Summary]: (
          <UserMessage
            title={strings.SummaryTitle}
            text={format(strings.SummaryMessage, state.uploaded.length)}
            intent='success'
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
            <Button
              appearance='primary'
              onClick={() =>
                dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.TargetFolder }))
              }
              disabled={isEmpty(state.selected)}
            >
              {strings.OnSubmitSelectionText}
            </Button>
          </>
        ),
        [DocumentTemplateDialogScreen.Summary]: (
          <>
            <Button
              appearance='primary'
              onClick={() => dispatch(SET_SCREEN({ screen: DocumentTemplateDialogScreen.Select }))}
            >
              {strings.GetMoreText}
            </Button>
            <Button appearance='secondary' onClick={onClose}>
              {strings.CloseModalText}
            </Button>
          </>
        )
      }[state.screen] || null
    )
  }

  return (
    <DocumentTemplateDialogContext.Provider value={{ state, dispatch }}>
      <BaseDialog
        title={props.title}
        isBlocking={state.locked}
        containerClassName={styles.root}
        onDismiss={onClose}
        footer={onRenderFooter()}
      >
        <div className={styles.container}>{onRenderContent()}</div>
      </BaseDialog>
    </DocumentTemplateDialogContext.Provider>
  )
}

export * from './types'
