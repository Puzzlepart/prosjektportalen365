import { Button } from '@fluentui/react-components'
import { UserMessage, format } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import { BaseDialog } from '../@BaseDialog/index'
import { CopyProgressScreen } from './CopyProgressScreen'
import { DocumentTemplateDialogContext } from './context'
import styles from './DocumentTemplateDialog.module.scss'
import { EditCopyScreen } from './EditCopyScreen'
import { SelectScreen } from './SelectScreen'
import { TargetFolderScreen } from './TargetFolderScreen'
import { DocumentTemplateDialogScreen, IDocumentTemplateDialogProps } from './types'
import { useDocumentTemplateDialog } from './useDocumentTemplateDialog'

/**
 * The «Hent dokumentmal» dialog: pick templates, pick the folder they go to, name the copies,
 * watch the copy, read the summary. The dialog owns the footer, so each screen's buttons sit in
 * the same place.
 */
export const DocumentTemplateDialog: FC<IDocumentTemplateDialogProps> = (props) => {
  const {
    state,
    dispatch,
    onStartCopy,
    goTo,
    copyHere,
    onClose,
    canSelect,
    canCopyHere,
    canStartCopy
  } = useDocumentTemplateDialog(props)

  const content = {
    [DocumentTemplateDialogScreen.Select]: <SelectScreen />,
    [DocumentTemplateDialogScreen.TargetFolder]: <TargetFolderScreen />,
    [DocumentTemplateDialogScreen.EditCopy]: <EditCopyScreen />,
    [DocumentTemplateDialogScreen.CopyProgress]: <CopyProgressScreen {...state.progress} />,
    [DocumentTemplateDialogScreen.Summary]: (
      <UserMessage
        title={strings.SummaryTitle}
        text={format(strings.SummaryMessage, state.uploaded.length)}
        intent='success'
      />
    )
  }[state.screen]

  const footer = {
    [DocumentTemplateDialogScreen.Select]: (
      <Button
        appearance='primary'
        disabled={!canSelect}
        onClick={() => goTo(DocumentTemplateDialogScreen.TargetFolder)}
      >
        {strings.OnSubmitSelectionText}
      </Button>
    ),
    [DocumentTemplateDialogScreen.TargetFolder]: (
      <>
        <Button appearance='primary' disabled={!canCopyHere} onClick={copyHere}>
          {strings.CopyHereText}
        </Button>
        <Button onClick={() => goTo(DocumentTemplateDialogScreen.Select)}>
          {strings.OnGoBackText}
        </Button>
      </>
    ),
    [DocumentTemplateDialogScreen.EditCopy]: (
      <>
        <Button appearance='primary' disabled={!canStartCopy} onClick={onStartCopy}>
          {strings.OnStartCopyText}
        </Button>
        <Button onClick={() => goTo(DocumentTemplateDialogScreen.TargetFolder)}>
          {strings.OnGoBackText}
        </Button>
      </>
    ),
    [DocumentTemplateDialogScreen.Summary]: (
      <>
        <Button appearance='primary' onClick={() => goTo(DocumentTemplateDialogScreen.Select)}>
          {strings.GetMoreText}
        </Button>
        <Button appearance='secondary' onClick={onClose}>
          {strings.CloseModalText}
        </Button>
      </>
    )
  }[state.screen]

  return (
    <DocumentTemplateDialogContext.Provider value={{ state, dispatch }}>
      <BaseDialog
        title={props.title}
        isBlocking={state.locked}
        containerClassName={styles.root}
        onDismiss={onClose}
        footer={footer}
      >
        <div className={styles.container}>{content ?? null}</div>
      </BaseDialog>
    </DocumentTemplateDialogContext.Provider>
  )
}

DocumentTemplateDialog.displayName = 'DocumentTemplateDialog'
